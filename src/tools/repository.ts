import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FileFlowsClient } from '../api.js';

// Valid type values for repository endpoints
const REPO_TYPE_DESCRIPTION =
  'Repository type: "dockermod", "scriptsystem", "scriptflow", "script:shared", "script:webhook"';

export function registerRepositoryTools(server: McpServer, client: FileFlowsClient): void {
  server.tool(
    'ff_list_repository_items',
    'List items from the FileFlows repository by type. Invalid types return empty list (no error). Items are filtered by minimum version compatibility.',
    {
      type: z.string().describe(REPO_TYPE_DESCRIPTION),
      missing: z.boolean().optional().describe('When true (default), only return items not already installed'),
    },
    async ({ type, missing = true }) => {
      const data = await client.get(`/api/repository/by-type/${encodeURIComponent(type)}?missing=${missing}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_list_repository_scripts',
    'List scripts available in the repository',
    {
      type: z.number().int().describe('ScriptType enum: 0=Flow, 1=System, 2=Shared, 3=Webhook'),
      missing: z.boolean().optional().describe('When true (default), only return scripts not already installed'),
    },
    async ({ type, missing = true }) => {
      const data = await client.get(`/api/repository/scripts?type=${type}&missing=${missing}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_list_repository_subflows',
    'List subflows available in the repository',
    {
      missing: z.boolean().optional().describe('When true (default), only return subflows not already installed'),
    },
    async ({ missing = true }) => {
      const data = await client.get(`/api/repository/subflows?missing=${missing}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_repository_content',
    'Get the raw content of a repository item by path',
    {
      path: z.string().describe('Repository item path'),
    },
    async ({ path }) => {
      const data = await client.get(`/api/repository/content?path=${encodeURIComponent(path)}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_download_repository_items',
    'Download and install items from the repository. Items with null Path are silently skipped. "script:shared" type is not valid here — use ff_download_repository_scripts.',
    {
      type: z.string().describe(REPO_TYPE_DESCRIPTION + ' (not "script:shared")'),
      items: z.array(z.record(z.unknown())).describe('Array of RepositoryObject items to download'),
    },
    async ({ type, items }) => {
      const data = await client.post(`/api/repository/download/${encodeURIComponent(type)}`, items);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_download_repository_scripts',
    'Download specific scripts from the repository by path',
    {
      paths: z.array(z.string()).describe('Array of script paths to download'),
    },
    async ({ paths }) => {
      await client.post('/api/repository/download', { Scripts: paths });
      return { content: [{ type: 'text', text: `Initiated download of ${paths.length} script(s)` }] };
    }
  );

  server.tool(
    'ff_download_repository_subflows',
    'Download subflows from the repository by path. Imported flows are marked ReadOnly=true.',
    {
      paths: z.array(z.string()).describe('Array of subflow paths to download'),
    },
    async ({ paths }) => {
      await client.post('/api/repository/download-sub-flows', { Scripts: paths });
      return { content: [{ type: 'text', text: `Initiated download of ${paths.length} subflow(s)` }] };
    }
  );

  server.tool(
    'ff_update_all_repository_scripts',
    'Check for and update all installed scripts from the repository',
    {},
    async () => {
      await client.post('/api/repository/update-scripts');
      return { content: [{ type: 'text', text: 'Repository script update check initiated' }] };
    }
  );

  server.tool(
    'ff_update_repository_items',
    'Update specific installed items from the repository. Currently only "dockermod" type triggers actual updates; other types silently return 200.',
    {
      type: z.string().describe(REPO_TYPE_DESCRIPTION),
      uids: z.array(z.string()).describe('Array of item UIDs to update'),
    },
    async ({ type, uids }) => {
      await client.post(`/api/repository/${encodeURIComponent(type)}/update`, { Uids: uids });
      return { content: [{ type: 'text', text: `Update initiated for ${uids.length} ${type} item(s)` }] };
    }
  );

  server.tool(
    'ff_update_specific_repository_scripts',
    'Update specific installed scripts from the repository by path or UID. Covers FlowScripts, SystemScripts, SharedScripts (WebhookScripts excluded).',
    {
      identifiers: z.array(z.string()).describe('Array of script paths or UID strings to update'),
    },
    async ({ identifiers }) => {
      const result = await client.post('/api/repository/update-specific-scripts', { Uids: identifiers });
      return { content: [{ type: 'text', text: result ? 'Scripts updated' : 'No matching scripts found' }] };
    }
  );

  server.tool(
    'ff_get_repository_item_fields',
    'Get the form field definitions for a repository item by type and path. Used to understand what configuration fields an item requires.',
    {
      type: z.string().describe('"dockermod", "script:flow", "script:system", or "script:webhook"'),
      item: z.record(z.unknown()).describe('RepositoryObject with a Path field (required)'),
    },
    async ({ type, item }) => {
      const data = await client.post(`/api/repository/${encodeURIComponent(type)}/fields`, item);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
