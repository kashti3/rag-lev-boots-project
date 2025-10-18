import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ragSearchTool, ragSearchSchema } from "./tools/rag_search";
import { listKnowledgeSourcesTool, listKnowledgeSourcesSchema } from "./tools/list_knowledge_sources";
import { readSourceTool, readSourceSchema } from "./tools/read_source";

const mcpServer = new McpServer({
    name: "lev-boots-mcp-server",
    version: "1.0.0",
});

// Register rag_search tool
mcpServer.registerTool(
    ragSearchSchema.name,
    {
        description: ragSearchSchema.description,
        inputSchema: ragSearchSchema.inputSchema
    },
    async (params: any) => {
        return {
            content: [{
                type: "text",
                text: await ragSearchTool(params.question)
            }]
        };
    }
);

// Register list_knowledge_sources tool
mcpServer.registerTool(
    listKnowledgeSourcesSchema.name,
    {
        description: listKnowledgeSourcesSchema.description,
        inputSchema: listKnowledgeSourcesSchema.inputSchema
    },
    async () => {
        const result = await listKnowledgeSourcesTool();
        return {
            content: [{
                type: "text",
                text: JSON.stringify(result, null, 2)
            }]
        };
    }
);

// Register read_source tool
mcpServer.registerTool(
    readSourceSchema.name,
    {
        description: readSourceSchema.description,
        inputSchema: readSourceSchema.inputSchema
    },
    async (params: any) => {
        return {
            content: [{
                type: "text",
                text: await readSourceTool(params.sourceName, params.sourceType)
            }]
        };
    }
);

const transport = new StdioServerTransport();
await mcpServer.connect(transport);