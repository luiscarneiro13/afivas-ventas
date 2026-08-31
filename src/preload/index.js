import { contextBridge } from 'electron'

// API expuesta al renderer. Aún no hay backend/IPC: se deja el puente
// preparado para cuando se integren canales `ipcRenderer.invoke(...)`.
const api = {
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
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
