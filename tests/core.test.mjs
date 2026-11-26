import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { within, extractAnswer, agentArgs, runProcess } from '../mcp/core.mjs';
import { orchestrate } from '../electron/orchestrator.mjs';
test('workspace boundary rejects traversal and symlinks outside root', async () => {
 const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'nexus-test-'));
 try { await fs.mkdir(path.join(dir, 'workspace')); await fs.writeFile(path.join(dir, 'secret'), 'secret'); await fs.symlink(path.join(dir, 'secret'), path.join(dir, 'workspace/link')); await assert.rejects(within(path.join(dir,'workspace'), '../secret'), /outside/); await assert.rejects(within(path.join(dir,'workspace'), 'link'), /outside/); assert.equal(await within(dir, 'workspace'), path.join(await fs.realpath(dir), 'workspace')); } finally { await fs.rm(dir, { recursive: true }); }
});
test('extracts real Claude and Codex result formats and surfaces failures', () => {
 assert.equal(extractAnswer('claude', '{"type":"result","result":"Hello"}'), 'Hello');
 assert.equal(extractAnswer('codex', '{"type":"thread.started"}\n{"type":"item.completed","item":{"type":"agent_message","text":"Done"}}'), 'Done');
 assert.throws(() => extractAnswer('claude', '{"type":"result","is_error":true,"result":"Login expired"}'), /Login expired/);
 assert.throws(() => extractAnswer('codex', '{"type":"turn.failed","error":{"message":"Rate limit"}}'), /Rate limit/);
});
test('consultation defaults to read-only and explicit write is scoped', () => {
 assert.ok(agentArgs('codex').includes('read-only')); assert.ok(agentArgs('codex', {write:true}).includes('workspace-write'));
 assert.ok(!agentArgs('claude').join(' ').includes('Bash')); assert.ok(agentArgs('claude').includes('--restricted'));
 assert.ok(agentArgs('claude', {web:true}).join(' ').includes('WebSearch')); assert.ok(agentArgs('codex',{web:true}).includes('--search'));
});
test('process cancellation stops a long-running command', async () => {
 const controller = new AbortController(); const promise = runProcess(process.execPath, ['-e','setTimeout(() => {}, 10000)'], { signal: controller.signal }); controller.abort(); await assert.rejects(promise, /Cancelled/);
});
function harness(options = {}) {
 const calls = [], events = []; let writers = 0, maxWriters = 0;
 const args = { prompt: 'Build a feature', messages: [], root: '/tmp', mode: 'normal', web: false, write: false, signal: new AbortController().signal, emit: e => events.push(e), call: async (name, input) => { calls.push(input); if (options.fail?.includes(input.provider)) throw new Error('Unavailable'); if(input.write) { writers++; maxWriters = Math.max(writers,maxWriters); } await Promise.resolve(); if(input.write) writers--; return {text:`${input.provider} answer`}; }, ...options };
 return { calls, events, args, maxWriters: () => maxWriters };
}
test('normal consults both models then synthesizes without write access', async () => {
 const h = harness(); assert.equal(await orchestrate(h.args), 'claude answer'); assert.equal(h.calls.length,3); assert.deepEqual(h.calls.slice(0,2).map(c => c.provider), ['claude','codex']); assert.ok(h.calls.every(c => !c.write)); assert.equal(h.events.at(-1).stage, 'Unified response');
});
test('deep cross-reviews and revises, then uses only one writer', async () => {
 const h = harness({mode:'deep',write:true}); await orchestrate(h.args); assert.equal(h.calls.length,6); assert.equal(h.calls.filter(c => c.write).length,1); assert.equal(h.calls.find(c => c.write).provider,'codex'); assert.equal(h.maxWriters(),1); assert.deepEqual(h.events.filter(e => e.status === 'complete').map(e => e.stage), ['Independent answer','Independent answer','Cross-review','Revision','Workspace execution','Unified response']);
});
test('single-provider failure is disclosed; both failing never yields a fake response', async () => {
 const h = harness({fail:['claude']}); assert.match(await orchestrate(h.args), /Only one agent/); const both = harness({fail:['claude','codex']}); await assert.rejects(orchestrate(both.args), /Both agents failed/);
});
test('cancellation prevents new calls', async () => { const controller = new AbortController(); controller.abort(); const h = harness({signal:controller.signal}); await assert.rejects(orchestrate(h.args), /Cancelled/); assert.equal(h.calls.length,0); });
