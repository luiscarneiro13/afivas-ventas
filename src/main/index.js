import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { exec } from 'child_process'
import koffi from 'koffi'
import icon from '../../resources/icon.png?asset'

const isDev = !app.isPackaged

function tfhkaDllPath() {
  return isDev
    ? join(__dirname, '../../Conectores/tfhkaif.dll')
    : join(process.resourcesPath, 'Conectores/tfhkaif.dll')
}

// Prueba de solo conexión con la impresora fiscal TFHKA: abre el puerto,
// hace ping (CheckFprinter) y lee su estado (ReadFpStatus). Nunca llama a
// SendCmd ni a ninguna función que imprima o escriba en memoria fiscal,
// para no arriesgar el estado fiscal del equipo.
async function testTfhka(comPort) {
  if (process.platform !== 'win32') {
    return { ok: false, message: 'La prueba solo puede ejecutarse en Windows.' }
  }
  if (!comPort) {
    return { ok: false, message: 'Selecciona un puerto COM primero.' }
  }

  let lib
  try {
    lib = koffi.load(tfhkaDllPath())
  } catch (err) {
    return { ok: false, message: `No se pudo cargar tfhkaif.dll: ${err.message}` }
  }

  try {
    const OpenFpctrl = lib.func('bool __stdcall OpenFpctrl(const char *lpPortName)')
    const CloseFpctrl = lib.func('bool __stdcall CloseFpctrl()')
    const CheckFprinter = lib.func('bool __stdcall CheckFprinter()')
    const ReadFpStatus = lib.func('bool __stdcall ReadFpStatus(_Out_ int *status, _Out_ int *error)')

    if (!OpenFpctrl(comPort)) {
      return { ok: false, message: `No se pudo abrir el puerto ${comPort}.` }
    }

    try {
      if (!CheckFprinter()) {
        return { ok: false, message: 'La impresora fiscal no respondió (CheckFprinter).' }
      }

      const statusOut = [0]
      const errorOut = [0]
      if (!ReadFpStatus(statusOut, errorOut)) {
        return { ok: false, message: 'No se pudo leer el estado de la impresora.' }
      }

      return { ok: true, message: `Conectado. Estado: ${statusOut[0]}, Error: ${errorOut[0]}` }
    } finally {
      CloseFpctrl()
    }
  } catch (err) {
    return { ok: false, message: err.message || String(err) }
  } finally {
    lib.unload()
  }
}

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
  ipcMain.handle('tfhka:test', (_event, comPort) => testTfhka(comPort))

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
