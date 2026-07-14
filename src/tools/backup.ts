import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FileFlowsClient } from '../api.js';

// Valid backup name regex: ^((Manual|Imported)-)?\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}\\.ffbackup$
// Example: Manual-2024-01-15T10-30-00.ffbackup
const BACKUP_NAME_EXAMPLE = 'Manual-2024-01-15T10-30-00.ffbackup';

export function registerBackupTools(server: McpServer, client: FileFlowsClient): void {
  server.tool(
    'ff_list_backups',
    'List all FileFlows backups. Requires ExternalDatabase license — returns 500 if unlicensed (server does not catch the UnauthorizedAccessException).',
    {},
    async () => {
      const data = await client.get('/api/backup');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_backup_settings',
    'Get backup configuration settings',
    {},
    async () => {
      const data = await client.get('/api/backup/settings');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_update_backup_settings',
    'Update backup configuration settings',
    {
      settings: z.record(z.unknown()).describe('BackupSettings object (from ff_get_backup_settings)'),
    },
    async ({ settings }) => {
      await client.put('/api/backup/settings', settings);
      return { content: [{ type: 'text', text: 'Backup settings updated' }] };
    }
  );

  server.tool(
    'ff_create_backup',
    'Trigger an immediate backup now',
    {},
    async () => {
      const data = await client.post('/api/backup/backup-now');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_restore_backup',
    `Restore from a named backup file. The backup name must match the pattern: (Manual|Imported-)?YYYY-MM-DDTHH-MM-SS.ffbackup (e.g. "${BACKUP_NAME_EXAMPLE}")`,
    {
      name: z.string().describe(`Backup filename, e.g. "${BACKUP_NAME_EXAMPLE}"`),
    },
    async ({ name }) => {
      const data = await client.post(`/api/backup/restore/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_delete_backups',
    'Delete one or more backup files by name. Names that do not match the expected pattern are silently skipped.',
    {
      names: z.array(z.string()).describe('Array of backup filenames to delete'),
    },
    async ({ names }) => {
      await client.delete('/api/backup', { Uids: names });
      return { content: [{ type: 'text', text: `Deleted backups: ${names.join(', ')}` }] };
    }
  );
}
