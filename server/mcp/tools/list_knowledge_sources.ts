import { z } from 'zod';
import { ARTICLE_IDS, PDF_FILES } from "../../config/constants";

interface PDFSourceData {
    type: 'pdf';
    name: string;
  }

  interface WebArticleSourceData {
    type: 'article';
    id: string;
  }

interface KnowledgeSourcesData {
    pdfs: PDFSourceData[];
    articles: WebArticleSourceData[];
  }

export const listKnowledgeSourcesTool = async () : Promise<KnowledgeSourcesData> => {
    return {
        pdfs: PDF_FILES.map((pdf: string) => ({
            type: 'pdf' as const,
            name: pdf,
        })),
        articles: ARTICLE_IDS.map((article: string) => ({
            type: 'article' as const,
            id: article,
        })),
    };
};

export const listKnowledgeSourcesSchema = {
  name: "list_knowledge_sources",
  description: "Get list of all available knowledge sources.",
  inputSchema: {}
};