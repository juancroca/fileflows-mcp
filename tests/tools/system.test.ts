import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildMockApiClient, buildTestClient } from './helpers.js';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';

describe('system tools', () => {
  let apiClient: ReturnType<typeof buildMockApiClient>;
  let client: Client;

  beforeEach(async () => {
    apiClient = buildMockApiClient();
    client = await buildTestClient(apiClient);
  });

  describe('ff_get_status', () => {
    it('calls GET /api/status and returns JSON', async () => {
      const status = { queue: 5, processing: 1, processingFiles: [] };
      vi.mocked(apiClient.get).mockResolvedValueOnce(status);

      const result = await client.callTool({ name: 'ff_get_status', arguments: {} });
      expect(apiClient.get).toHaveBeenCalledWith('/api/status');
      expect(JSON.parse(result.content[0].text as string)).toEqual(status);
    });
  });

  describe('ff_get_node_overview', () => {
    it('calls GET /api/node/overview', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce([{ Uid: 'node-1', Status: 'Idle' }]);

      await client.callTool({ name: 'ff_get_node_overview', arguments: {} });
      expect(apiClient.get).toHaveBeenCalledWith('/api/node/overview');
    });
  });
});
