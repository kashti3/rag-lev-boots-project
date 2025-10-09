import { fetchPDFs } from '../utils/pdfFetcher';
import { fetchSlackMessages } from '../utils/slackFetcher';
import { fetchWebArticles } from '../utils/webArticleFetcher';
import { createEmbedding } from './llmService';
import KnowledgeBase from '../models/KnowledgeBase';
import { QueryTypes } from 'sequelize';
import sequelize from '../config/database';
import { RAG_CONFIG } from '../config/constants';

const WORDS_PER_CHUNK = 400;

interface DataSource {
  source: string;
  content: string;
}

type DataFetcher = () => Promise<DataSource[]>;

const dataFetchers: DataFetcher[] = [
  fetchPDFs,
  fetchSlackMessages,
  fetchWebArticles,
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

    for (const fetcher of dataFetchers) {
      const sources = await fetcher();
      console.log(`Found ${sources.length} sources from a fetcher.`);

      for (const { source, content } of sources) {
        console.log(`Processing ${source}...`);
        const chunks = chunkText(content);
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
          // console.log(`
          //   source: ${source}
          //   source_id: ${source}
          //   chunk_index: ${i}
          //   chunk_content: ${chunk}
          //   embeddings: ${embedding}
          //   `);
          await KnowledgeBase.create({
            source,
            source_id: source, // Or a more specific ID if available
            chunk_index: i,
            chunk_content: chunk,
            embeddings_768: embedding,
          });
        }
        console.log(`Finished processing ${source}.`);
      }
    }

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