import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FileFlowsClient, SCHEDULE_ALL } from '../api.js';

export function registerNodeTools(server: McpServer, client: FileFlowsClient): void {
  server.tool(
    'ff_list_nodes',
    'List all FileFlows processing nodes with full details including schedule, runner count, and status',
    {},
    async () => {
      const data = await client.get('/api/node');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_node',
    'Get full details of a specific processing node by UID including schedule, mappings, and runner configuration',
    { uid: z.string().describe('Node UID') },
    async ({ uid }) => {
      const data = await client.get(`/api/node/${uid}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_list_nodes_slim',
    'Get a slim list of processing nodes: UID, Name, OperatingSystem, Architecture only',
    {},
    async () => {
      const data = await client.get('/api/node/list');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_save_node',
    'Update a processing node. Fetch the current node with ff_get_node, apply changes, then pass the full object here. ' +
      'Schedule is always injected as all-1s (always-on) to prevent a server-side null crash if omitted. ' +
      'To set Flow Runners to 1 (fixes instability on low-core hardware): fetch the node, set FlowRunners=1, pass here. ' +
      'Note: ProcessingOrder=1000 is a server sentinel meaning "no order" — do not send 1000 to set an order. ' +
      'The internal node name/address/mappings are locked server-side and cannot be updated.',
    {
      node: z.record(z.unknown()).describe('Complete node object with modifications applied (from ff_get_node)'),
    },
    async ({ node }) => {
      const body = { ...node, Schedule: (node['Schedule'] as string) || SCHEDULE_ALL };
      const data = await client.post('/api/node', body);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_set_node_enabled',
    'Enable or disable a processing node',
    {
      uid: z.string().describe('Node UID'),
      enabled: z.boolean().describe('true to enable, false to disable'),
    },
    async ({ uid, enabled }) => {
      const data = await client.put(`/api/node/state/${uid}?enable=${enabled}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_delete_nodes',
    'Delete one or more processing nodes. Do NOT include the internal node UID — deleting it throws a server error (500).',
    { uids: z.array(z.string()).describe('Array of node UIDs to delete (external nodes only)') },
    async ({ uids }) => {
      await client.delete('/api/node', { Uids: uids });
      return { content: [{ type: 'text', text: `Deleted nodes: ${uids.join(', ')}` }] };
    }
  );
}
