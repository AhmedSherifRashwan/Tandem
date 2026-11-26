import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

test('real MCP stdio handshake, file lifecycle, stale-write rejection and containment', async () => {
 const root = await fs.mkdtemp(path.join(os.tmpdir(), 'nexus-mcp-'));
 const client = new Client({name:'integration-test', version:'1.0.0'});
 try {
  await fs.writeFile(path.join(root,'hello.txt'), 'before');
  await client.connect(new StdioClientTransport({ command: process.execPath, args:[fileURLToPath(new URL('../mcp/server.mjs', import.meta.url))], stderr:'pipe' }));
  const list = await client.listTools(); assert.equal(list.tools.length,7);
  const call = (name,args) => client.callTool({name,arguments:{root,...args}});
  const read = await call('workspace_read',{file:'hello.txt'}); assert.equal(JSON.parse(read.content[0].text).text,'before');
  const save = await call('workspace_write',{file:'hello.txt',previous:'before',text:'after'}); assert.ok(!save.isError); assert.match(JSON.parse(save.content[0].text).diff,/\+after/);
  const stale = await call('workspace_write',{file:'hello.txt',previous:'before',text:'oops'}); assert.ok(stale.isError); assert.match(stale.content[0].text,/changed on disk/);
  await fs.symlink('/etc/hosts',path.join(root,'outside')); const escaped = await call('workspace_read',{file:'outside'}); assert.ok(escaped.isError); assert.match(escaped.content[0].text,/outside/);
  const command = await call('workspace_command',{command:'printf nexus-mcp-ok'}); assert.equal(JSON.parse(command.content[0].text).stdout,'nexus-mcp-ok');
 } finally { await client.close(); await fs.rm(root,{recursive:true,force:true}); }
});

test('MCP adapters invoke CLIs over stdin and parse both providers (test fixtures)', async () => {
 const root = await fs.mkdtemp(path.join(os.tmpdir(), 'nexus-adapters-'));
 const client = new Client({name:'adapter-test', version:'1.0.0'});
 try {
  const claude = path.join(root,'claude-fixture'); const codex = path.join(root,'codex-fixture');
  const fixture = output => `#!${process.execPath}\nlet input=''; process.stdin.on('data',d=>input+=d); process.stdin.on('end',()=>console.log(JSON.stringify(${output})));\n`;
  await fs.writeFile(claude, fixture(`{type:'result',result:'Claude received: '+input}`), {mode:0o755});
  await fs.writeFile(codex, fixture(`{type:'item.completed',item:{type:'agent_message',text:'Codex received: '+input}}`), {mode:0o755});
  await client.connect(new StdioClientTransport({ command:process.execPath,args:[fileURLToPath(new URL('../mcp/server.mjs',import.meta.url))],env:{NEXUS_CLAUDE_BIN:claude,NEXUS_CODEX_BIN:codex},stderr:'pipe' }));
  for(const provider of ['claude','codex']) {
   const result = await client.callTool({name:'agent_generate',arguments:{provider,root,prompt:'hello $(do not execute)',web:false,write:false}});
   assert.ok(!result.isError); assert.match(JSON.parse(result.content[0].text).text,/received: hello \$\(do not execute\)/);
  }
 } finally {await client.close(); await fs.rm(root,{recursive:true,force:true});}
});
