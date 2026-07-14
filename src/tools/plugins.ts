import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FileFlowsClient } from '../api.js';

export function registerPluginTools(server: McpServer, client: FileFlowsClient): void {
  server.tool(
    'ff_list_plugins',
    'List all installed FileFlows plugins',
    {},
    async () => {
      const data = await client.get('/api/plugin');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_plugin',
    'Get a plugin by UID. Returns an empty PluginInfo object (not null/404) if not found.',
    { uid: z.string().describe('Plugin UID') },
    async ({ uid }) => {
      const data = await client.get(`/api/plugin/${uid}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_plugin_by_package_name',
    'Get a plugin by its package name. Returns null (not 404) if not found.',
    { name: z.string().describe('Plugin package name') },
    async ({ name }) => {
      const data = await client.get(`/api/plugin/by-package-name/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_list_plugin_packages',
    'List available plugin packages from the repository',
    {
      missing: z.boolean().optional().describe('When true, only return packages not yet installed (default false)'),
    },
    async ({ missing = false }) => {
      const data = await client.get(`/api/plugin/plugin-packages?missing=${missing}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_plugin_settings',
    'Get the settings for a specific plugin package',
    { packageName: z.string().describe('Plugin package name') },
    async ({ packageName }) => {
      const data = await client.get(`/api/plugin/${encodeURIComponent(packageName)}/settings`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_save_plugin_settings',
    'Save settings for a specific plugin package. Fields typed as Password in the plugin definition are encrypted before storage — do not double-encrypt.',
    {
      packageName: z.string().describe('Plugin package name'),
      settings: z.record(z.unknown()).describe('Plugin settings as key-value pairs'),
    },
    async ({ packageName, settings }) => {
      const data = await client.post(`/api/plugin/${encodeURIComponent(packageName)}/settings`, settings);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_download_plugins',
    'Download/install one or more plugin packages. Silent no-op if packages list is empty.',
    {
      packages: z.array(z.record(z.unknown())).describe('Array of PluginPackageInfo objects to download'),
    },
    async ({ packages }) => {
      await client.post('/api/plugin/download', { Packages: packages });
      return { content: [{ type: 'text', text: `Initiated download of ${packages.length} plugin package(s)` }] };
    }
  );

  server.tool(
    'ff_update_all_plugins',
    'Check for and install updates for all installed plugins',
    {},
    async () => {
      await client.post('/api/plugin/update');
      return { content: [{ type: 'text', text: 'Plugin update check initiated' }] };
    }
  );

  server.tool(
    'ff_delete_plugins',
    'Delete/uninstall one or more plugins by UID',
    { uids: z.array(z.string()).describe('Array of plugin UIDs to delete') },
    async ({ uids }) => {
      await client.delete('/api/plugin', { Uids: uids });
      return { content: [{ type: 'text', text: `Deleted plugins: ${uids.join(', ')}` }] };
    }
  );
}
