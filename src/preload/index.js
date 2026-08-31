import { contextBridge, ipcRenderer } from 'electron'

// API expuesta al renderer.
const api = {
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  },
  scanComPorts: () => ipcRenderer.invoke('ports:scan')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.api = api
}
