# fileflows-mcp

MCP server for [FileFlows](https://fileflows.com) — exposes the FileFlows REST API as Model Context Protocol tools so an AI assistant can inspect libraries, manage flows, monitor files, and trigger processing operations.

## Tools

### Libraries

| Tool | Description |
|---|---|
| `ff_list_libraries` | List all libraries with status |
| `ff_get_library` | Get details of a specific library |
| `ff_create_library` | Create a new library (path, flow, optional extensions) |
| `ff_update_library` | Update an existing library (pass the full modified library object) |
| `ff_delete_library` | Delete one or more libraries by UID |
| `ff_set_library_enabled` | Enable or disable a library |
| `ff_rescan_library` | Trigger a file-system rescan on specific libraries |
| `ff_rescan_all_libraries` | Trigger a rescan on all enabled libraries |
| `ff_reset_library` | Reset all processed files in a library back to unprocessed |

### Flows

| Tool | Description |
|---|---|
| `ff_list_flows` | List all processing flows |
| `ff_get_flow` | Get a flow including all nodes and connections |
| `ff_update_flow` | Update a flow (pass the full modified flow object) |
| `ff_set_flow_enabled` | Enable or disable a flow |
| `ff_delete_flow` | Delete one or more flows by UID |
| `ff_list_flow_elements` | List all available node types with their schemas |

### Files

| Tool | Description |
|---|---|
| `ff_get_file_status_counts` | Count of files per status across all libraries |
| `ff_list_files` | List files filtered by status (paginated) |
| `ff_search_files` | Search files by path/name, with optional status and library filters |
| `ff_get_file` | Get full file details including metadata, executed nodes, and failure reason |
| `ff_get_file_log` | Get the processing log for a file |
| `ff_reprocess_files` | Requeue one or more files for processing |
| `ff_set_file_status` | Force-set the status of one or more files |
| `ff_abort_files` | Abort currently-processing files |
| `ff_move_to_top` | Move files to the top of the processing queue |
| `ff_unhold_files` | Release OnHold files back to Unprocessed |
| `ff_delete_files` | Remove files from the queue (does not delete from disk) |

### System

| Tool | Description |
|---|---|
| `ff_get_status` | Live queue depth and currently processing files |
| `ff_get_node_overview` | Status of all processing nodes |
| `ff_get_version` | Get the FileFlows server version |

### File status codes

| Code | Meaning |
|---|---|
| `0` | Unprocessed |
| `1` | Processing |
| `2` | Processed |
| `4` | ProcessingFailed |
| `-1` | OnHold |
| `-2` | Disabled |
| `-3` | OutOfSchedule |

## Configuration

| Environment variable | Default | Description |
|---|---|---|
| `FILEFLOWS_URL` | `http://localhost:5050` | Base URL of the FileFlows instance |
| `PORT` | `3000` | Port the MCP server listens on |

## Local development

Requires Node.js 18+.

```bash
npm install
npm run dev          # start with tsx (no build step)
npm run build        # compile to dist/
npm start            # run compiled output
npm test             # run tests
npm run test:watch   # run tests in watch mode
```

The server exposes:

- `GET  /health` — liveness check, also verifies FileFlows is reachable
- `POST /mcp`   — MCP Streamable HTTP endpoint

## Adding to Claude Code

Add to `~/.claude.json` (global) or `.claude/settings.json` (project):

```json
{
  "mcpServers": {
    "fileflows": {
      "type": "http",
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

Replace `http://localhost:3000` with the public URL if the server is deployed remotely (e.g. via Cloudflare Tunnel).

## Docker

```bash
docker build -t fileflows-mcp .
docker run -d \
  -e FILEFLOWS_URL=http://host.docker.internal:5050 \
  -p 3000:3000 \
  --name fileflows-mcp \
  fileflows-mcp
```

## Testing

Tests use [Vitest](https://vitest.dev) with the MCP SDK's `InMemoryTransport` — no running server or FileFlows instance needed.

- `tests/api.test.ts` — `FileFlowsClient` unit tests (fetch mocked)
- `tests/tools/` — per-tool tests via in-process MCP client (API client mocked)
