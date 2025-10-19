
import fs from 'fs/promises';
import path from 'path';
import { PDFParse } from 'pdf-parse';
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
        const content = await readPDF(file);
        return {
          source: file,
          content: content,
        };
      });
      console.log("fetching pdfs data before promise")
    return Promise.all(pdfPromises);
  } catch (error) {
    console.error('Error fetching PDFs:', error);
    return [];
  }
};

export const readPDF = async (sourceName: string) => {
  const filePath = path.join(pdfsDirectory, sourceName);
  const dataBuffer = await fs.readFile(filePath);
  const pdfParser = new PDFParse({ data: dataBuffer });
  const data = await pdfParser.getText();
  const text = data.text;
  await pdfParser.destroy();
  return text;
};
