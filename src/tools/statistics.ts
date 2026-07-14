import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FileFlowsClient } from '../api.js';

export function registerStatisticsTools(server: McpServer, client: FileFlowsClient): void {
  server.tool(
    'ff_get_storage_saved',
    'Get storage saved statistics grouped by library. Returns top 4 libraries by savings plus an "Other" bucket and a "Total" row — these aggregations are server-side and cannot be controlled.',
    {},
    async () => {
      const data = await client.get('/api/statistics/storage-saved');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_storage_saved_raw',
    'Get raw storage saved data. Only days=31 is meaningful (maps to STORAGE_SAVED_MONTH); all other values map to the same STORAGE_SAVED key.',
    {
      days: z.number().int().optional().describe('Number of days (only 31 has a distinct meaning; default behaviour returns all-time data)'),
    },
    async ({ days = 0 }) => {
      const data = await client.get(`/api/statistics/storage-saved-raw?days=${days}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_running_totals',
    'Get running total statistics by name',
    { name: z.string().describe('Statistics name key') },
    async ({ name }) => {
      const data = await client.get(`/api/statistics/running-totals/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_statistics_average',
    'Get average statistics by name',
    { name: z.string().describe('Statistics name key') },
    async ({ name }) => {
      const data = await client.get(`/api/statistics/average/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_record_running_total',
    'Record a running total statistic (increments the counter for the given name)',
    {
      name: z.string().describe('Statistics name key'),
      value: z.string().describe('Value to record'),
    },
    async ({ name, value }) => {
      await client.post(`/api/statistics/record-running-total?name=${encodeURIComponent(name)}&value=${encodeURIComponent(value)}`);
      return { content: [{ type: 'text', text: `Recorded running total: ${name}=${value}` }] };
    }
  );

  server.tool(
    'ff_record_statistics_average',
    'Record an average statistic sample',
    {
      name: z.string().describe('Statistics name key'),
      value: z.number().int().describe('Integer value to record'),
    },
    async ({ name, value }) => {
      await client.post(`/api/statistics/record-average?name=${encodeURIComponent(name)}&value=${value}`);
      return { content: [{ type: 'text', text: `Recorded average: ${name}=${value}` }] };
    }
  );

  server.tool(
    'ff_clear_statistics',
    'Clear statistics data. If name is omitted, ALL statistics are cleared.',
    {
      name: z.string().optional().describe('Statistics name to clear (omit to clear all statistics)'),
    },
    async ({ name }) => {
      const path = name ? `/api/statistics/clear?name=${encodeURIComponent(name)}` : '/api/statistics/clear';
      await client.post(path);
      return { content: [{ type: 'text', text: name ? `Cleared statistics: ${name}` : 'Cleared all statistics' }] };
    }
  );
}
