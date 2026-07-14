import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FileFlowsClient } from '../api.js';

// FileStatus enum: 0=Unprocessed, 1=Processing, 2=Processed, 4=ProcessingFailed, -1=OnHold, -2=Disabled, -3=OutOfSchedule
const STATUS_DESCRIPTION =
  'File status code: 0=Unprocessed, 1=Processing, 2=Processed, 4=ProcessingFailed, -1=OnHold, -2=Disabled, -3=OutOfSchedule';

export function registerFileTools(server: McpServer, client: FileFlowsClient): void {
  server.tool(
    'ff_get_file_status_counts',
    'Get a summary count of files per status across all libraries',
    {},
    async () => {
      const data = await client.get('/api/library-file/status');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_list_files',
    'List library files filtered by status. Returns paginated results.',
    {
      status: z.number().int().describe(STATUS_DESCRIPTION),
      page: z.number().int().min(0).optional().describe('Page number (0-based, default 0)'),
      pageSize: z.number().int().min(1).max(500).optional().describe('Results per page (default 50, max 500)'),
    },
    async ({ status, page = 0, pageSize = 50 }) => {
      const data = await client.get(
        `/api/library-file?status=${status}&page=${page}&rows=${pageSize}`
      );
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_search_files',
    'Search library files by path/name. Returns lightweight results including tags (codec, resolution), status, and failure reason.',
    {
      query: z.string().describe('Search string to match against file paths/names'),
      status: z.number().int().optional().describe(`Optional status filter. ${STATUS_DESCRIPTION}`),
      libraryUid: z.string().optional().describe('Optional library UID to filter results'),
    },
    async ({ query, status, libraryUid }) => {
      const body: Record<string, unknown> = { Filter: query };
      if (status !== undefined) body['Status'] = status;
      if (libraryUid !== undefined) body['LibraryUid'] = libraryUid;
      const data = await client.post('/api/library-file/search', body);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_file',
    'Get full details of a library file including OriginalMetadata (Video Codec, Video Resolution, Duration), ExecutedNodes, FailureReason, and tags',
    { uid: z.string().describe('Library file UID') },
    async ({ uid }) => {
      const data = await client.get(`/api/library-file/${uid}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_file_log',
    'Get the processing log for a library file. Returns the full log as plain text (HTML tags stripped).',
    { uid: z.string().describe('Library file UID') },
    async ({ uid }) => {
      const data = await client.get<string>(`/api/library-file/${uid}/log`);
      const plain = String(data).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
      return { content: [{ type: 'text', text: plain }] };
    }
  );

  server.tool(
    'ff_reprocess_files',
    'Requeue one or more files for processing by resetting their status to Unprocessed (0)',
    { uids: z.array(z.string()).describe('Array of library file UIDs to requeue') },
    async ({ uids }) => {
      await client.post('/api/library-file/reprocess', { Uids: uids });
      return { content: [{ type: 'text', text: `Requeued ${uids.length} file(s) for processing` }] };
    }
  );
}
