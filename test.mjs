import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const transport = new StreamableHTTPClientTransport(new URL('http://localhost:3000/mcp'));
const client = new Client({ name: 'test', version: '1.0.0' });

await client.connect(transport);

// List tools
const { tools } = await client.listTools();
console.log(`\n=== Tools registered (${tools.length}) ===`);
for (const tool of tools) console.log(` - ${tool.name}`);

// ff_list_libraries
console.log('\n=== ff_list_libraries ===');
const libs = await client.callTool({ name: 'ff_list_libraries', arguments: {} });
const libData = JSON.parse(libs.content[0].text);
console.log(`Libraries: ${libData.map(l => `${l.Name} (enabled=${l.Enabled})`).join(', ')}`);

// ff_get_file_status_counts
console.log('\n=== ff_get_file_status_counts ===');
const counts = await client.callTool({ name: 'ff_get_file_status_counts', arguments: {} });
console.log(counts.content[0].text);

// ff_get_status
console.log('\n=== ff_get_status ===');
const status = await client.callTool({ name: 'ff_get_status', arguments: {} });
console.log(status.content[0].text.slice(0, 400));

// ff_search_files — find a failed file
console.log('\n=== ff_search_files (status=4) ===');
const failed = await client.callTool({ name: 'ff_list_files', arguments: { status: 4, pageSize: 3 } });
console.log(failed.content[0].text.slice(0, 600));

await client.close();
console.log('\nAll tests passed.');
