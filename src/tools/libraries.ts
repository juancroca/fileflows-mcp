import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FileFlowsClient, SCHEDULE_ALL } from '../api.js';

export function registerLibraryTools(server: McpServer, client: FileFlowsClient): void {
  server.tool(
    'ff_list_libraries',
    'List all FileFlows libraries with their current status (enabled, path, last scanned, file counts)',
    {},
    async () => {
      const data = await client.get('/api/library');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_library',
    'Get detailed information about a specific FileFlows library by UID',
    { uid: z.string().describe('Library UID') },
    async ({ uid }) => {
      const data = await client.get(`/api/library/${uid}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_create_library',
    'Create a new FileFlows library. The library will be disabled by default after creation — use ff_enable_library to enable it.',
    {
      name: z.string().describe('Library name'),
      path: z.string().describe('Absolute path to the media directory on the server'),
      flowUid: z.string().describe('UID of the flow to assign to this library'),
      flowName: z.string().describe('Name of the flow (must match the flow UID)'),
      extensions: z.array(z.string()).optional().describe('File extensions to watch, e.g. ["mkv","mp4"]. Defaults to common video formats.'),
    },
    async ({ name, path, flowUid, flowName, extensions }) => {
      const body = {
        Name: name,
        Path: path,
        Flow: { Uid: flowUid, Name: flowName },
        Extensions: extensions ?? ['mkv', 'mp4', 'avi', 'ts', 'm2ts', 'mov'],
        Schedule: SCHEDULE_ALL,
      };
      const data = await client.post('/api/library', body);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_delete_library',
    'Delete one or more FileFlows libraries by UID',
    { uids: z.array(z.string()).describe('Array of library UIDs to delete') },
    async ({ uids }) => {
      await client.delete('/api/library', { Uids: uids });
      return { content: [{ type: 'text', text: `Deleted libraries: ${uids.join(', ')}` }] };
    }
  );

  server.tool(
    'ff_set_library_enabled',
    'Enable or disable a FileFlows library',
    {
      uid: z.string().describe('Library UID'),
      enabled: z.boolean().describe('true to enable, false to disable'),
    },
    async ({ uid, enabled }) => {
      await client.put(`/api/library/state/${uid}?enable=${enabled}`);
      return { content: [{ type: 'text', text: `Library ${uid} ${enabled ? 'enabled' : 'disabled'}` }] };
    }
  );

  server.tool(
    'ff_rescan_library',
    'Trigger a file-system rescan on specific libraries',
    { uids: z.array(z.string()).describe('Array of library UIDs to rescan') },
    async ({ uids }) => {
      await client.put('/api/library/rescan', { Uids: uids });
      return { content: [{ type: 'text', text: `Rescan triggered for libraries: ${uids.join(', ')}` }] };
    }
  );

  server.tool(
    'ff_rescan_all_libraries',
    'Trigger a file-system rescan on all enabled FileFlows libraries',
    {},
    async () => {
      await client.post('/api/library/rescan-enabled');
      return { content: [{ type: 'text', text: 'Rescan triggered for all enabled libraries' }] };
    }
  );

  server.tool(
    'ff_reset_library',
    'Reset all processed files in one or more libraries back to unprocessed status, causing them to be requeued. Use with caution — this affects all files in the library.',
    { uids: z.array(z.string()).describe('Array of library UIDs to reset') },
    async ({ uids }) => {
      await client.put('/api/library/reset', { Uids: uids });
      return { content: [{ type: 'text', text: `Reset triggered for libraries: ${uids.join(', ')}` }] };
    }
  );

  server.tool(
    'ff_update_library',
    'Update an existing FileFlows library. Fetch the current library with ff_get_library, apply your changes, then pass the full object here. The Schedule field is always injected automatically to avoid a server-side null-reference error.',
    { library: z.record(z.unknown()).describe('Complete library object with modifications applied (from ff_get_library)') },
    async ({ library }) => {
      const body = { ...library, Schedule: SCHEDULE_ALL };
      const data = await client.post('/api/library', body);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_library_list',
    'Get a slim list of all libraries (Uid, Name, basic metadata — no Schedule). Cheaper than ff_list_libraries.',
    {},
    async () => {
      const data = await client.get('/api/library/list');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_duplicate_library',
    'Duplicate a library. The duplicate is created disabled with a unique name and a reset last-scan timestamp. Cannot duplicate the Manual Library.',
    { uid: z.string().describe('Library UID to duplicate') },
    async ({ uid }) => {
      const data = await client.post(`/api/library/duplicate/${uid}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_migrate_library',
    'Migrate a library to a new path. Updates the path and optionally the output path.',
    {
      uid: z.string().describe('Library UID to migrate'),
      destination: z.string().describe('New destination path for the library'),
      updateOutputPath: z.boolean().optional().describe('When true, also update the output path (default false)'),
    },
    async ({ uid, destination, updateOutputPath = false }) => {
      const data = await client.post(
        `/api/library/migrate/${uid}?updateOutputPath=${updateOutputPath}`,
        destination
      );
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
