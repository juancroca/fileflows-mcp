import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { FileFlowsClient } from '../../src/api.js';
import { registerLibraryTools } from '../../src/tools/libraries.js';
import { registerFlowTools } from '../../src/tools/flows.js';
import { registerFileTools } from '../../src/tools/files.js';
import { registerSystemTools } from '../../src/tools/system.js';

export function buildMockApiClient(overrides: Partial<FileFlowsClient> = {}): FileFlowsClient {
  const base: FileFlowsClient = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  } as unknown as FileFlowsClient;
  return Object.assign(base, overrides);
}

export async function buildTestClient(apiClient: FileFlowsClient): Promise<Client> {
  const server = new McpServer({ name: 'test', version: '0.0.0' });
  registerLibraryTools(server, apiClient);
  registerFlowTools(server, apiClient);
  registerFileTools(server, apiClient);
  registerSystemTools(server, apiClient);

  const [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);

  const client = new Client({ name: 'test-client', version: '0.0.0' });
  await client.connect(clientTransport);
  return client;
}
