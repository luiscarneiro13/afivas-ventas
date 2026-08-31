import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { exec } from 'child_process'
import icon from '../../resources/icon.png?asset'

const isDev = !app.isPackaged

// Los puertos COM activos quedan registrados por Windows en esta clave del
// registro (DEVICEMAP\SERIALCOMM), sea el puerto físico o un adaptador
// USB-serial con su driver instalado. Es más fiable que `wmic` (deprecado
// y ausente en builds recientes de Windows).
function scanComPorts() {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      resolve([])
      return
    }
    exec('reg query "HKLM\\HARDWARE\\DEVICEMAP\\SERIALCOMM"', (error, stdout) => {
      if (error) {
        resolve([])
        return
      }
      const ports = [...new Set([...stdout.matchAll(/COM\d+/g)].map((m) => m[0]))]
      ports.sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)))
      resolve(ports)
    })
  })
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    title: 'Afivas Ventas',
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.afivas.ventas')

  ipcMain.handle('ports:scan', scanComPorts)

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
