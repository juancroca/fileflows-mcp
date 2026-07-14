import { randomUUID } from 'crypto';
import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { FileFlowsClient } from './api.js';
import { registerLibraryTools } from './tools/libraries.js';
import { registerFlowTools } from './tools/flows.js';
import { registerFileTools } from './tools/files.js';
import { registerSystemTools } from './tools/system.js';

const FILEFLOWS_URL = process.env.FILEFLOWS_URL ?? 'http://localhost:5050';
const PORT = parseInt(process.env.PORT ?? '3000', 10);

const client = new FileFlowsClient(FILEFLOWS_URL);

function createMcpServer(): McpServer {
  const server = new McpServer({ name: 'fileflows', version: '1.0.0' });
  registerLibraryTools(server, client);
  registerFlowTools(server, client);
  registerFileTools(server, client);
  registerSystemTools(server, client);
  return server;
}

const app = express();
app.use(express.json());

const transports = new Map<string, StreamableHTTPServerTransport>();

app.all('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (sessionId) {
    const transport = transports.get(sessionId);
    if (!transport) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    await transport.handleRequest(req, res, req.body);
    return;
  }

  // New session — must be an initialize request
  if (req.method !== 'POST' || !isInitializeRequest(req.body)) {
    res.status(400).json({ error: 'Expected MCP initialize request' });
    return;
  }

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });

  transport.onclose = () => {
    if (transport.sessionId) transports.delete(transport.sessionId);
  };

  await createMcpServer().connect(transport);
  await transport.handleRequest(req, res, req.body);

  if (transport.sessionId) {
    transports.set(transport.sessionId, transport);
  }
});

app.get('/health', async (_req, res) => {
  try {
    await client.get('/api/status');
    res.json({ status: 'ok', fileflowsUrl: FILEFLOWS_URL, fileflowsReachable: true });
  } catch {
    res.status(503).json({ status: 'degraded', fileflowsUrl: FILEFLOWS_URL, fileflowsReachable: false });
  }
});

app.listen(PORT, () => {
  console.log(`FileFlows MCP listening on port ${PORT}`);
  console.log(`FileFlows URL: ${FILEFLOWS_URL}`);
  console.log(`Health:        http://localhost:${PORT}/health`);
  console.log(`MCP endpoint:  http://localhost:${PORT}/mcp`);
});
