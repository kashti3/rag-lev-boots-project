import { fetchPDFs } from '../fetchers/pdfFetcher';
import { fetchSlackMessages } from '../fetchers/slackFetcher';
import { fetchWebArticles } from '../fetchers/webArticleFetcher';
import { createEmbedding } from './llmService';
import KnowledgeBase from '../models/KnowledgeBase';
import { QueryTypes } from 'sequelize';
import sequelize from '../config/database';
import { RAG_CONFIG } from '../config/constants';
import { PdfGatekeeper, SlackGatekeeper, WebArticleGatekeeper } from '../gatekeepers';
import { BaseGatekeeper } from '../gatekeepers';

const WORDS_PER_CHUNK = 400;

interface DataSource {
  source: string;
  content: string;
}

interface FetcherConfig {
  fetcher: () => Promise<DataSource[]>;
  sourceType: 'pdf' | 'slack' | 'web-article';
  gatekeeper: BaseGatekeeper;
}

// Initialize gatekeepers
const pdfGatekeeper = new PdfGatekeeper();
const slackGatekeeper = new SlackGatekeeper();
const webArticleGatekeeper = new WebArticleGatekeeper();

// Map fetchers to their gatekeepers
const dataFetchers: FetcherConfig[] = [
  { 
    fetcher: fetchPDFs, 
    sourceType: 'pdf',
    gatekeeper: pdfGatekeeper
  },
  { 
    fetcher: fetchSlackMessages, 
    sourceType: 'slack',
    gatekeeper: slackGatekeeper
  },
  { 
    fetcher: fetchWebArticles, 
    sourceType: 'web-article',
    gatekeeper: webArticleGatekeeper
  }
];

const chunkText = (text: string): string[] => {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += WORDS_PER_CHUNK) {
    const chunkWords = words.slice(i, i + WORDS_PER_CHUNK);
    chunks.push(chunkWords.join(' '));
  }
  return chunks;
};

export const loadAllData = async () => {
  try {
    console.log('Starting data loading process...');
    let totalAccepted = 0;
    let totalRejected = 0;

    for (const { fetcher, sourceType, gatekeeper } of dataFetchers) {
      console.log(`\n--- Processing ${sourceType} sources ---`);
      const sources = await fetcher();
      console.log(`Found ${sources.length} sources from ${sourceType} fetcher.`);

      for (const { source, content } of sources) {
        console.log(`\nProcessing ${source}...`);
        
        // Apply gatekeeper filtering
        console.log(`Applying ${sourceType} gatekeeper...`);
        let gatekeeperResult;
        
        // Special handling for Slack data if it comes as structured messages
        if (sourceType === 'slack' && gatekeeper instanceof SlackGatekeeper) {
          // Check if content is JSON array of messages
          try {
            const messages = JSON.parse(content);
            if (Array.isArray(messages)) {
              gatekeeperResult = await (gatekeeper as SlackGatekeeper).evaluateSlackData(messages);
            } else {
              gatekeeperResult = await gatekeeper.evaluate(content);
            }
          } catch {
            // Not JSON, process as plain text
            gatekeeperResult = await gatekeeper.evaluate(content);
          }
        } else {
          gatekeeperResult = await gatekeeper.evaluate(content);
        }

        if (!gatekeeperResult.isInformative) {
          console.log(`Content rejected by gatekeeper: ${gatekeeperResult.reason} (score: ${gatekeeperResult.score})`);
          totalRejected++;
          continue;
        }

        console.log(`Content accepted by gatekeeper (score: ${gatekeeperResult.score})`);
        totalAccepted++;

        // Process the filtered content
        const processedContent = gatekeeperResult.processedContent;
        if (!processedContent || processedContent.trim() === '') {
          console.log('No content to process after filtering.');
          continue;
        }

        // Chunk the processed content
        const chunks = chunkText(processedContent);
        console.log(`Split content into ${chunks.length} chunks.`);

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          if (chunk.trim() === '') continue;

          const existingChunk = await KnowledgeBase.findOne({
            where: {
              source: source,
              chunk_content: chunk,
            },
          });

          if (existingChunk) {
            console.log(`Chunk ${i + 1}/${chunks.length} already exists. Skipping.`);
            continue;
          }

          console.log(`Generating embedding for chunk ${i + 1}/${chunks.length}...`);
          const embedding = await createEmbedding(chunk);

          console.log(`Saving chunk ${i + 1} to the database...`);
          await KnowledgeBase.create({
            source,
            source_id: source,
            chunk_index: i,
            chunk_content: chunk,
            embeddings_768: embedding,
          });
        }
        console.log(`Finished processing ${source}.`);
      }
    }

    console.log('\n=== Data Loading Summary ===');
    console.log(`Total sources accepted: ${totalAccepted}`);
    console.log(`Total sources rejected: ${totalRejected}`);
    console.log(`Acceptance rate: ${((totalAccepted / (totalAccepted + totalRejected)) * 100).toFixed(1)}%`);
    console.log('Data loading complete.');
  } catch (error) {
    console.error('Error loading data:', error);
  }
};

export interface SimilarChunk {
  source: string;
  chunk_content: string;
  distance: number;
}

export const findSimilarChunks = async (embedding: number[]): Promise<SimilarChunk[]> => {
  console.log('Searching for similar content in knowledge base...');
  
  const similarChunks = await sequelize.query(
    `SELECT 
      source,
      chunk_content,
      embeddings_768 <=> CAST(:embedding AS vector) AS distance
    FROM knowledge_base
    WHERE embeddings_768 IS NOT NULL
    ORDER BY distance
    LIMIT :limit`,
    {
      replacements: {
        embedding: `[${embedding.join(',')}]`,
        limit: RAG_CONFIG.topK
      },
      type: QueryTypes.SELECT
    }
  ) as SimilarChunk[];

  return similarChunks;
};

export const formatChunksAsContext = (chunks: SimilarChunk[]): string => {
  return chunks
    .map((chunk, index) => `[Source ${index + 1}: ${chunk.source}]\n${chunk.chunk_content}`)
    .join('\n\n---\n\n');
};