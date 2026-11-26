import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { migrateHistory } from '../electron/history.cjs';

test('rename migration preserves old history and never overwrites Tandem history', async () => {
 const root = await fs.mkdtemp(path.join(os.tmpdir(), 'tandem-history-'));
 try {
  const old = path.join(root, 'NexusLink'), current = path.join(root, 'Tandem');
  await fs.mkdir(old);
  const history = JSON.stringify({ conversations: [{ id: 'existing', messages: [] }] });
  await fs.writeFile(path.join(old, 'history.json'), history);
  assert.equal(await migrateHistory(current, [path.join(root,'missing'), old]), true);
  assert.equal(await fs.readFile(path.join(current,'history.json'),'utf8'), history);
  assert.equal(await fs.readFile(path.join(old,'history.json'),'utf8'), history);
  await fs.writeFile(path.join(current,'history.json'), 'new history');
  assert.equal(await migrateHistory(current,[old]), false);
  assert.equal(await fs.readFile(path.join(current,'history.json'),'utf8'), 'new history');
 } finally { await fs.rm(root,{recursive:true,force:true}); }
});
test('a fresh installation does not invent a migrated history', async () => {
 const root = await fs.mkdtemp(path.join(os.tmpdir(), 'tandem-fresh-'));
 try { assert.equal(await migrateHistory(path.join(root,'Tandem'),[path.join(root,'missing')]),false); }
 finally { await fs.rm(root,{recursive:true,force:true}); }
});
