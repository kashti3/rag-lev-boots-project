import { PDF_FILES } from "../../config/constants";

interface PDFSourceData {
    type: string; = "pdf";
    name: string;
  }

  interface WebArticleSourceData {
    type: string; = "articles";
    id: string;
  }

interface KnowledgeSourcesData {
    pdfs: PDFSourceData[];
    articles: WebArticleSourceData[];
  }

export const listKnowledgeSourcesTool = async () : Promise<KnowledgeSourcesData> => {
    
};


export const listKnowledgeSourcesSchema = {
  name: "list_knowledge_sources",
  description: "Get list of all available knowledge sources.",
  inputSchema: {
    type: "none",
  },
};