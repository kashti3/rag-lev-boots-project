import { loadAllData as loadAllDataFromService, findSimilarChunks, formatChunksAsContext } from './dataService';
import { createEmbedding, askGemini } from './llmService';
import { LLM_CONFIG, RAG_CONFIG } from '../config/constants';

export const loadAllData = async () => {
  await loadAllDataFromService();
};

export const ask = async (userQuestion: string): Promise<string> => {
  try {
    // Step 1: Embed the user question
    console.log('Embedding user question...');
    const questionEmbedding = await createEmbedding(userQuestion);

    // Step 2: Run similarity search on the database
    const similarChunks = await findSimilarChunks(questionEmbedding);

    if (similarChunks.length === 0) {
      return RAG_CONFIG.noResultsMessage;
    }

    // Step 3: Construct a prompt using the retrieved chunks
    const context = formatChunksAsContext(similarChunks);

    const systemPrompt = RAG_CONFIG.systemPromptTemplate.replace('{context}', context);

    // Step 4: Ask the LLM to answer based on retrieved content
    console.log('Generating answer from LLM...');
    const answer = await askGemini(LLM_CONFIG.model, systemPrompt, userQuestion);

    // Step 5: Return the answer
    return answer;
  } catch (error) {
    console.error('Error in ask function:', error);
    throw new Error(RAG_CONFIG.errorMessage);
  }
};
