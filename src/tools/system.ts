import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { FileFlowsClient } from '../api.js';

export function registerSystemTools(server: McpServer, client: FileFlowsClient): void {
  server.tool(
    'ff_get_status',
    'Get live FileFlows system status: queue depth, currently processing files, and their progress percentage',
    {},
    async () => {
      const data = await client.get('/api/status');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_node_overview',
    'Get the status of all FileFlows processing nodes (workers)',
    {},
    async () => {
      const data = await client.get('/api/node/overview');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
