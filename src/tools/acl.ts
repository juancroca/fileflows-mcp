import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FileFlowsClient } from '../api.js';

export function registerAclTools(server: McpServer, client: FileFlowsClient): void {
  server.tool(
    'ff_list_acl',
    'List access control entries, optionally filtered by type',
    {
      type: z.number().int().optional().describe('AccessControlType enum value to filter by (omit for all)'),
    },
    async ({ type }) => {
      const path = type !== undefined ? `/api/acl?type=${type}` : '/api/acl';
      const data = await client.get(path);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_save_acl_entry',
    'Create or update an access control entry. Order is auto-assigned on create (max of same type + 1). Pass Uid as empty string or omit for new.',
    {
      entry: z.record(z.unknown()).describe(
        'ACL entry object. Required: Type (int — AccessControlType enum). Optional: Uid (omit/empty to create), Order (auto-assigned on create).'
      ),
    },
    async ({ entry }) => {
      const data = await client.post('/api/acl', entry);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_delete_acl_entries',
    'Delete one or more access control entries by UID',
    { uids: z.array(z.string()).describe('Array of ACL entry UIDs to delete') },
    async ({ uids }) => {
      await client.delete('/api/acl', { Uids: uids });
      return { content: [{ type: 'text', text: `Deleted ACL entries: ${uids.join(', ')}` }] };
    }
  );

  server.tool(
    'ff_move_acl_entry',
    'Move an ACL entry up or down in the order list',
    {
      uid: z.string().describe('UID of the ACL entry to move'),
      type: z.number().int().describe('AccessControlType enum — scope of the reorder'),
      up: z.boolean().describe('true to move up, false to move down'),
    },
    async ({ uid, type, up }) => {
      await client.post(`/api/acl/move?type=${type}&up=${up}`, { Uids: [uid] });
      return { content: [{ type: 'text', text: `Moved ACL entry ${uid} ${up ? 'up' : 'down'}` }] };
    }
  );
}
