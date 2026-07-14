import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FileFlowsClient } from '../api.js';

// SmtpPassword sentinel — same pattern as the main settings
const SMTP_PASSWORD_SENTINEL = '************';

export function registerConfigurationTools(server: McpServer, client: FileFlowsClient): void {
  // --- Database ---

  server.tool(
    'ff_get_database_config',
    'Get the current database configuration. Shows pending migration target if one is queued. DB credentials are omitted for SQLite.',
    {},
    async () => {
      const data = await client.get('/api/configuration/database');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_update_database_config',
    'Update database configuration. A connection string change queues a migration applied on next restart — it does NOT take effect immediately. No response body — success is a 200 with empty body.',
    {
      config: z.record(z.unknown()).describe('DatabaseModel object (from ff_get_database_config)'),
    },
    async ({ config }) => {
      await client.put('/api/configuration/database', config);
      return { content: [{ type: 'text', text: 'Database configuration updated (restart may be required)' }] };
    }
  );

  // --- General ---

  server.tool(
    'ff_get_general_config',
    'Get general FileFlows configuration (language, telemetry, page size, docker mods, etc.)',
    {},
    async () => {
      const data = await client.get('/api/configuration/general');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_update_general_config',
    'Update general configuration. Note: DisableTelemetry is silently forced to false when the server is unlicensed. DockerModsOnServer is saved to the JSON config file, not the database.',
    {
      config: z.record(z.unknown()).describe('GeneralModel object (from ff_get_general_config)'),
    },
    async ({ config }) => {
      await client.put('/api/configuration/general', config);
      return { content: [{ type: 'text', text: 'General configuration updated' }] };
    }
  );

  // --- Logging ---

  server.tool(
    'ff_get_logging_config',
    'Get logging configuration (log level, retention, queue message logging)',
    {},
    async () => {
      const data = await client.get('/api/configuration/logging');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_update_logging_config',
    'Update logging configuration. LoggingLevel takes effect immediately without restart. Does not bump the configuration revision counter.',
    {
      config: z.record(z.unknown()).describe('LoggingModel object (from ff_get_logging_config)'),
    },
    async ({ config }) => {
      await client.put('/api/configuration/logging', config);
      return { content: [{ type: 'text', text: 'Logging configuration updated' }] };
    }
  );

  // --- Email / SMTP ---

  server.tool(
    'ff_get_email_config',
    `Get email (SMTP) configuration. SmtpPassword is always masked as "${SMTP_PASSWORD_SENTINEL}" — the actual password is never returned.`,
    {},
    async () => {
      const data = await client.get('/api/configuration/email');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_update_email_config',
    `Update email (SMTP) configuration. Pass SmtpPassword as "${SMTP_PASSWORD_SENTINEL}" to keep the existing password unchanged; any other value replaces it.`,
    {
      config: z.record(z.unknown()).describe('EmailModel object (from ff_get_email_config)'),
    },
    async ({ config }) => {
      await client.put('/api/configuration/email', config);
      return { content: [{ type: 'text', text: 'Email configuration updated' }] };
    }
  );

  // --- Updates ---

  server.tool(
    'ff_get_updates_config',
    'Get auto-update configuration (AutoUpdate, AutoUpdateNodes, AutoUpdatePlugins)',
    {},
    async () => {
      const data = await client.get('/api/configuration/updates');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_update_updates_config',
    'Update auto-update configuration',
    {
      config: z.record(z.unknown()).describe('UpdatesModel object: { AutoUpdate: bool, AutoUpdateNodes: bool, AutoUpdatePlugins: bool }'),
    },
    async ({ config }) => {
      await client.put('/api/configuration/updates', config);
      return { content: [{ type: 'text', text: 'Updates configuration saved' }] };
    }
  );

  server.tool(
    'ff_check_for_update',
    'Trigger an update check. Returns true if an update is available and the server is licensed for AutoUpdates.',
    {},
    async () => {
      const data = await client.post('/api/configuration/updates/check-for-update-now');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_upgrade_server',
    'Trigger a server upgrade (if update is available and licensed). The upgrade runs in the background — the server will restart when complete.',
    {},
    async () => {
      await client.post('/api/configuration/updates/upgrade-now');
      return { content: [{ type: 'text', text: 'Upgrade initiated — server will restart when complete' }] };
    }
  );

  // --- License ---

  server.tool(
    'ff_get_license',
    'Get current license information including flags, expiry, and file limits',
    {},
    async () => {
      const data = await client.get('/api/configuration/license');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_update_license',
    'Update the license key and email. Triggers an async validation call to the license server. Bumps the configuration revision counter.',
    {
      licenseKey: z.string().describe('License key'),
      licenseEmail: z.string().describe('License email address'),
    },
    async ({ licenseKey, licenseEmail }) => {
      await client.put('/api/configuration/license', { LicenseKey: licenseKey, LicenseEmail: licenseEmail });
      return { content: [{ type: 'text', text: 'License updated — validation is asynchronous' }] };
    }
  );

  // --- Forge ---

  server.tool(
    'ff_get_forge_config',
    'Get Forge configuration (ForgeKey, ForgeUrl). Returns 401 if server is unlicensed.',
    {},
    async () => {
      const data = await client.get('/api/configuration/forge');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_update_forge_config',
    'Update Forge configuration. Returns 401 if unlicensed.',
    {
      config: z.record(z.unknown()).describe('ForgeModel object: { ForgeKey: string, ForgeUrl: string }'),
    },
    async ({ config }) => {
      await client.put('/api/configuration/forge', config);
      return { content: [{ type: 'text', text: 'Forge configuration updated' }] };
    }
  );

  // --- File Server ---

  server.tool(
    'ff_get_file_server_config',
    'Get file server configuration. FileServerAllowedPaths is returned as both a string array and a newline-joined string.',
    {},
    async () => {
      const data = await client.get('/api/configuration/file-server');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_update_file_server_config',
    'Update file server configuration. IMPORTANT: only FileServerAllowedPathsString (newline-delimited) is consumed on PUT — the array field FileServerAllowedPaths is silently ignored. Pass paths as a newline-joined string.',
    {
      config: z.record(z.unknown()).describe(
        'FileServerModel object. Use FileServerAllowedPathsString (newline-delimited string) to set allowed paths — the array field is ignored on PUT.'
      ),
    },
    async ({ config }) => {
      await client.put('/api/configuration/file-server', config);
      return { content: [{ type: 'text', text: 'File server configuration updated' }] };
    }
  );
}
