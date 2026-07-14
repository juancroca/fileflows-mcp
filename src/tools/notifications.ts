import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FileFlowsClient } from '../api.js';

export function registerNotificationTools(server: McpServer, client: FileFlowsClient): void {
  server.tool(
    'ff_list_notifications',
    'List all unread FileFlows notifications. WARNING: reading the list is a destructive operation — the server marks all notifications as read immediately on GET.',
    {},
    async () => {
      const data = await client.get('/api/notification');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_dismiss_notification',
    'Dismiss (delete) a single notification by UID',
    { uid: z.string().describe('Notification UID') },
    async ({ uid }) => {
      await client.delete(`/api/notification/${uid}`);
      return { content: [{ type: 'text', text: `Dismissed notification ${uid}` }] };
    }
  );

  server.tool(
    'ff_dismiss_all_notifications',
    'Dismiss (delete) all notifications',
    {},
    async () => {
      await client.delete('/api/notification/dismiss-all');
      return { content: [{ type: 'text', text: 'All notifications dismissed' }] };
    }
  );
}
