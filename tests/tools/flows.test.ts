import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildMockApiClient, buildTestClient } from './helpers.js';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';

describe('flow tools', () => {
  let apiClient: ReturnType<typeof buildMockApiClient>;
  let client: Client;

  beforeEach(async () => {
    apiClient = buildMockApiClient();
    client = await buildTestClient(apiClient);
  });

  describe('ff_list_flows', () => {
    it('calls GET /api/flow', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce([{ Uid: 'flow-1', Name: 'My Flow' }]);

      const result = await client.callTool({ name: 'ff_list_flows', arguments: {} });
      expect(apiClient.get).toHaveBeenCalledWith('/api/flow');
      expect(JSON.parse(result.content[0].text as string)).toHaveLength(1);
    });
  });

  describe('ff_get_flow', () => {
    it('calls GET /api/flow/{uid}', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({ Uid: 'flow-1', Parts: [] });

      await client.callTool({ name: 'ff_get_flow', arguments: { uid: 'flow-1' } });
      expect(apiClient.get).toHaveBeenCalledWith('/api/flow/flow-1');
    });
  });

  describe('ff_update_flow', () => {
    it('sends the full flow object via PUT', async () => {
      const flow = { Uid: 'flow-1', Name: 'Updated', Parts: [] };
      vi.mocked(apiClient.put).mockResolvedValueOnce(flow);

      await client.callTool({ name: 'ff_update_flow', arguments: { flow } });
      expect(apiClient.put).toHaveBeenCalledWith('/api/flow', flow);
    });
  });

  describe('ff_list_flow_elements', () => {
    it('calls GET /api/flow/elements', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce([]);

      await client.callTool({ name: 'ff_list_flow_elements', arguments: {} });
      expect(apiClient.get).toHaveBeenCalledWith('/api/flow/elements');
    });
  });
});
