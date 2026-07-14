import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FileFlowsClient } from '../api.js';

export function registerFlowTools(server: McpServer, client: FileFlowsClient): void {
  server.tool(
    'ff_list_flows',
    'List all FileFlows processing flows',
    {},
    async () => {
      const data = await client.get('/api/flow');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_list_all_flows',
    'Get a slim list of all flows including UsedBy references. Cheaper than ff_list_flows for overview purposes.',
    {},
    async () => {
      const data = await client.get('/api/flow/list-all');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_flow',
    'Get a FileFlows flow by UID, including all nodes (Parts) and their connections. Use this to inspect or debug a flow.',
    { uid: z.string().describe('Flow UID') },
    async ({ uid }) => {
      const data = await client.get(`/api/flow/${uid}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_update_flow',
    'Update a FileFlows flow. You must pass the complete flow object (as returned by ff_get_flow) with your modifications applied. The flow is replaced in full.',
    { flow: z.record(z.unknown()).describe('Complete flow object with modifications applied') },
    async ({ flow }) => {
      const data = await client.put('/api/flow', flow);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_list_flow_elements',
    'List all available flow element types (nodes) that can be used in a flow, including their schemas and available outputs',
    {},
    async () => {
      const data = await client.get('/api/flow/elements');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_set_flow_enabled',
    'Enable or disable a FileFlows flow',
    {
      uid: z.string().describe('Flow UID'),
      enabled: z.boolean().describe('true to enable, false to disable'),
    },
    async ({ uid, enabled }) => {
      const data = await client.put(`/api/flow/state/${uid}?enable=${enabled}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_set_flow_default',
    'Set or unset a failure flow as the default. Only valid for Failure-type flows.',
    {
      uid: z.string().describe('Flow UID (must be a Failure-type flow)'),
      isDefault: z.boolean().optional().describe('true to set as default (default true). Setting as default clears the default flag on all other failure flows.'),
    },
    async ({ uid, isDefault = true }) => {
      const data = await client.put(`/api/flow/set-default/${uid}?default=${isDefault}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_delete_flow',
    'Delete one or more FileFlows flows by UID',
    { uids: z.array(z.string()).describe('Array of flow UIDs to delete') },
    async ({ uids }) => {
      await client.delete('/api/flow', { Uids: uids });
      return { content: [{ type: 'text', text: `Deleted flows: ${uids.join(', ')}` }] };
    }
  );

  server.tool(
    'ff_import_flow',
    'Import a flow from exported JSON. All part UIDs are replaced with new GUIDs. ReadOnly and Default flags are reset. Returns the saved flow.',
    {
      json: z.string().describe('Flow JSON string (from ff_export_flows or a .json file)'),
      asFileDropFlow: z.boolean().optional().describe('When true and licensed, convert Standard flow type to FileDrop type (default false)'),
    },
    async ({ json, asFileDropFlow = false }) => {
      const data = await client.post(`/api/flow/import?asFileDropFlow=${asFileDropFlow}`, json);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_duplicate_flow',
    'Duplicate an existing flow. Returns null (not 404) if the source flow is not found.',
    {
      uid: z.string().describe('UID of the flow to duplicate'),
      asFileDropFlow: z.boolean().optional().describe('When true, convert to FileDrop flow type (default false)'),
    },
    async ({ uid, asFileDropFlow = false }) => {
      const data = await client.get(`/api/flow/duplicate/${uid}?asFileDropFlow=${asFileDropFlow}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_rename_flow',
    'Rename a flow. Silent no-op if the UID is empty or the name is unchanged.',
    {
      uid: z.string().describe('Flow UID'),
      name: z.string().describe('New flow name'),
    },
    async ({ uid, name }) => {
      await client.put(`/api/flow/${uid}/rename?name=${encodeURIComponent(name)}`);
      return { content: [{ type: 'text', text: `Flow ${uid} renamed to "${name}"` }] };
    }
  );

  server.tool(
    'ff_restore_default_flows',
    'Restore built-in default flows. Pass replaceExisting=true to overwrite any existing flows with the same name.',
    {
      replaceExisting: z.boolean().optional().describe('When true, overwrite existing default flows (default false)'),
    },
    async ({ replaceExisting = false }) => {
      await client.post(`/api/flow/restore-defaults?replaceExisting=${replaceExisting}`);
      return { content: [{ type: 'text', text: `Default flows restored${replaceExisting ? ' (existing replaced)' : ''}` }] };
    }
  );

  server.tool(
    'ff_get_failure_flow_for_library',
    'Get the failure flow configured for a specific library',
    { libraryUid: z.string().describe('Library UID') },
    async ({ libraryUid }) => {
      const data = await client.get(`/api/flow/failure-flow/by-library/${libraryUid}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_flow_variables',
    'Get available variables for a specific point in a flow (for the flow editor). Returns upstream variable names and sample values.',
    {
      flowUid: z.string().describe('Flow UID'),
      partUid: z.string().describe('UID of the flow part/node to get variables for'),
      parts: z.array(z.record(z.unknown())).optional().describe('Current list of flow parts (used when isNew=true)'),
      isNew: z.boolean().optional().describe('When true, collect variables from all parts; when false (default), only from upstream parts'),
    },
    async ({ flowUid, partUid, parts = [], isNew = false }) => {
      const data = await client.post(`/api/flow/${partUid}/variables?isNew=${isNew}`, parts);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
