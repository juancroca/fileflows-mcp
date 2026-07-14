import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FileFlowsClient } from '../api.js';

export function registerResourceTools(server: McpServer, client: FileFlowsClient): void {
  server.tool(
    'ff_list_resources',
    'List all FileFlows resources (without binary content). Returns empty array (not 401) when AutoUpdates license is inactive.',
    {},
    async () => {
      const data = await client.get('/api/resource');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_resource',
    'Get a resource by UID including binary content. Returns null (not 404 or 401) when unlicensed or not found.',
    { uid: z.string().describe('Resource UID') },
    async ({ uid }) => {
      const data = await client.get(`/api/resource/${uid}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_resource_by_name',
    'Get a resource by name. Returns null (not 404) when not found or unlicensed.',
    { name: z.string().describe('Resource name') },
    async ({ name }) => {
      const data = await client.get(`/api/resource/name/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_save_resource',
    'Create or update a resource. Requires AutoUpdates license. Pass Uid as empty string or omit for new.',
    {
      resource: z.record(z.unknown()).describe('Resource object including Name, MimeType, and content data'),
    },
    async ({ resource }) => {
      const data = await client.post('/api/resource', resource);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_delete_resources',
    'Delete one or more resources by UID',
    { uids: z.array(z.string()).describe('Array of resource UIDs to delete') },
    async ({ uids }) => {
      await client.delete('/api/resource', { Uids: uids });
      return { content: [{ type: 'text', text: `Deleted resources: ${uids.join(', ')}` }] };
    }
  );
}
