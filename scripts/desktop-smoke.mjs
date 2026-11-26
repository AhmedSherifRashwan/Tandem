import { _electron as electron } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const temp = await fs.mkdtemp(path.join(os.tmpdir(),'nexus-desktop-test-'));
const desktop = await electron.launch(process.env.NEXUS_PACKAGED_APP ? {executablePath:process.env.NEXUS_PACKAGED_APP,args:[`--user-data-dir=${temp}`]} : {args:['.',`--user-data-dir=${temp}`]});
try {
 const page = await desktop.firstWindow();
 await page.waitForSelector('.welcome');
 const state = await page.evaluate(() => window.nexus.state());
 assert.equal(state.conversations.length,0);
 const status = await page.evaluate(() => window.nexus.status());
 assert.ok(status.claude && status.codex);
 await page.getByRole('button',{name:'New conversation'}).click();
 await page.waitForFunction(() => document.querySelector('.section-label span')?.textContent === '1');
 const saved = await page.evaluate(() => window.nexus.state());
 assert.equal(saved.conversations.length,1);
 await fs.mkdir('test-results',{recursive:true});
 await page.screenshot({path:'test-results/nexuslink-desktop.png'});
 // Exercise native PDF generation with a deterministic save-dialog result.
 if (process.argv.includes('--live')) {
  const workspace = path.join(temp, 'workspace'); await fs.mkdir(workspace);
  await desktop.evaluate(({dialog},workspace) => {dialog.showOpenDialog=async()=>({canceled:false,filePaths:[workspace]});},workspace);
  await page.getByRole('button',{name:'Open a workspace'}).click();
  await page.getByRole('textbox',{name:'Message Claude and Codex'}).fill('What is 2 + 2? Answer in one short sentence. Do not use tools or inspect files.');
  await page.getByRole('button',{name:'Send message'}).click();
  await page.waitForSelector('.message.assistant', {timeout:240000});
  assert.equal(await page.locator('.message.failed').count(),0);
  assert.match(await page.locator('.message.assistant .prose').last().innerText(), /4|four/i);
  const live = await page.evaluate(() => window.nexus.state());
  assert.equal(live.conversations[0].messages.at(-1).stages.length,3);
  console.log('Live desktop round trip passed: both CLI agents → MCP → synthesis → rendered response.');
 }
 const pdfPath = path.join(temp,'report.pdf');
 await desktop.evaluate(({dialog},pdfPath) => {dialog.showSaveDialog=async()=>({canceled:false,filePath:pdfPath});},pdfPath);
 const exported = await page.evaluate(() => window.nexus.pdf({title:'Smoke report',text:'# NexusLink report\n\nA **real PDF** exported by the desktop app.\n\n| Check | Result |\n| --- | --- |\n| MCP | Connected |'}));
 assert.equal(exported,pdfPath);
 const bytes = await fs.readFile(pdfPath); assert.equal(bytes.subarray(0,4).toString(),'%PDF'); assert.ok(bytes.length>1000);
 const history = JSON.parse(await fs.readFile(path.join(temp,'history.json'),'utf8')); assert.equal(history.conversations.length,1);
 console.log('Desktop smoke passed: isolated renderer, MCP connection, CLI discovery, chat persistence, PDF generation.');
} finally {await desktop.close(); await fs.rm(temp,{recursive:true,force:true});}
