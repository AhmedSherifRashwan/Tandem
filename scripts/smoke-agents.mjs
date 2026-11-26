// Opt-in live check: consumes the signed-in CLI accounts' normal usage.
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'node:url';
const client = new Client({name:'nexuslink-live-check',version:'0.1.0'});
try {
 await client.connect(new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('../mcp/server.mjs',import.meta.url))],stderr:'pipe'}));
 for (const provider of process.argv.slice(2).length ? process.argv.slice(2) : ['claude','codex']) {
  const result = await client.callTool({name:'agent_generate',arguments:{provider,prompt:'Reply with exactly: NexusLink connected. Do not read files, use tools, or perform any action.',root:process.cwd(),web:false,write:false}},undefined,{timeout:180000});
  console.log(provider, result.isError ? 'FAILED' : 'OK', result.content.map(c => c.text || '').join('\n'));
  if(result.isError) process.exitCode=1;
 }
} finally {await client.close();}
