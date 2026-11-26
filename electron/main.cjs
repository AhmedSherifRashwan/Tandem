const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { randomUUID } = require('node:crypto');
app.setName('Tandem');
let win, client, transport, state, active, stateFile;
let saveQueue = Promise.resolve();
const empty = () => ({ conversations: [], workspace: '', settings: { web: true, mode: 'normal', write: false } });
async function persist() {
  const json = JSON.stringify(state, null, 2);
  saveQueue = saveQueue.catch(() => {}).then(async () => { await fs.writeFile(stateFile + '.tmp', json, { mode: 0o600 }); await fs.rename(stateFile + '.tmp', stateFile); });
  await saveQueue;
}
async function call(name, args, signal) {
  const result = await client.callTool({ name, arguments: args }, undefined, { timeout: 660000, signal });
  const text = result.content?.filter(x => x.type === 'text').map(x => x.text).join('\n');
  if (result.isError) throw new Error(text || 'MCP tool failed');
  return JSON.parse(text);
}
async function connect() {
  const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
  const { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio.js');
  const paths = [path.join(os.homedir(), '.local/bin'), '/opt/homebrew/bin', '/usr/local/bin', process.env.PATH || ''];
  try { const versions = await fs.readdir(path.join(os.homedir(), '.nvm/versions/node')); paths.unshift(...versions.sort((a,b) => b.localeCompare(a, undefined, { numeric: true })).map(v => path.join(os.homedir(), '.nvm/versions/node', v, 'bin'))); } catch {}
  const env = Object.fromEntries(Object.entries(process.env).filter(([,v]) => typeof v === 'string'));
  transport = new StdioClientTransport({ command: process.execPath, args: [path.join(__dirname, '../mcp/server.mjs')], env: { ...env, ELECTRON_RUN_AS_NODE: '1', PATH: paths.join(path.delimiter) }, stderr: 'pipe' });
  client = new Client({ name: 'tandem-desktop', version: '0.1.0' });
  await client.connect(transport);
  await client.listTools();
}
const broadcast = data => { if (win && !win.isDestroyed()) win.webContents.send('tandem:event', data); };
function register() {
  const handle = (name, fn) => ipcMain.handle(`tandem:${name}`, (event, ...args) => {
    if (event.sender !== win.webContents || event.senderFrame !== win.webContents.mainFrame) throw new Error('Untrusted sender');
    return fn(...args);
  });
  handle('state', () => state);
  handle('status', () => call('agent_status', {}));
  handle('new', async () => { const chat = { id: randomUUID(), title: 'New conversation', created: new Date().toISOString(), messages: [] }; state.conversations.unshift(chat); await persist(); return chat; });
  handle('delete', async id => { if (active?.id === id) throw new Error('Stop this conversation before deleting it.'); state.conversations = state.conversations.filter(c => c.id !== id); await persist(); return state; });
  handle('settings', async settings => { state.settings = { web: settings.web === true, write: settings.write === true, mode: settings.mode === 'deep' ? 'deep' : 'normal' }; await persist(); return state.settings; });
  handle('folder', async () => { if (active) throw new Error('Stop the current task before changing folders.'); const result = await dialog.showOpenDialog(win, { properties: ['openDirectory', 'createDirectory'], title: 'Choose a trusted workspace' }); if (!result.canceled) { state.workspace = await fs.realpath(result.filePaths[0]); await persist(); } return state.workspace; });
  handle('reveal', () => { if (state.workspace) shell.showItemInFolder(state.workspace); });
  handle('workspace', async (tool, args = {}) => {
    if (!['workspace_list','workspace_read','workspace_write','workspace_diff','workspace_command'].includes(tool)) throw new Error('Unsupported tool');
    if (!state.workspace) throw new Error('Open a workspace folder first.');
    if (active && ['workspace_write','workspace_command'].includes(tool)) throw new Error('Wait for the agent task to finish before changing workspace files.');
    if (tool === 'workspace_command') {
      const approval = await dialog.showMessageBox(win, { type: 'question', buttons: ['Cancel', 'Run command'], defaultId: 0, cancelId: 0, message: 'Run this local command?', detail: `${args.command}\n\nWorking folder: ${state.workspace}\nCommands run with your Mac user permissions.` });
      if (approval.response !== 1) throw new Error('Command cancelled.');
    }
    return call(tool, { ...args, root: state.workspace });
  });
  handle('stop', () => active?.controller.abort());
  handle('send', async ({ id, prompt }) => {
    if (active) throw new Error('Another response is running.');
    if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 100000) throw new Error('Enter a prompt under 100,000 characters.');
    const chat = state.conversations.find(c => c.id === id);
    if (!chat) throw new Error('Conversation not found.');
    if (!state.workspace) throw new Error('Open a trusted workspace folder first.');
    const { orchestrate } = await import('./orchestrator.mjs');
    const previous = [...chat.messages];
    const settings = { ...state.settings };
    const root = state.workspace;
    chat.messages.push({ id: randomUUID(), role: 'user', text: prompt });
    if (chat.title === 'New conversation') chat.title = prompt.replace(/\s+/g, ' ').slice(0, 55);
    const controller = new AbortController();
    active = { id, controller };
    const stages = [];
    try {
      await persist();
      const text = await orchestrate({ prompt, messages: previous, root, ...settings, signal: controller.signal, call, emit: e => { const index = stages.findIndex(s => s.provider === e.provider && s.stage === e.stage); if (index < 0) stages.push(e); else stages[index] = e; broadcast({ ...e, conversationId: id }); } });
      chat.messages.push({ id: randomUUID(), role: 'assistant', text, stages, mode: settings.mode });
    } catch (e) {
      chat.messages.push({ id: randomUUID(), role: 'assistant', text: controller.signal.aborted ? 'Stopped. Any workspace changes already made remain on disk; check Changes before continuing.' : e.message, stages, error: true });
    } finally { active = null; await persist(); broadcast({ type: 'done', conversationId: id }); }
    return state;
  });
  handle('pdf', async ({ title, text }) => {
    if (typeof text !== 'string' || text.length > 1_000_000) throw new Error('Invalid report');
    const result = await dialog.showSaveDialog(win, { defaultPath: `${String(title).replace(/[^a-zA-Z0-9 -]/g, '').slice(0,80) || 'Report'}.pdf`, filters: [{ name: 'PDF', extensions: ['pdf'] }] });
    if (result.canceled) return null;
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { createElement } = await import('react');
    const { default: Markdown } = await import('react-markdown');
    const { default: gfm } = await import('remark-gfm');
    const html = renderToStaticMarkup(createElement(Markdown, { remarkPlugins: [gfm], children: text }));
    const print = new BrowserWindow({ show: false, webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false, partition: `tandem-print-${randomUUID()}` } });
    try {
      print.webContents.session.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*'] }, (_, cb) => cb({ cancel: true }));
      await print.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><style>body{font:12px/1.65 -apple-system,Arial;color:#181818;padding:20px}h1{font-size:26px}h2{font-size:20px}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f4f4f4;padding:12px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:6px}a{color:#195f71}img{display:none}p,li{orphans:3;widows:3}</style>${html}`));
      await fs.writeFile(result.filePath, await print.webContents.printToPDF({ printBackground: true, pageSize: 'A4', margins: { top: .5, bottom: .5, left: .5, right: .5 } }));
      return result.filePath;
    } finally { print.destroy(); }
  });
}
app.whenReady().then(async () => {
  if (!app.commandLine.hasSwitch('user-data-dir')) {
    const { migrateHistory } = require('./history.cjs');
    await migrateHistory(app.getPath('userData'), ['NexusLink', 'nexuslink'].map(name => path.join(app.getPath('appData'), name)));
  }
  stateFile = path.join(app.getPath('userData'), 'history.json');
  await fs.mkdir(path.dirname(stateFile), { recursive: true });
  try { state = JSON.parse(await fs.readFile(stateFile, 'utf8')); if (!Array.isArray(state.conversations)) throw new Error('Invalid history'); }
  catch (e) { if (e.code !== 'ENOENT') { await fs.copyFile(stateFile, stateFile + `.backup-${Date.now()}`).catch(() => {}); } state = empty(); }
  // Write access is always opt-in again after restarting.
  state.settings.write = false;
  register();
  await connect();
  win = new BrowserWindow({ width: 1440, height: 940, minWidth: 760, minHeight: 600, title: 'Tandem', titleBarStyle: 'hiddenInset', trafficLightPosition: { x: 20, y: 18 }, backgroundColor: '#f1f4f4', webPreferences: { preload: path.join(__dirname, 'preload.cjs'), nodeIntegration: false, contextIsolation: true, sandbox: true } });
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:\/\//.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', e => e.preventDefault());
  await win.loadFile(path.join(__dirname, '../dist/index.html'));
}).catch(error => { dialog.showErrorBox('Tandem could not start', error.stack || error.message); app.quit(); });
app.on('window-all-closed', () => app.quit());
app.on('before-quit', () => { active?.controller.abort(); client?.close().catch(() => {}); });
