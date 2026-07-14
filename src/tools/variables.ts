import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FileFlowsClient } from '../api.js';

export function registerVariableTools(server: McpServer, client: FileFlowsClient): void {
  server.tool(
    'ff_list_variables',
    'List all FileFlows global variables',
    {},
    async () => {
      const data = await client.get('/api/variable');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_variable',
    'Get a global variable by UID',
    { uid: z.string().describe('Variable UID') },
    async ({ uid }) => {
      const data = await client.get(`/api/variable/${uid}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_variable_by_name',
    'Get a global variable by name',
    { name: z.string().describe('Variable name') },
    async ({ name }) => {
      const data = await client.get(`/api/variable/name/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_save_variable',
    'Create or update a global variable. Pass Uid as empty string or omit for new; pass the existing UID to update.',
    {
      name: z.string().describe('Variable name'),
      value: z.string().describe('Variable value'),
      uid: z.string().optional().describe('Variable UID (omit or empty string to create new)'),
    },
    async ({ name, value, uid }) => {
      const body: Record<string, unknown> = { Name: name, Value: value };
      if (uid) body['Uid'] = uid;
      const data = await client.post('/api/variable', body);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_delete_variables',
    'Delete one or more global variables by UID',
    { uids: z.array(z.string()).describe('Array of variable UIDs to delete') },
    async ({ uids }) => {
      await client.delete('/api/variable', { Uids: uids });
      return { content: [{ type: 'text', text: `Deleted variables: ${uids.join(', ')}` }] };
    }
  );
}
