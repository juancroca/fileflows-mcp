import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildMockApiClient, buildTestClient } from './helpers.js';
import { SCHEDULE_ALL } from '../../src/api.js';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';

describe('library tools', () => {
  let apiClient: ReturnType<typeof buildMockApiClient>;
  let client: Client;

  beforeEach(async () => {
    apiClient = buildMockApiClient();
    client = await buildTestClient(apiClient);
  });

  describe('ff_list_libraries', () => {
    it('calls GET /api/library and returns JSON', async () => {
      const libraries = [{ Uid: 'uid-1', Name: 'Movies', Enabled: true }];
      vi.mocked(apiClient.get).mockResolvedValueOnce(libraries);

      const result = await client.callTool({ name: 'ff_list_libraries', arguments: {} });
      expect(apiClient.get).toHaveBeenCalledWith('/api/library');
      expect(JSON.parse(result.content[0].text as string)).toEqual(libraries);
    });
  });

  describe('ff_get_library', () => {
    it('calls GET /api/library/{uid}', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({ Uid: 'uid-1', Name: 'Movies' });

      await client.callTool({ name: 'ff_get_library', arguments: { uid: 'uid-1' } });
      expect(apiClient.get).toHaveBeenCalledWith('/api/library/uid-1');
    });
  });

  describe('ff_create_library', () => {
    it('sends correct body including SCHEDULE_ALL', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({ Uid: 'new-uid' });

      await client.callTool({
        name: 'ff_create_library',
        arguments: {
          name: 'Test Library',
          path: '/media/test',
          flowUid: 'flow-uid',
          flowName: 'My Flow',
        },
      });

      expect(apiClient.post).toHaveBeenCalledWith('/api/library', {
        Name: 'Test Library',
        Path: '/media/test',
        Flow: { Uid: 'flow-uid', Name: 'My Flow' },
        Extensions: ['mkv', 'mp4', 'avi', 'ts', 'm2ts', 'mov'],
        Schedule: SCHEDULE_ALL,
      });
    });

    it('accepts custom extensions', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({ Uid: 'new-uid' });

      await client.callTool({
        name: 'ff_create_library',
        arguments: {
          name: 'Test',
          path: '/media/test',
          flowUid: 'flow-uid',
          flowName: 'Flow',
          extensions: ['mkv', 'mp4'],
        },
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/library',
        expect.objectContaining({ Extensions: ['mkv', 'mp4'] })
      );
    });
  });

  describe('ff_delete_library', () => {
    it('sends DELETE with Uids body', async () => {
      vi.mocked(apiClient.delete).mockResolvedValueOnce(undefined);

      await client.callTool({
        name: 'ff_delete_library',
        arguments: { uids: ['uid-1', 'uid-2'] },
      });

      expect(apiClient.delete).toHaveBeenCalledWith('/api/library', { Uids: ['uid-1', 'uid-2'] });
    });
  });

  describe('ff_set_library_enabled', () => {
    it('calls PUT /api/library/state/{uid}?enable=true when enabling', async () => {
      vi.mocked(apiClient.put).mockResolvedValueOnce(undefined);

      await client.callTool({
        name: 'ff_set_library_enabled',
        arguments: { uid: 'uid-1', enabled: true },
      });

      expect(apiClient.put).toHaveBeenCalledWith('/api/library/state/uid-1?enable=true');
    });

    it('calls PUT with enable=false when disabling', async () => {
      vi.mocked(apiClient.put).mockResolvedValueOnce(undefined);

      await client.callTool({
        name: 'ff_set_library_enabled',
        arguments: { uid: 'uid-1', enabled: false },
      });

      expect(apiClient.put).toHaveBeenCalledWith('/api/library/state/uid-1?enable=false');
    });
  });

  describe('ff_rescan_library', () => {
    it('sends PUT with Uids body', async () => {
      vi.mocked(apiClient.put).mockResolvedValueOnce(undefined);

      await client.callTool({
        name: 'ff_rescan_library',
        arguments: { uids: ['uid-1'] },
      });

      expect(apiClient.put).toHaveBeenCalledWith('/api/library/rescan', { Uids: ['uid-1'] });
    });
  });

  describe('ff_rescan_all_libraries', () => {
    it('calls POST /api/library/rescan-enabled', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce(undefined);

      await client.callTool({ name: 'ff_rescan_all_libraries', arguments: {} });

      expect(apiClient.post).toHaveBeenCalledWith('/api/library/rescan-enabled');
    });
  });

  describe('ff_reset_library', () => {
    it('sends PUT with Uids body', async () => {
      vi.mocked(apiClient.put).mockResolvedValueOnce(undefined);

      await client.callTool({
        name: 'ff_reset_library',
        arguments: { uids: ['uid-1'] },
      });

      expect(apiClient.put).toHaveBeenCalledWith('/api/library/reset', { Uids: ['uid-1'] });
    });
  });
});
