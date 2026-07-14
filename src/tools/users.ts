import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FileFlowsClient } from '../api.js';

// Password sentinel: when the GET response shows "**************" (14 asterisks),
// sending that exact string back in a POST means "keep existing password unchanged".
// Sending any other value (including empty) will replace/auto-generate the password.
const PASSWORD_SENTINEL = '**************';

export function registerUserTools(server: McpServer, client: FileFlowsClient): void {
  server.tool(
    'ff_list_users',
    'List all FileFlows users. Requires UserSecurity license. Returns empty list (not 401) when unlicensed. Passwords are always masked as 14 asterisks in responses.',
    {},
    async () => {
      const data = await client.get('/api/user');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_save_user',
    `Create or update a FileFlows user. Password handling: pass "${PASSWORD_SENTINEL}" (exactly 14 asterisks) to keep the existing password unchanged on update. Any other value replaces the password. Empty/null triggers auto-generation.`,
    {
      user: z.record(z.unknown()).describe(
        `User object. Fields: Name (string, required), Email (string), Role (int), Uid (string — omit/empty to create). Password: pass "${PASSWORD_SENTINEL}" to preserve existing, or a new password string to change it.`
      ),
    },
    async ({ user }) => {
      const data = await client.post('/api/user', user);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_user',
    'Get a specific user by UID. Password is masked as 14 asterisks. This endpoint is SwaggerIgnore — not in generated API docs but exists in source.',
    { uid: z.string().describe('User UID') },
    async ({ uid }) => {
      const data = await client.get(`/api/user/${uid}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_delete_users',
    'Delete one or more FileFlows users. Cannot delete your own account.',
    { uids: z.array(z.string()).describe('Array of user UIDs to delete') },
    async ({ uids }) => {
      await client.delete('/api/user', { Uids: uids });
      return { content: [{ type: 'text', text: `Deleted users: ${uids.join(', ')}` }] };
    }
  );
}
