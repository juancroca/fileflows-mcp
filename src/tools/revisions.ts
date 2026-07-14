import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FileFlowsClient } from '../api.js';

export function registerRevisionTools(server: McpServer, client: FileFlowsClient): void {
  server.tool(
    'ff_list_revisions',
    'List all revisioned objects. Returns empty array when unlicensed.',
    {},
    async () => {
      const data = await client.get('/api/revision/list');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_object_revisions',
    'Get revision history for a specific object by its UID. Returns empty list when unlicensed.',
    { uid: z.string().describe('UID of the object whose revision history to fetch') },
    async ({ uid }) => {
      const data = await client.get(`/api/revision/${uid}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_revision',
    'Get a specific revision of an object',
    {
      dboUid: z.string().describe('UID of the object'),
      revisionUid: z.string().describe('UID of the specific revision to retrieve'),
    },
    async ({ dboUid, revisionUid }) => {
      const data = await client.get(`/api/revision/${dboUid}/revision/${revisionUid}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_restore_revision',
    'Restore an object to a previous revision. Silent no-op when unlicensed.',
    {
      revisionUid: z.string().describe('UID of the revision to restore from'),
      objectUid: z.string().describe('UID of the object to restore'),
    },
    async ({ revisionUid, objectUid }) => {
      await client.put(`/api/revision/${revisionUid}/restore/${objectUid}`);
      return { content: [{ type: 'text', text: `Restored object ${objectUid} to revision ${revisionUid}` }] };
    }
  );
}
