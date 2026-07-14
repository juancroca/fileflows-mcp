import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FileFlowsClient } from '../api.js';

// Password sentinel: SmtpPassword is masked as "************" (12 asterisks) in GET
// responses. Sending that exact string back preserves the existing password.
const SMTP_PASSWORD_SENTINEL = '************';

export function registerSettingsTools(server: McpServer, client: FileFlowsClient): void {
  server.tool(
    'ff_get_settings',
    'Get raw FileFlows settings. SmtpPassword is masked. Use ff_get_ui_settings for the richer UI-facing projection.',
    {},
    async () => {
      const data = await client.get('/api/settings');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_ui_settings',
    'Get the full UI-facing settings model. Includes DB type, SMTP config (password masked), login security settings, language, telemetry, and license info. LicenseKey/LicenseEmail come from the JSON config file, not the database.',
    {},
    async () => {
      const data = await client.get('/api/settings/ui-settings');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_update_ui_settings',
    `Update UI-facing settings. SmtpPassword sentinel: send "${SMTP_PASSWORD_SENTINEL}" to preserve the existing password. Language change triggers a plugin re-scan. DB connection change queues a migration for next restart. LoginLockoutMinutes is floored to 20, LoginMaxAttempts to 10, TokenExpiryMinutes to 1440 if set below those values.`,
    {
      settings: z.record(z.unknown()).describe('SettingsUiModel object (from ff_get_ui_settings)'),
    },
    async ({ settings }) => {
      await client.put('/api/settings/ui-settings', settings);
      return { content: [{ type: 'text', text: 'UI settings updated' }] };
    }
  );

  server.tool(
    'ff_check_update_available',
    'Check if a FileFlows update is available. Returns empty string when DisableTelemetry is true or on any error — callers cannot distinguish "no update" from "check failed".',
    {},
    async () => {
      const data = await client.get('/api/settings/check-update-available');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_trigger_update_check',
    'Trigger an update check now. Returns true if an update is available and the server is licensed for AutoUpdates.',
    {},
    async () => {
      const data = await client.post('/api/settings/check-for-update-now');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_trigger_upgrade',
    'Trigger a server upgrade now. The upgrade runs in a background task — the endpoint returns before it completes. Silent no-op if not licensed for AutoUpdates.',
    {},
    async () => {
      await client.post('/api/settings/upgrade-now');
      return { content: [{ type: 'text', text: 'Upgrade initiated in background' }] };
    }
  );

  server.tool(
    'ff_get_current_config',
    'Get the current configuration revision object used by worker nodes to detect config changes',
    {},
    async () => {
      const data = await client.get('/api/settings/current-config');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_current_config_revision',
    'Get just the current configuration revision timestamp',
    {},
    async () => {
      const data = await client.get('/api/settings/current-config/revision');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_test_db_connection',
    'Test a database connection string. Returns 400 for SQLite type (unsupported via this endpoint) or on connection failure.',
    {
      type: z.number().int().describe('DatabaseType enum (not SQLite — use MySQL/PostgreSQL/SQL Server)'),
      server: z.string().describe('Database server hostname or IP'),
      name: z.string().describe('Database name'),
      port: z.number().int().describe('Database port'),
      user: z.string().describe('Database username'),
      password: z.string().describe('Database password'),
    },
    async ({ type, server: dbServer, name, port, user, password }) => {
      const data = await client.post('/api/settings/test-db-connection', {
        Type: type,
        Server: dbServer,
        Name: name,
        Port: port,
        User: user,
        Password: password,
      });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
