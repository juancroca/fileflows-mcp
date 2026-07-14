import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FileFlowsClient } from '../api.js';

export function registerDockerModTools(server: McpServer, client: FileFlowsClient): void {
  server.tool(
    'ff_list_docker_mods',
    'List all DockerMods ordered by Order then Name. For repository-backed mods, LatestRevision is populated to detect outdated versions.',
    {},
    async () => {
      const data = await client.get('/api/dockermod');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_docker_mod',
    'Get a DockerMod by UID',
    { uid: z.string().describe('DockerMod UID') },
    async ({ uid }) => {
      const data = await client.get(`/api/dockermod/${uid}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_save_docker_mod',
    'Create or update a DockerMod. The server increments Revision by 1 server-side — send the current revision, not the intended next one. Pass Uid as empty string or omit for new.',
    {
      mod: z.record(z.unknown()).describe('DockerMod object (from ff_get_docker_mod). Revision will be auto-incremented server-side.'),
    },
    async ({ mod }) => {
      const data = await client.post('/api/dockermod', mod);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_set_docker_mod_enabled',
    'Enable or disable a DockerMod',
    {
      uid: z.string().describe('DockerMod UID'),
      enabled: z.boolean().describe('true to enable, false to disable'),
    },
    async ({ uid, enabled }) => {
      const data = await client.put(`/api/dockermod/state/${uid}?enable=${enabled}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_move_docker_mod',
    'Move a DockerMod up or down in the order list',
    {
      uid: z.string().describe('DockerMod UID to move'),
      up: z.boolean().describe('true to move up, false to move down'),
    },
    async ({ uid, up }) => {
      await client.post(`/api/dockermod/move?up=${up}`, { Uids: [uid] });
      return { content: [{ type: 'text', text: `Moved DockerMod ${uid} ${up ? 'up' : 'down'}` }] };
    }
  );

  server.tool(
    'ff_delete_docker_mods',
    'Delete one or more DockerMods by UID',
    { uids: z.array(z.string()).describe('Array of DockerMod UIDs to delete') },
    async ({ uids }) => {
      await client.delete('/api/dockermod', { Uids: uids });
      return { content: [{ type: 'text', text: `Deleted DockerMods: ${uids.join(', ')}` }] };
    }
  );
}
