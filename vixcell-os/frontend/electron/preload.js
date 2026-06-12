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

  // Meeting window (vixcell.com room as a desktop window, admin role)
  openMeeting: (url) => ipcRenderer.invoke('open-meeting', url),

  // Floating assistant bar
  barToggle: () => ipcRenderer.invoke('bar-toggle'),
  barHide: () => ipcRenderer.send('bar-hide'),
  barShow: () => ipcRenderer.send('bar-show'),
  barSetExpanded: (expanded) => ipcRenderer.send('bar-set-height', expanded),
  barNavigate: (route) => ipcRenderer.send('bar-navigate', route),
  onBarPushToTalk: (cb) => {
    const handler = () => cb()
    ipcRenderer.on('bar-ptt', handler)
    return () => ipcRenderer.removeListener('bar-ptt', handler)
  },
  onAssistantNavigate: (cb) => {
    const handler = (_e, route) => cb(route)
    ipcRenderer.on('assistant-navigate', handler)
    return () => ipcRenderer.removeListener('assistant-navigate', handler)
  },
})
