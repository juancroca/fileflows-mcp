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
import { registerNodeTools } from './tools/nodes.js';
import { registerVariableTools } from './tools/variables.js';
import { registerScriptTools } from './tools/scripts.js';
import { registerTagTools } from './tools/tags.js';
import { registerTaskTools } from './tools/tasks.js';
import { registerNotificationTools } from './tools/notifications.js';
import { registerUserTools } from './tools/users.js';
import { registerAclTools } from './tools/acl.js';
import { registerBackupTools } from './tools/backup.js';
import { registerAuditTools } from './tools/audit.js';
import { registerRevisionTools } from './tools/revisions.js';
import { registerReportTools } from './tools/reports.js';
import { registerStatisticsTools } from './tools/statistics.js';
import { registerPluginTools } from './tools/plugins.js';
import { registerDockerModTools } from './tools/dockermods.js';
import { registerResourceTools } from './tools/resources.js';
import { registerRepositoryTools } from './tools/repository.js';
import { registerConfigurationTools } from './tools/configuration.js';
import { registerSettingsTools } from './tools/settings.js';
import { registerLogTools } from './tools/log.js';
import { registerFileDropTools } from './tools/filedrop.js';
import { registerWebhookTools } from './tools/webhooks.js';

const FILEFLOWS_URL = process.env.FILEFLOWS_URL ?? 'http://localhost:5050';
const PORT = parseInt(process.env.PORT ?? '3000', 10);

const client = new FileFlowsClient(FILEFLOWS_URL);

function createMcpServer(): McpServer {
  const server = new McpServer({ name: 'fileflows', version: '1.0.0' });
  registerLibraryTools(server, client);
  registerFlowTools(server, client);
  registerFileTools(server, client);
  registerSystemTools(server, client);
  registerNodeTools(server, client);
  registerVariableTools(server, client);
  registerScriptTools(server, client);
  registerTagTools(server, client);
  registerTaskTools(server, client);
  registerNotificationTools(server, client);
  registerUserTools(server, client);
  registerAclTools(server, client);
  registerBackupTools(server, client);
  registerAuditTools(server, client);
  registerRevisionTools(server, client);
  registerReportTools(server, client);
  registerStatisticsTools(server, client);
  registerPluginTools(server, client);
  registerDockerModTools(server, client);
  registerResourceTools(server, client);
  registerRepositoryTools(server, client);
  registerConfigurationTools(server, client);
  registerSettingsTools(server, client);
  registerLogTools(server, client);
  registerFileDropTools(server, client);
  registerWebhookTools(server, client);
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
