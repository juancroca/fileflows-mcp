import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FileFlowsClient } from '../api.js';

// ScriptType enum: 0=Flow, 1=System, 2=Shared, 3=Webhook
const SCRIPT_TYPE_DESCRIPTION =
  'Script type: 0=Flow, 1=System, 2=Shared, 3=Webhook';

export function registerScriptTools(server: McpServer, client: FileFlowsClient): void {
  server.tool(
    'ff_list_scripts',
    'List all FileFlows scripts',
    {},
    async () => {
      const data = await client.get('/api/script');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_list_scripts_by_type',
    'List FileFlows scripts filtered by type',
    {
      type: z.number().int().describe(SCRIPT_TYPE_DESCRIPTION),
    },
    async ({ type }) => {
      const data = await client.get(`/api/script/all-by-type/${type}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_script',
    'Get a script by UID. Returns null (HTTP 200 with null body) if not found — not a 404.',
    { uid: z.string().describe('Script UID') },
    async ({ uid }) => {
      const data = await client.get(`/api/script/${uid}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_script_code',
    'Get just the code of a script by UID. Returns null (not 404) if not found.',
    { uid: z.string().describe('Script UID') },
    async ({ uid }) => {
      const data = await client.get(`/api/script/${uid}/code`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_script_templates',
    'Get script templates, optionally filtered by language',
    {
      language: z.string().optional().describe('Language filter (default: "javascript")'),
    },
    async ({ language = 'javascript' }) => {
      const data = await client.get(`/api/script/templates?language=${encodeURIComponent(language)}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_save_script',
    'Create or update a script. For JavaScript scripts, the Name is derived from the @name annotation inside the Code — the body Name field is secondary. Pass Uid as empty string or omit for new.',
    {
      script: z.record(z.unknown()).describe(
        'Script object. Required: Name (string), Code (string), Language (int: 0=JavaScript), Type (int — ' +
          SCRIPT_TYPE_DESCRIPTION +
          '). Optional: Uid (omit/empty to create).'
      ),
    },
    async ({ script }) => {
      const data = await client.post('/api/script', script);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_validate_script',
    'Validate a JavaScript script without saving it',
    {
      code: z.string().describe('Script code to validate'),
      isFunction: z.boolean().optional().describe('Whether the script is a function (default false)'),
      variables: z.record(z.unknown()).optional().describe('Sample variables to use during validation'),
    },
    async ({ code, isFunction = false, variables = {} }) => {
      const data = await client.post('/api/script/validate', {
        Code: code,
        IsFunction: isFunction,
        Variables: variables,
      });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_duplicate_script',
    'Duplicate an existing script by UID. Returns null (not 404) if the script is not found.',
    { uid: z.string().describe('Script UID to duplicate') },
    async ({ uid }) => {
      const data = await client.get(`/api/script/duplicate/${uid}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_delete_scripts',
    'Delete one or more scripts by UID',
    { uids: z.array(z.string()).describe('Array of script UIDs to delete') },
    async ({ uids }) => {
      await client.delete('/api/script', { Uids: uids });
      return { content: [{ type: 'text', text: `Deleted scripts: ${uids.join(', ')}` }] };
    }
  );
}
