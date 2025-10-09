import { ContentEmbedding, GoogleGenAI } from '@google/genai';
import { LLM_CONFIG } from '../config/constants';
import dotenv from 'dotenv';

dotenv.config();
const gemini = new GoogleGenAI({});

export const askGemini = async (
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> => {
  try {
    const result = await gemini.models.generateContent({
      model,
      contents: [
        { role: 'model', parts: [{ text: systemPrompt }] }, // model == system
        { role: 'user', parts: [{ text: userPrompt }] },
      ],
      config: {
        thinkingConfig: {
          thinkingBudget: LLM_CONFIG.thinkingBudget,
        },
      },
    });
    const response = result;
    return response.text || '';
  } catch (error) {
    console.error('Error generating content with LLM:', error);
    throw error;
  }
};

export const embedContent = async (
  content: string
): Promise<ContentEmbedding[]> => {
  try {
    const result = await gemini.models.embedContent({
      model: LLM_CONFIG.embeddingModel,
      contents: content,
      config: {
        outputDimensionality: LLM_CONFIG.embeddingDimensions,
      },
    });
    return result.embeddings || [];
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
};

// Keep the old createEmbedding function for backward compatibility
export const createEmbedding = async (text: string): Promise<number[]> => {
  const embeddings = await embedContent(text);
  const embedding = embeddings[0]?.values;
  if (!embedding) throw new Error('No embedding returned');
  return embedding;
};