const { contextBridge, ipcRenderer } = require('electron');
const invoke = name => (...args) => ipcRenderer.invoke(`nexus:${name}`, ...args);
contextBridge.exposeInMainWorld('nexus', {
  state: invoke('state'), status: invoke('status'), newChat: invoke('new'), deleteChat: invoke('delete'), settings: invoke('settings'), folder: invoke('folder'), reveal: invoke('reveal'), workspace: invoke('workspace'), stop: invoke('stop'), send: invoke('send'), pdf: invoke('pdf'),
  onEvent: callback => { const listener = (_, event) => callback(event); ipcRenderer.on('nexus:event', listener); return () => ipcRenderer.removeListener('nexus:event', listener); }
});
