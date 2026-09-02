import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { exec } from 'child_process'
import koffi from 'koffi'
import icon from '../../resources/icon.png?asset'
import { getDb } from './db/connection.js'
import { migrateAndSeed } from './db/migrate.js'
import { registerDbHandlers } from './ipc/db-handlers.js'

const isDev = !app.isPackaged

function tfhkaDllPath() {
  return isDev
    ? join(__dirname, '../../Conectores/tfhkaif.dll')
    : join(process.resourcesPath, 'Conectores/tfhkaif.dll')
}

// Carga tfhkaif.dll, abre el puerto indicado, ejecuta `run(lib)` y siempre
// cierra el puerto y descarga la librería al terminar. Centraliza el
// manejo de errores común a toda operación contra la impresora fiscal.
async function withTfhka(comPort, run) {
  if (process.platform !== 'win32') {
    return { ok: false, message: 'Esta operación solo puede ejecutarse en Windows.' }
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

    if (!OpenFpctrl(comPort)) {
      return { ok: false, message: `No se pudo abrir el puerto ${comPort}.` }
    }

    try {
      return await run(lib)
    } finally {
      CloseFpctrl()
    }
  } catch (err) {
    return { ok: false, message: err.message || String(err) }
  } finally {
    lib.unload()
  }
}

// Prueba de solo conexión con la impresora fiscal TFHKA: hace ping
// (CheckFprinter) y lee su estado (ReadFpStatus). Nunca llama a SendCmd ni
// a ninguna función que imprima o escriba en memoria fiscal, para no
// arriesgar el estado fiscal del equipo.
function testTfhka(comPort) {
  return withTfhka(comPort, (lib) => {
    const CheckFprinter = lib.func('bool __stdcall CheckFprinter()')
    const ReadFpStatus = lib.func('bool __stdcall ReadFpStatus(_Out_ int *status, _Out_ int *error)')

    if (!CheckFprinter()) {
      return { ok: false, message: 'La impresora fiscal no respondió (CheckFprinter).' }
    }

    const statusOut = [0]
    const errorOut = [0]
    if (!ReadFpStatus(statusOut, errorOut)) {
      return { ok: false, message: 'No se pudo leer el estado de la impresora.' }
    }

    return { ok: true, message: `Conectado. Estado: ${statusOut[0]}, Error: ${errorOut[0]}` }
  })
}

// Imprime el Reporte X: consulta no fiscal del acumulado del día, no
// resetea nada (a diferencia del Reporte Z). Comando "I0X" vía SendCmd.
function printReporteX(comPort) {
  return withTfhka(comPort, (lib) => {
    const SendCmd = lib.func('bool __stdcall SendCmd(_Out_ int *status, _Out_ int *error, const char *cmd)')

    const statusOut = [0]
    const errorOut = [0]
    if (!SendCmd(statusOut, errorOut, 'I0X')) {
      return {
        ok: false,
        message: `No se pudo imprimir el Reporte X (estado: ${statusOut[0]}, error: ${errorOut[0]}).`
      }
    }

    return { ok: true, message: 'Reporte X enviado a la impresora.' }
  })
}

// Imprime el Reporte Z: cierre fiscal del día, resetea los acumulados de la
// impresora (a diferencia del Reporte X). Comando "I0Z" vía SendCmd. Es una
// operación irreversible en el equipo fiscal real.
function printReporteZ(comPort) {
  return withTfhka(comPort, (lib) => {
    const SendCmd = lib.func('bool __stdcall SendCmd(_Out_ int *status, _Out_ int *error, const char *cmd)')

    const statusOut = [0]
    const errorOut = [0]
    if (!SendCmd(statusOut, errorOut, 'I0Z')) {
      return {
        ok: false,
        message: `No se pudo imprimir el Reporte Z (estado: ${statusOut[0]}, error: ${errorOut[0]}).`
      }
    }

    return { ok: true, message: 'Reporte Z enviado a la impresora.' }
  })
}

// Formatea un precio como exige el comando `!` de TFHKA: 8 dígitos enteros
// + 2 decimales, sin separador, con ceros a la izquierda (10 caracteres).
function formatPrecioTfhka(precio) {
  return String(Math.round(Number(precio) * 100)).padStart(10, '0')
}

// Formatea una cantidad como exige el comando `!` de TFHKA: 5 dígitos
// enteros + 3 decimales, sin separador, con ceros a la izquierda (8 caracteres).
function formatCantidadTfhka(cantidad) {
  return String(Math.round(Number(cantidad) * 1000)).padStart(8, '0')
}

// Imprime la factura fiscal completa: identifica al cliente, registra cada
// ítem y totaliza con el medio de pago, siguiendo el protocolo documentado
// en Docs/04-INTEGRACION_TFHKA.md. Si cualquier comando falla se aborta de
// inmediato — un envío a medias sobre memoria fiscal no debe continuarse.
function printFacturaFiscal(comPort, venta) {
  return withTfhka(comPort, (lib) => {
    const SendCmd = lib.func('bool __stdcall SendCmd(_Out_ int *status, _Out_ int *error, const char *cmd)')

    function send(cmd) {
      const statusOut = [0]
      const errorOut = [0]
      const okCmd = SendCmd(statusOut, errorOut, cmd)
      return { okCmd, status: statusOut[0], error: errorOut[0] }
    }

    if (venta.cliente?.cedula) {
      const rif = `${venta.cliente.tipoDocumento || 'V'}${venta.cliente.cedula}`
      const r = send(`iR*${rif}`)
      if (!r.okCmd) {
        return {
          ok: false,
          message: `No se pudo enviar el RIF/CI del cliente (estado: ${r.status}, error: ${r.error}).`
        }
      }
    }
    if (venta.cliente?.nombre) {
      const r = send(`iS*${venta.cliente.nombre.toUpperCase()}`)
      if (!r.okCmd) {
        return {
          ok: false,
          message: `No se pudo enviar el nombre del cliente (estado: ${r.status}, error: ${r.error}).`
        }
      }
    }

    for (const item of venta.items || []) {
      const cmd = `!${formatPrecioTfhka(item.precio)}${formatCantidadTfhka(item.cantidad)}|${item.codigo}|${item.desc}`
      const r = send(cmd)
      if (!r.okCmd) {
        return {
          ok: false,
          message: `No se pudo registrar el producto "${item.desc}" (estado: ${r.status}, error: ${r.error}).`
        }
      }
    }

    const codigoFiscal = venta.method?.codigoFiscal
    if (!codigoFiscal) {
      return { ok: false, message: 'El método de pago de la venta no tiene código fiscal configurado.' }
    }
    const totalizacion = send(`1${codigoFiscal}`)
    if (!totalizacion.okCmd) {
      return {
        ok: false,
        message: `No se pudo totalizar la factura fiscal (estado: ${totalizacion.status}, error: ${totalizacion.error}).`
      }
    }

    return { ok: true, message: 'Factura fiscal impresa.' }
  })
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

app.whenReady().then(async () => {
  app.setAppUserModelId('com.afivas.ventas')

  const knex = getDb()
  await migrateAndSeed(knex)
  registerDbHandlers(knex)

  ipcMain.handle('ports:scan', scanComPorts)
  ipcMain.handle('tfhka:test', (_event, comPort) => testTfhka(comPort))
  ipcMain.handle('tfhka:printReporteX', (_event, comPort) => printReporteX(comPort))
  ipcMain.handle('tfhka:printReporteZ', (_event, comPort) => printReporteZ(comPort))
  ipcMain.handle('tfhka:printFactura', (_event, comPort, venta) => printFacturaFiscal(comPort, venta))

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
