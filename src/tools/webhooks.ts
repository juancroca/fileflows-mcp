import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FileFlowsClient } from '../api.js';

export function registerWebhookTools(server: McpServer, client: FileFlowsClient): void {
  server.tool(
    'ff_list_webhooks',
    'List all webhooks. NOTE: Due to a known server-side bug, the Route field is never populated in responses — the list always returns empty even when webhooks exist in the database.',
    {},
    async () => {
      const data = await client.get('/api/webhook');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_webhook',
    'Get a webhook by UID. NOTE: Due to the same Route bug as ff_list_webhooks, the response Route field will always be null.',
    { uid: z.string().describe('Webhook UID') },
    async ({ uid }) => {
      const data = await client.get(`/api/webhook/${uid}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_save_webhook',
    'Save a webhook. NOTE: Due to a known server-side bug, this endpoint does NOT persist — it returns the input object unchanged with HTTP 200 but writes nothing to the database. Use the FileFlows UI to manage webhooks until this bug is fixed.',
    {
      webhook: z.record(z.unknown()).describe('Webhook object with Name (required) and other fields'),
    },
    async ({ webhook }) => {
      const data = await client.post('/api/webhook', webhook);
      return {
        content: [
          {
            type: 'text',
            text:
              'WARNING: Server-side bug — webhook was NOT persisted. The response object is the input returned unchanged.\n\n' +
              JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    'ff_delete_webhooks',
    'Delete one or more webhooks by UID. Silently does nothing (200) when unlicensed.',
    { uids: z.array(z.string()).describe('Array of webhook UIDs to delete') },
    async ({ uids }) => {
      await client.delete('/api/webhook', { Uids: uids });
      return { content: [{ type: 'text', text: `Delete requested for webhooks: ${uids.join(', ')}` }] };
    }
  );
}
