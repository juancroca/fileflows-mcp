import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FileFlowsClient } from '../api.js';

// LogType enum
const LOG_LEVEL_DESCRIPTION = 'Log level filter: 0=Debug, 1=Info, 2=Warning, 3=Error';

export function registerLogTools(server: McpServer, client: FileFlowsClient): void {
  server.tool(
    'ff_get_server_log',
    'Get the FileFlows server log tail (last 1000 lines). Returns plain text (log lines as text, not JSON).',
    {
      logLevel: z.number().int().optional().describe(LOG_LEVEL_DESCRIPTION + ' (default: Info=1)'),
    },
    async ({ logLevel = 1 }) => {
      const text = await client.getText(`/api/fileflows-log?logLevel=${logLevel}`);
      return { content: [{ type: 'text', text: text }] };
    }
  );

  server.tool(
    'ff_list_log_sources',
    'List available log file sources grouped by component. Returns up to 10 files per source.',
    {},
    async () => {
      const data = await client.get('/api/fileflows-log/log-sources');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_download_log_file',
    'Download a specific log file by source name. The source name must match a file from ff_list_log_sources and must end in .log with a numeric suffix (e.g. "FileFlows-0.log").',
    {
      source: z.string().describe('Log file source name (e.g. "FileFlows-0.log") — must end in .log and not contain ".."'),
    },
    async ({ source }) => {
      const text = await client.getText(`/api/fileflows-log/download?source=${encodeURIComponent(source)}`);
      return { content: [{ type: 'text', text: text }] };
    }
  );
}
