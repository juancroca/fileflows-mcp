import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FileFlowsClient } from '../api.js';

export function registerSystemTools(server: McpServer, client: FileFlowsClient): void {
  server.tool(
    'ff_get_status',
    'Get live FileFlows system status: queue depth, currently processing files, and their progress percentage',
    {},
    async () => {
      const data = await client.get('/api/status');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_update_available_status',
    'Check whether a FileFlows update is available',
    {},
    async () => {
      const data = await client.get('/api/status/update-available');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_node_overview',
    'Get the status of all FileFlows processing nodes (workers)',
    {},
    async () => {
      const data = await client.get('/api/node/overview');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_version',
    'Get the current FileFlows server version',
    {},
    async () => {
      const data = await client.get('/api/system/version');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_profile',
    'Get the current authenticated user profile',
    {},
    async () => {
      const data = await client.get('/api/profile');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_nvidia_smi',
    'Get NVIDIA GPU information via nvidia-smi. Returns empty/default object if nvidia-smi is not present.',
    {},
    async () => {
      const data = await client.get('/api/nvidia/smi');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_pause_processing',
    'Pause all FileFlows processing for a specified duration. Set abort=true to also abort currently-running files.',
    {
      duration: z.number().int().describe('Duration in minutes to pause processing'),
      abort: z.boolean().optional().describe('When true, also abort currently-processing files (default false)'),
    },
    async ({ duration, abort = false }) => {
      const data = await client.post(`/api/system/pause?duration=${duration}&abort=${abort}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_restart_server',
    'Restart the FileFlows server. The process will exit (code 99) and be restarted by the container/service manager. All in-progress work is stopped.',
    {},
    async () => {
      await client.post('/api/system/restart');
      return { content: [{ type: 'text', text: 'Restart initiated — server is shutting down' }] };
    }
  );

  server.tool(
    'ff_get_processing_time_history',
    'Get library processing time history data for charts (min/Q1/median/Q3/max per library). Libraries with 10 or fewer data points are excluded.',
    {},
    async () => {
      const data = await client.get('/api/system/history-data/library-processing-time');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_processing_heatmap',
    'Get processing activity heatmap data',
    {},
    async () => {
      const data = await client.get('/api/system/history-data/processing-heatmap');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_language',
    'Get the list of available UI languages',
    {},
    async () => {
      const data = await client.get('/api/language');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_meta_info',
    'Get metadata information for a file by its MetaInfo UID (a string identifier, not a GUID). Returns null when unlicensed.',
    {
      uid: z.string().describe('MetaInfo identifier string'),
    },
    async ({ uid }) => {
      const data = await client.get(`/api/meta-info/${encodeURIComponent(uid)}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_node_update_version',
    'Get the version of the node updater binary available for download',
    {},
    async () => {
      const data = await client.get('/api/system/node-update-version');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_is_node_updater_available',
    'Check whether a node updater binary is available for download',
    {},
    async () => {
      const data = await client.get('/api/system/node-updater-available');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_browse_files',
    'Browse the FileFlows server file system. Pass "ROOT" as start to list drives. Pass a path to list its contents. Returns directory entries including a parent entry for navigation.',
    {
      start: z.string().optional().describe('Starting path. Use "ROOT" for root drives, omit to start at default directory.'),
      includeFiles: z.boolean().optional().describe('When true, include files in results (default false — directories only)'),
      extensions: z.array(z.string()).optional().describe('File extension filter (e.g. ["mkv","mp4"]). Empty means no filter.'),
    },
    async ({ start, includeFiles = false, extensions = [] }) => {
      const params = new URLSearchParams({ includeFiles: String(includeFiles) });
      if (start) params.set('start', start);
      extensions.forEach(ext => params.append('extensions', ext));
      const data = await client.get(`/api/file-browser?${params}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_file_integrations',
    'Get integration data (Emby/Plex metadata) for a file by MetaId or path',
    {
      metaId: z.string().optional().describe('MetaID (e.g. "tmdb-12345")'),
      path: z.string().optional().describe('File path for fallback lookup'),
    },
    async ({ metaId, path }) => {
      const body: Record<string, unknown> = {};
      if (metaId) body['MetaId'] = metaId;
      if (path) body['Path'] = path;
      const data = await client.post('/api/library-file/integrations', body);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
