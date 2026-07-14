import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildMockApiClient, buildTestClient } from './helpers.js';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';

describe('file tools', () => {
  let apiClient: ReturnType<typeof buildMockApiClient>;
  let client: Client;

  beforeEach(async () => {
    apiClient = buildMockApiClient();
    client = await buildTestClient(apiClient);
  });

  describe('ff_get_file_status_counts', () => {
    it('calls GET /api/library-file/status', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce([{ Status: 2, StatusCount: 100 }]);

      const result = await client.callTool({ name: 'ff_get_file_status_counts', arguments: {} });
      expect(apiClient.get).toHaveBeenCalledWith('/api/library-file/status');
      expect(JSON.parse(result.content[0].text as string)).toHaveLength(1);
    });
  });

  describe('ff_list_files', () => {
    it('uses default page=0 and pageSize=50', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce([]);

      await client.callTool({ name: 'ff_list_files', arguments: { status: 4 } });
      expect(apiClient.get).toHaveBeenCalledWith('/api/library-file?status=4&page=0&rows=50');
    });

    it('uses provided page and pageSize', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce([]);

      await client.callTool({
        name: 'ff_list_files',
        arguments: { status: 2, page: 2, pageSize: 100 },
      });
      expect(apiClient.get).toHaveBeenCalledWith('/api/library-file?status=2&page=2&rows=100');
    });
  });

  describe('ff_search_files', () => {
    it('sends Filter in body', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce([]);

      await client.callTool({ name: 'ff_search_files', arguments: { query: 'movie.mkv' } });
      expect(apiClient.post).toHaveBeenCalledWith('/api/library-file/search', {
        Filter: 'movie.mkv',
      });
    });

    it('includes Status and LibraryUid when provided', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce([]);

      await client.callTool({
        name: 'ff_search_files',
        arguments: { query: 'test', status: 4, libraryUid: 'lib-1' },
      });
      expect(apiClient.post).toHaveBeenCalledWith('/api/library-file/search', {
        Filter: 'test',
        Status: 4,
        LibraryUid: 'lib-1',
      });
    });
  });

  describe('ff_get_file', () => {
    it('calls GET /api/library-file/{uid}', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({ Uid: 'file-1' });

      await client.callTool({ name: 'ff_get_file', arguments: { uid: 'file-1' } });
      expect(apiClient.get).toHaveBeenCalledWith('/api/library-file/file-1');
    });
  });

  describe('ff_get_file_log', () => {
    it('strips HTML tags from the log', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(
        '<div><span>Processing&nbsp;started</span><br/>Done</div>'
      );

      const result = await client.callTool({ name: 'ff_get_file_log', arguments: { uid: 'file-1' } });
      expect(result.content[0].text).toBe('Processing startedDone');
    });
  });

  describe('ff_reprocess_files', () => {
    it('sends Uids body to reprocess endpoint', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce(undefined);

      await client.callTool({
        name: 'ff_reprocess_files',
        arguments: { uids: ['file-1', 'file-2'] },
      });
      expect(apiClient.post).toHaveBeenCalledWith('/api/library-file/reprocess', {
        Uids: ['file-1', 'file-2'],
      });
    });

    it('reports the count of requeued files', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce(undefined);

      const result = await client.callTool({
        name: 'ff_reprocess_files',
        arguments: { uids: ['a', 'b', 'c'] },
      });
      expect(result.content[0].text).toContain('3');
    });
  });
});
