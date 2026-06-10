const { contextBridge, ipcRenderer } = require('electron')

// Expose secure, typed API bridge to the React renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Backend config (API base URL + internal key)
  getConfig: () => ipcRenderer.invoke('get-config'),
  getStorageRoot: () => ipcRenderer.invoke('get-storage-root'),

  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // External links
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
})
