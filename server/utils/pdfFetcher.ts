
import fs from 'fs/promises';
import path from 'path';
import { pdf } from 'pdf-parse';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pdfsDirectory = path.join(__dirname, '../knowledge_pdfs');

interface PDFData {
  source: string;
  content: string;
}

export const fetchPDFs = async (): Promise<PDFData[]> => {
  try {
    console.log("fetching pdfs data")
    const files = await fs.readdir(pdfsDirectory);
    const pdfPromises = files
      .filter((file) => path.extname(file).toLowerCase() === '.pdf')
      .map(async (file) => {
        const filePath = path.join(pdfsDirectory, file);
        const dataBuffer = await fs.readFile(filePath);
        const data = await pdf(dataBuffer);
        return {
          source: file,
          content: data.text,
        };
      });
      console.log("fetching pdfs data before promise")
    return Promise.all(pdfPromises);
  } catch (error) {
    console.error('Error fetching PDFs:', error);
    return [];
  }
};
