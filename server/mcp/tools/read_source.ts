import { z } from 'zod';
import {readWebArticle} from '../../fetchers/webArticleFetcher';
import {readPDF} from '../../fetchers/pdfFetcher';
import {PDF_FILES, ARTICLE_IDS} from '../../config/constants';

export const readSourceTool = async (sourceName: string, sourceType?: string) => {
  // Auto-detect source type if not provided
  if (!sourceType) {
    if (PDF_FILES.includes(sourceName as any)) {
      sourceType = 'pdf';
    } else if (ARTICLE_IDS.includes(sourceName as any)) {
      sourceType = 'article';
    } else {
      throw new Error(`Unable to auto-detect source type for '${sourceName}'. Please specify sourceType as 'pdf' or 'article'.`);
    }
  }

  // Read the source based on type
  if (sourceType === "pdf") {
    return await readPDF(sourceName);
  } else if (sourceType === "article") {
    return await readWebArticle(sourceName);
  } else {
    throw new Error(`Invalid source type: ${sourceType}. Must be 'pdf' or 'article'.`);
  }
};

export const readSourceSchema = {
  name: "read_source",
  description: "Reads the full content of a PDF or article.",
  inputSchema: {
    sourceName: z.string().describe("The PDF filename or article ID"),
    sourceType: z.enum(["pdf", "article"]).optional().describe("Optional: 'pdf' or 'article'. If omitted, auto-detect based on source name")
  }
};