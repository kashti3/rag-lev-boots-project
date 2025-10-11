export const LLM_CONFIG = {
  thinkingBudget: 10000,
  model: 'gemini-1.5-pro',
  embeddingModel: 'gemini-embedding-001',
  embeddingDimensions: 768
};

export const RAG_CONFIG = {
  // Number of similar chunks to retrieve
  topK: 5,
  
  // System prompt template
  systemPromptTemplate: `You are a helpful assistant that answers questions based solely on the provided context. Do not use any external knowledge or make assumptions beyond what is explicitly stated in the context.

Context:
{context}

Instructions:
- Answer the question using ONLY the information provided in the context above
- If the context doesn't contain enough information to answer the question, clearly state that
- Cite the source(s) when providing information
- Be concise and direct in your response`,
  
  // Message when no relevant information is found
  noResultsMessage: "I couldn't find any relevant information in the knowledge base to answer your question.",
  
  // Error message
  errorMessage: "Failed to process the question. Please try again."
};

export const GATEKEEPER_CONFIG = {
  // Filtering thresholds per source type (0-10 scale)
  thresholds: {
    pdf: 3,
    slack: 7,
    'web-article': 5
  },
  
  // Slack message grouping configuration
  slack: {
    timeWindowMs: 5 * 60 * 1000, // 5 minutes
    minThreadSize: 2 // Minimum messages to consider as thread
  },
  
  // Model to use for gatekeeper decisions
  model: 'gemini-2.5-flash', // Using flash for faster, cheaper filtering
  
  // Enable detailed logging
  enableRejectionLogging: true
};