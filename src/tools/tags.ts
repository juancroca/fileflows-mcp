import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FileFlowsClient } from '../api.js';

export function registerTagTools(server: McpServer, client: FileFlowsClient): void {
  server.tool(
    'ff_list_tags',
    'List all FileFlows tags. Returns empty array (not an error) when unlicensed.',
    {},
    async () => {
      const data = await client.get('/api/tag');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_tag',
    'Get a tag by UID. Returns null (not 404) when unlicensed.',
    { uid: z.string().describe('Tag UID') },
    async ({ uid }) => {
      const data = await client.get(`/api/tag/${uid}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_tag_by_name',
    'Get a tag by name. Returns null (not 404) when unlicensed.',
    { name: z.string().describe('Tag name') },
    async ({ name }) => {
      const data = await client.get(`/api/tag/name/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_save_tag',
    'Create or update a tag. Returns 400 if unlicensed. Pass Uid as empty string or omit for new.',
    {
      name: z.string().describe('Tag name'),
      uid: z.string().optional().describe('Tag UID (omit or empty string to create new)'),
    },
    async ({ name, uid }) => {
      const body: Record<string, unknown> = { Name: name };
      if (uid) body['Uid'] = uid;
      const data = await client.post('/api/tag', body);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_delete_tags',
    'Delete one or more tags by UID. Silently does nothing (returns 200) when unlicensed.',
    { uids: z.array(z.string()).describe('Array of tag UIDs to delete') },
    async ({ uids }) => {
      await client.delete('/api/tag', { Uids: uids });
      return { content: [{ type: 'text', text: `Deleted tags: ${uids.join(', ')}` }] };
    }
  );
}
