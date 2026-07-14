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
}
