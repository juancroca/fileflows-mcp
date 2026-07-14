import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FileFlowsClient } from '../api.js';

export function registerAuditTools(server: McpServer, client: FileFlowsClient): void {
  server.tool(
    'ff_search_audit',
    'Search the FileFlows audit log. Returns empty list (not 401) when unlicensed — callers cannot distinguish "no results" from "unlicensed".',
    {
      filter: z.record(z.unknown()).optional().describe('AuditSearchFilter object (see FileFlows docs for fields)'),
    },
    async ({ filter = {} }) => {
      const data = await client.post('/api/audit', filter);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_audit_by_object',
    'Get audit history for a specific object by type and UID. Type must match ^[a-zA-Z0-9\\.]+$ — invalid type returns empty list (not 400). Returns empty list when unlicensed.',
    {
      type: z.string().describe('Object type string, e.g. "Library", "Flow", "FileFlows.Shared.Models.Library"'),
      uid: z.string().describe('Object UID'),
    },
    async ({ type, uid }) => {
      const data = await client.get(`/api/audit/${encodeURIComponent(type)}/${uid}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
