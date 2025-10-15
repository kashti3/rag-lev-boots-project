import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {} from ""


const mcpServer = new McpServer({
    name: "lev-boots-mcp-server",
    version: "1.0.0",
});

mcpServer.registerTool('rag_search', {
    title: 'Show current currency',
    description: 'Returns the current currency according to the user currency type request, otherwise show dollars',
    inputSchema: {
      fromCurrency: z.string(),
      toCurrency: z.string()
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  }, async ({ fromCurrency, toCurrency }) => {
  
  });
  
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);