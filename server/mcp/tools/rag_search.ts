
export const ragSearchTool: async (input) => {
  
};


export const ragSearchSchema = {
  name: "rag_search",
  description: "Lets clients ask questions about Lev-Boots.",
  inputSchema: {
    type: "string",
    properties: {
      question: {
        type: "string",
        description: "The user question to be ask the Lev-Boots rag system",
      },
    },
    required: ["question"],
  },
};
