import { z } from 'zod';
import { ask } from '../../services/ragService';

export const ragSearchTool = async (input: string) => {
  return await ask(input);
};

export const ragSearchSchema = {
  name: "rag_search",
  description: "Lets clients ask questions about Lev-Boots.",
  inputSchema: {
    question: z.string().describe("The user question to be ask the Lev-Boots rag system")
  }
};
