import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FileFlowsClient } from '../api.js';

export function registerFlowTools(server: McpServer, client: FileFlowsClient): void {
  server.tool(
    'ff_list_flows',
    'List all FileFlows processing flows',
    {},
    async () => {
      const data = await client.get('/api/flow');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_flow',
    'Get a FileFlows flow by UID, including all nodes (Parts) and their connections. Use this to inspect or debug a flow.',
    { uid: z.string().describe('Flow UID') },
    async ({ uid }) => {
      const data = await client.get(`/api/flow/${uid}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_update_flow',
    'Update a FileFlows flow. You must pass the complete flow object (as returned by ff_get_flow) with your modifications applied. The flow is replaced in full.',
    { flow: z.record(z.unknown()).describe('Complete flow object with modifications applied') },
    async ({ flow }) => {
      const data = await client.put('/api/flow', flow);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_list_flow_elements',
    'List all available flow element types (nodes) that can be used in a flow, including their schemas and available outputs',
    {},
    async () => {
      const data = await client.get('/api/flow/elements');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
