import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const children = new Set();
export function terminateProcesses() {
  for (const child of children) { try { process.kill(process.platform === 'win32' ? child.pid : -child.pid, 'SIGTERM'); } catch {} }
}

export async function within(root, relative = '.') {
  const base = await fs.realpath(root);
  const resolved = await fs.realpath(path.resolve(base, relative));
  if (resolved !== base && !resolved.startsWith(base + path.sep)) throw new Error('Path is outside the selected workspace.');
  return resolved;
}
export function runProcess(command, args, { cwd, input, signal, timeout = 600_000, maxBytes = 8_000_000 } = {}) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, NO_COLOR: '1' };
    delete env.ELECTRON_RUN_AS_NODE;
    const child = spawn(command, args, { cwd, env, stdio: ['pipe', 'pipe', 'pipe'], detached: process.platform !== 'win32' });
    children.add(child);
    child.once('close', () => children.delete(child));
    let stdout = '', stderr = '', done = false;
    const stop = () => {
      try { process.kill(process.platform === 'win32' ? child.pid : -child.pid, 'SIGTERM'); } catch {}
      const force = setTimeout(() => { if (children.has(child)) { try { process.kill(process.platform === 'win32' ? child.pid : -child.pid, 'SIGKILL'); } catch {} } }, 1500);
      force.unref();
    };
    const finish = (error, value) => { if (done) return; done = true; clearTimeout(timer); signal?.removeEventListener('abort', abort); error ? reject(error) : resolve(value); };
    const abort = () => { stop(); finish(new Error('Cancelled')); };
    const timer = setTimeout(() => { stop(); finish(new Error('Process timed out.')); }, timeout);
    signal?.addEventListener('abort', abort, { once: true });
    child.on('error', error => finish(new Error(`Could not start ${command}: ${error.message}`)));
    child.stdout.on('data', chunk => { stdout += chunk; if (stdout.length > maxBytes) { stop(); finish(new Error('Output exceeded the size limit.')); } });
    child.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-16000); });
    child.on('close', code => finish(null, { code, stdout, stderr }));
    child.stdin.on('error', () => {});
    child.stdin.end(input || '');
    if (signal?.aborted) abort();
  });
}
export function extractAnswer(provider, output) {
  const events = output.split('\n').flatMap(line => { try { return [JSON.parse(line)]; } catch { return []; } });
  if (provider === 'claude') {
    const result = events.findLast(e => e.type === 'result');
    if (result?.is_error) throw new Error(result.result || result.errors?.join('\n') || 'Claude failed.');
    if (result?.result) return result.result;
  } else {
    const answers = events.filter(e => e.type === 'item.completed' && e.item?.type === 'agent_message').map(e => e.item.text);
    if (answers.length) return answers.join('\n\n');
    const failure = events.find(e => e.type === 'turn.failed' || e.type === 'error');
    if (failure) throw new Error(failure.error?.message || failure.message || 'Codex failed.');
  }
  throw new Error(`${provider} returned no answer. Check CLI authentication and version.`);
}
export function agentArgs(provider, { web = false, write = false } = {}) {
  if (provider === 'claude') {
    const tools = ['Read', 'Glob', 'Grep', ...(web ? ['WebSearch', 'WebFetch'] : [])].join(',');
    return ['--print', '--output-format', 'json', '--restricted', '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}', '--tools', tools, '--allowedTools', tools];
  }
  return [...(web ? ['--search'] : []), '-a', 'never', 'exec', '--json', '--ephemeral', '--skip-git-repo-check', '--sandbox', write ? 'workspace-write' : 'read-only', '-'];
}
