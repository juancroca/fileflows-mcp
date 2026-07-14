import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FileFlowsClient } from '../api.js';

export function registerReportTools(server: McpServer, client: FileFlowsClient): void {
  server.tool(
    'ff_list_report_definitions',
    'List all available report definitions. Returns 400 "Not licensed" if Reporting license flag is inactive.',
    {},
    async () => {
      const data = await client.get('/api/report/definitions');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_report_definition',
    'Get a specific report definition by UID',
    { uid: z.string().describe('Report definition UID') },
    async ({ uid }) => {
      const data = await client.get(`/api/report/definition/${uid}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_generate_report',
    'Generate a report. Returns 400 if unlicensed or no matching data. When the "Email" key is present in parameters, the report is sent asynchronously and the endpoint returns immediately — email failures are not reflected in the HTTP response.',
    {
      uid: z.string().describe('Report definition UID'),
      parameters: z.record(z.unknown()).optional().describe(
        'Report parameters as key-value pairs. Include "Email" key with an email address to send the report by email asynchronously.'
      ),
    },
    async ({ uid, parameters = {} }) => {
      const data = await client.post(`/api/report/generate/${uid}`, parameters);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_list_scheduled_reports',
    'List all scheduled reports, ordered by name',
    {},
    async () => {
      const data = await client.get('/api/scheduled-report');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_scheduled_report',
    'Get a scheduled report by UID. Returns 404 if not found.',
    { uid: z.string().describe('Scheduled report UID') },
    async ({ uid }) => {
      const data = await client.get(`/api/scheduled-report/${uid}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_save_scheduled_report',
    'Create or update a scheduled report. Pass Uid as empty string or omit for new. The service handles insert vs update based on whether Uid is empty.',
    {
      report: z.record(z.unknown()).describe('ScheduledReport object'),
    },
    async ({ report }) => {
      const data = await client.post('/api/scheduled-report', report);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_set_scheduled_report_enabled',
    'Enable or disable a scheduled report. Returns 400 (not 404) if not found — inconsistent with ff_get_scheduled_report which uses 404.',
    {
      uid: z.string().describe('Scheduled report UID'),
      enabled: z.boolean().describe('true to enable, false to disable'),
    },
    async ({ uid, enabled }) => {
      const data = await client.put(`/api/scheduled-report/state/${uid}?enable=${enabled}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_delete_scheduled_reports',
    'Delete one or more scheduled reports by UID',
    { uids: z.array(z.string()).describe('Array of scheduled report UIDs to delete') },
    async ({ uids }) => {
      await client.delete('/api/scheduled-report', { Uids: uids });
      return { content: [{ type: 'text', text: `Deleted scheduled reports: ${uids.join(', ')}` }] };
    }
  );
}
