import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createPatch } from 'diff';
import { within, runProcess, extractAnswer, agentArgs, terminateProcesses } from './core.mjs';

const server = new McpServer({ name: 'tandem-local', version: '0.1.0' });
const result = value => ({ content: [{ type: 'text', text: JSON.stringify(value) }] });
const root = z.string().min(1);
const tool = (name, schema, fn) => server.tool(name, schema, async (args, context) => {
  try { return result(await fn(args, context)); }
  catch (error) { return { isError: true, content: [{ type: 'text', text: error.message }] }; }
});
tool('agent_status', {}, async () => Object.fromEntries(await Promise.all(['claude', 'codex'].map(async provider => {
  try { const r = await runProcess(process.env[`TANDEM_${provider.toUpperCase()}_BIN`] || process.env[`NEXUS_${provider.toUpperCase()}_BIN`] || provider, ['--version'], { timeout: 10000 }); return [provider, { installed: r.code === 0, version: r.stdout.trim(), error: r.code ? r.stderr : null }]; }
  catch (e) { return [provider, { installed: false, error: e.message }]; }
}))));
tool('agent_generate', { provider: z.enum(['claude', 'codex']), prompt: z.string().min(1).max(500000), root, web: z.boolean().default(false), write: z.boolean().default(false) }, async (args, context) => {
  const cwd = await within(args.root);
  if (args.write && args.provider !== 'codex') throw new Error('Only Codex is the workspace writer.');
  const r = await runProcess(process.env[`TANDEM_${args.provider.toUpperCase()}_BIN`] || process.env[`NEXUS_${args.provider.toUpperCase()}_BIN`] || args.provider, agentArgs(args.provider, args), { cwd, input: args.prompt, signal: context.signal });
  if (r.code !== 0) throw new Error(`${args.provider} exited ${r.code}: ${r.stderr || r.stdout.slice(-2000)}`);
  return { text: extractAnswer(args.provider, r.stdout) };
});
tool('workspace_list', { root, directory: z.string().default('.') }, async ({ root, directory }) => {
  const dir = await within(root, directory);
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries.filter(e => !['.git', 'node_modules', '.DS_Store'].includes(e.name)).map(e => ({ name: e.name, path: path.join(directory, e.name), directory: e.isDirectory(), symlink: e.isSymbolicLink() })).sort((a,b) => Number(b.directory)-Number(a.directory) || a.name.localeCompare(b.name));
});
tool('workspace_read', { root, file: z.string() }, async ({ root, file }) => {
  const target = await within(root, file);
  const stat = await fs.stat(target);
  if (!stat.isFile() || stat.size > 1_000_000) throw new Error('Choose a text file smaller than 1 MB.');
  const text = await fs.readFile(target, 'utf8');
  if (text.includes('\u0000')) throw new Error('Binary files cannot be edited here.');
  return { text };
});
tool('workspace_write', { root, file: z.string(), previous: z.string(), text: z.string().max(1_000_000) }, async ({ root, file, previous, text }) => {
  const target = await within(root, file);
  if (path.relative(await fs.realpath(root), target).split(path.sep).some(p => ['.git', '.aws', '.ssh'].includes(p))) throw new Error('Protected folder.');
  const current = await fs.readFile(target, 'utf8');
  if (current !== previous) throw new Error('The file changed on disk. Reload before saving.');
  await fs.writeFile(target, text);
  return { diff: createPatch(file, previous, text) };
});
tool('workspace_diff', { root }, async ({ root }, context) => {
  const cwd = await within(root);
  const r = await runProcess('git', ['-c', 'core.fsmonitor=false', 'diff', '--no-ext-diff', '--no-textconv', 'HEAD', '--', '.'], { cwd, signal: context.signal, timeout: 20000 });
  // A new repository may not yet have HEAD.
  const diff = r.code ? await runProcess('git', ['diff', '--no-ext-diff', '--no-textconv'], { cwd, timeout: 20000 }) : r;
  const status = await runProcess('git', ['-c', 'core.fsmonitor=false', 'status', '--short'], { cwd, timeout: 20000 });
  if (status.code) throw new Error('This folder is not a Git repository. Manual edits still show their saved diff.');
  return { diff: diff.stdout, status: status.stdout };
});
tool('workspace_command', { root, command: z.string().min(1).max(10000) }, async ({ root, command }, context) => {
  const cwd = await within(root);
  return runProcess('/bin/zsh', ['-c', command], { cwd, signal: context.signal, timeout: 120000 });
});
const transport = new StdioServerTransport();
await server.connect(transport);
const onclose = transport.onclose;
transport.onclose = () => { terminateProcesses(); onclose?.(); };
process.on('SIGTERM', () => { terminateProcesses(); process.exit(0); });
process.on('SIGINT', () => { terminateProcesses(); process.exit(0); });
