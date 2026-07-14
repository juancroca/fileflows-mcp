import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FileFlowsClient } from '../api.js';

// FileStatus enum: 0=Unprocessed, 1=Processing, 2=Processed, 4=ProcessingFailed, -1=OnHold, -2=Disabled, -3=OutOfSchedule
const STATUS_DESCRIPTION =
  'File status code: 0=Unprocessed, 1=Processing, 2=Processed, 4=ProcessingFailed, -1=OnHold, -2=Disabled, -3=OutOfSchedule';

const UID_ARRAY = z.array(z.string()).describe('Array of library file UIDs');

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
      const skip = page * pageSize;
      const data = await client.get(
        `/api/library-file?status=${status}&skip=${skip}&top=${pageSize}`
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
    'Get the processing log for a library file. Returns the full log as plain text.',
    { uid: z.string().describe('Library file UID') },
    async ({ uid }) => {
      const text = await client.getText(`/api/library-file/${uid}/log?html=false`);
      return { content: [{ type: 'text', text: text.trim() }] };
    }
  );

  server.tool(
    'ff_reprocess_files',
    'Requeue one or more files for processing by resetting their status to Unprocessed',
    { uids: UID_ARRAY },
    async ({ uids }) => {
      await client.post('/api/library-file/reprocess', { Uids: uids });
      return { content: [{ type: 'text', text: `Requeued ${uids.length} file(s) for processing` }] };
    }
  );

  server.tool(
    'ff_set_file_status',
    `Directly set the status of one or more library files. ${STATUS_DESCRIPTION}. Use to force files to Unprocessed (0) or OnHold (-1) etc.`,
    {
      status: z.number().int().describe(STATUS_DESCRIPTION),
      uids: UID_ARRAY,
    },
    async ({ status, uids }) => {
      await client.post(`/api/library-file/set-status/${status}`, { Uids: uids });
      return { content: [{ type: 'text', text: `Set status ${status} on ${uids.length} file(s)` }] };
    }
  );

  server.tool(
    'ff_abort_files',
    'Abort currently-processing files. Files that cannot be aborted are marked as ProcessingFailed.',
    { uids: UID_ARRAY },
    async ({ uids }) => {
      await client.delete('/api/library-file/abort', { Uids: uids });
      return { content: [{ type: 'text', text: `Abort requested for ${uids.length} file(s)` }] };
    }
  );

  server.tool(
    'ff_move_to_top',
    'Move one or more unprocessed files to the top of the processing queue',
    { uids: UID_ARRAY },
    async ({ uids }) => {
      await client.post('/api/library-file/move-to-top', { Uids: uids });
      return { content: [{ type: 'text', text: `Moved ${uids.length} file(s) to top of queue` }] };
    }
  );

  server.tool(
    'ff_unhold_files',
    'Release one or more OnHold files back to Unprocessed so they are picked up for processing',
    { uids: UID_ARRAY },
    async ({ uids }) => {
      await client.post('/api/library-file/unhold', { Uids: uids });
      return { content: [{ type: 'text', text: `Released ${uids.length} file(s) from hold` }] };
    }
  );

  server.tool(
    'ff_delete_files',
    'Remove one or more files from the FileFlows queue (does NOT delete the file from disk)',
    { uids: UID_ARRAY },
    async ({ uids }) => {
      await client.delete('/api/library-file', { Uids: uids });
      return { content: [{ type: 'text', text: `Removed ${uids.length} file(s) from queue` }] };
    }
  );

  server.tool(
    'ff_delete_files_from_disk',
    'Delete files from disk AND remove them from the FileFlows queue. Unlike ff_delete_files this removes the actual file. Returns a plain-text error description in the body (still HTTP 200) for files that could not be deleted — check response text for errors.',
    { uids: UID_ARRAY },
    async ({ uids }) => {
      const result = await client.delete('/api/library-file/delete-files', { Uids: uids });
      return { content: [{ type: 'text', text: result ? String(result) : `Deleted ${uids.length} file(s) from disk` }] };
    }
  );

  server.tool(
    'ff_list_files_all',
    'List library files with richer filtering options. Returns lightweight LibraryFileMinimal objects. Page size defaults to 500; the x-total-items response header is set only when filter/node/flow/library params are used.',
    {
      status: z.number().int().describe(STATUS_DESCRIPTION),
      page: z.number().int().min(0).optional().describe('Page number (0-based, default 0)'),
      filter: z.string().optional().describe('Text filter for file path/name'),
      libraryUid: z.string().optional().describe('Filter by library UID'),
      flowUid: z.string().optional().describe('Filter by flow UID'),
      nodeUid: z.string().optional().describe('Filter by processing node UID'),
      tagUid: z.string().optional().describe('Filter by tag UID (ignored when unlicensed)'),
    },
    async ({ status, page = 0, filter, libraryUid, flowUid, nodeUid, tagUid }) => {
      const params = new URLSearchParams({ status: String(status), page: String(page) });
      if (filter) params.set('filter', filter);
      if (libraryUid) params.set('library', libraryUid);
      if (flowUid) params.set('flow', flowUid);
      if (nodeUid) params.set('node', nodeUid);
      if (tagUid) params.set('tag', tagUid);
      const data = await client.get(`/api/library-file/list-all?${params}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_get_files_by_uids',
    'Get full LibraryFile details for a specific set of UIDs',
    { uids: UID_ARRAY },
    async ({ uids }) => {
      const data = await client.post('/api/library-file/get-files', { Uids: uids });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_find_all_libraries_in_files',
    'Get a map of library UIDs to names that appear in the library-file table. Useful for discovering which libraries have indexed files.',
    {},
    async () => {
      const data = await client.get('/api/library-file/find-all-libraries');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_force_processing',
    'Force one or more files to be processed regardless of schedule or other conditions',
    { uids: UID_ARRAY },
    async ({ uids }) => {
      await client.post('/api/library-file/force-processing', { Uids: uids });
      return { content: [{ type: 'text', text: `Force-processing requested for ${uids.length} file(s)` }] };
    }
  );

  server.tool(
    'ff_toggle_force_processing',
    'Toggle the forced-processing flag on one or more files',
    { uids: UID_ARRAY },
    async ({ uids }) => {
      await client.post('/api/library-file/toggle-force', { Uids: uids });
      return { content: [{ type: 'text', text: `Toggled force flag on ${uids.length} file(s)` }] };
    }
  );

  server.tool(
    'ff_process_file',
    'Add a specific file to the processing queue by path. Returns 400 if no enabled library covers the file path.',
    {
      filename: z.string().describe('Absolute path to the file to process'),
      libraryUid: z.string().optional().describe('Optional library UID to use for this file'),
    },
    async ({ filename, libraryUid }) => {
      const params = new URLSearchParams({ filename });
      if (libraryUid) params.set('libraryUid', libraryUid);
      const data = await client.post(`/api/library-file/process-file?${params}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_manually_add_file',
    'Manually add a file to a library queue',
    {
      file: z.record(z.unknown()).describe('AddFileModel object with file details'),
    },
    async ({ file }) => {
      const data = await client.post('/api/library-file/manually-add', file);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_set_process_options',
    'Update processing metadata for files without triggering reprocessing',
    {
      reprocessModel: z.record(z.unknown()).describe('ReprocessModel object with updated options'),
    },
    async ({ reprocessModel }) => {
      await client.post('/api/library-file/set-process-options', reprocessModel);
      return { content: [{ type: 'text', text: 'Process options updated' }] };
    }
  );
}
