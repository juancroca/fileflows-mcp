import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FileFlowsClient, SCHEDULE_ALL } from '../api.js';

// TaskType enum values
const TASK_TYPE_DESCRIPTION =
  'Task type: 0=Script, 1=Flow (check FileFlows docs for current enum values)';

export function registerTaskTools(server: McpServer, client: FileFlowsClient): void {
  server.tool(
    'ff_list_tasks',
    'List all FileFlows scheduled tasks',
    {},
    async () => {
      const data = await client.get('/api/task');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_task',
    'Get a scheduled task by UID',
    { uid: z.string().describe('Task UID') },
    async ({ uid }) => {
      const data = await client.get(`/api/task/${uid}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_task_by_name',
    'Get a scheduled task by name',
    { name: z.string().describe('Task name') },
    async ({ name }) => {
      const data = await client.get(`/api/task/name/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_save_task',
    'Create or update a scheduled task. Schedule is injected as all-1s if omitted to prevent a potential server-side null crash.',
    {
      task: z.record(z.unknown()).describe(
        'Task object. Required fields: Name (string), Type (int — ' +
          TASK_TYPE_DESCRIPTION +
          '). Optional: Uid (omit/empty to create), Enabled (bool), Flow (ObjectReference), Script (string), Schedule (672-char binary string).'
      ),
    },
    async ({ task }) => {
      const body = { ...task, Schedule: (task['Schedule'] as string) || SCHEDULE_ALL };
      const data = await client.post('/api/task', body);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_run_task',
    'Immediately execute a scheduled task by UID',
    { uid: z.string().describe('Task UID') },
    async ({ uid }) => {
      const data = await client.post(`/api/task/run/${uid}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_set_task_enabled',
    'Enable or disable a scheduled task',
    {
      uid: z.string().describe('Task UID'),
      enabled: z.boolean().describe('true to enable, false to disable'),
    },
    async ({ uid, enabled }) => {
      const data = await client.put(`/api/task/state/${uid}?enable=${enabled}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_delete_tasks',
    'Delete one or more scheduled tasks by UID',
    { uids: z.array(z.string()).describe('Array of task UIDs to delete') },
    async ({ uids }) => {
      await client.delete('/api/task', { Uids: uids });
      return { content: [{ type: 'text', text: `Deleted tasks: ${uids.join(', ')}` }] };
    }
  );
}
