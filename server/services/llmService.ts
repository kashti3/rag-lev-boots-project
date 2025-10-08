import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();
const genAI = new GoogleGenAI({});

export const createEmbedding = async (text: string): Promise<number[]> => {
    const response = await genAI.models.embedContent({
      model: 'gemini-embedding-001',
      contents: text,
      config: {
        outputDimensionality: 768,
      }
    });
  
    const embedding = response.embeddings?.[0]?.values;
    //console.log(`embedding result: ${JSON.stringify(embedding)}`)
    if (!embedding) throw new Error('No embedding returned');
    return embedding;
  };