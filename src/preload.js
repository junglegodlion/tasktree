const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadData: () => ipcRenderer.invoke('data:load'),
  saveData: (data) => ipcRenderer.invoke('data:save', data),
  notify: (opts) => ipcRenderer.invoke('notify', opts),
  setTitle: (title) => ipcRenderer.invoke('window:setTitle', title),
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  flashFrame: () => ipcRenderer.invoke('window:flashFrame'),
  focusWindow: () => ipcRenderer.invoke('window:focus'),
  playSound: (type) => ipcRenderer.invoke('playSound', type),
});
