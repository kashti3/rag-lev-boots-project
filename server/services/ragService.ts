// Make sure you've reviewd the README.md file to understand the task and the RAG flow

import { loadAllData as loadAllDataFromService } from './dataService';

export const loadAllData = async () => {
  await loadAllDataFromService();
};

export const ask = async (userQuestion: string): Promise<string> => {
  const placeholderAnswer = `Generate the answer based off the ${userQuestion}`;

  return placeholderAnswer;
};
