import { ipcMain, BrowserWindow } from 'electron'
import { makeRepositories } from '../db/repositories/index.js'

function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Genera el PDF de un reporte tabular: renderiza una página HTML en una
// ventana oculta y la convierte con webContents.printToPDF, así no hace
// falta ninguna librería de PDF (la app debe seguir compilando offline
// para Windows 32-bit). Devuelve el buffer crudo; el renderer lo guarda
// como blob, igual que hace la exportación a Excel.
async function generarReportePdf(empresa, { titulo, subtitulo, resumen, headers, rows }) {
  const generado = new Date().toLocaleString('es-VE')
  const bloqueResumen = resumen?.length
    ? `<table class="resumen"><tbody>${resumen
        .map((r) => `<tr><td>${escHtml(r.label)}</td><td class="valor">${escHtml(r.valor)}</td></tr>`)
        .join('')}</tbody></table>`
    : ''
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    @page { size: A4; margin: 14mm; }
    body { font-family: Arial, Helvetica, sans-serif; color: #1c1c28; font-size: 11px; }
    .empresa { font-size: 15px; font-weight: 700; }
    .empresa-sub { color: #555; margin-top: 2px; }
    h1 { font-size: 13px; margin: 14px 0 4px; text-transform: uppercase; letter-spacing: .04em; }
    .subtitulo { color: #555; font-size: 10px; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #5d3fd3; color: #fff; text-align: left; padding: 6px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: .03em; }
    td { padding: 5px 8px; border-bottom: 1px solid #e2e2ea; vertical-align: top; }
    tr:nth-child(even) td { background: #f7f6fb; }
    table.resumen { margin-bottom: 14px; }
    table.resumen td:first-child { width: 55%; font-weight: 700; }
    table.resumen td.valor { text-align: right; font-family: 'Courier New', monospace; }
    table.resumen tr:nth-child(even) td { background: #f7f6fb; }
    .detalle-titulo { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .03em; margin: 6px 0 6px; }
    .footer { margin-top: 12px; color: #888; font-size: 9.5px; }
  </style></head><body>
    <div class="empresa">${escHtml(empresa?.razon_social || '')}</div>
    <div class="empresa-sub">${[empresa?.rif, empresa?.direccion, empresa?.telefono].filter(Boolean).map(escHtml).join(' · ')}</div>
    <h1>${escHtml(titulo)}</h1>
    ${subtitulo ? `<div class="subtitulo">${escHtml(subtitulo)}</div>` : ''}
    ${bloqueResumen}
    ${resumen?.length ? '<div class="detalle-titulo">Detalle</div>' : ''}
    <table><thead><tr>${headers.map((h) => `<th>${escHtml(h)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${escHtml(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>
    <div class="footer">Generado por Afivas Ventas · ${escHtml(generado)}</div>
  </body></html>`

  const win = new BrowserWindow({ show: false, webPreferences: { sandbox: true } })
  try {
    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
    return await win.webContents.printToPDF({ printBackground: true, pageSize: 'A4' })
  } finally {
    win.destroy()
  }
}

// Registra los canales IPC de acceso a datos. Sigue el mismo patrón que
// 'ports:scan'/'tfhka:*' en src/main/index.js: un ipcMain.handle por
// canal, agrupados aquí por prolijidad ya que son muchos.
export function registerDbHandlers(knex) {
  const repos = makeRepositories(knex)

  // Productos
  ipcMain.handle('productos:list', () => repos.productos.list())
  ipcMain.handle('productos:search', (_e, term) => repos.productos.search(term))
  ipcMain.handle('productos:create', (_e, payload) => repos.productos.create(payload))
  // El código de producto puede estar repetido (migración 027), así que las
  // operaciones que tocan un producto puntual se hacen por `id`.
  ipcMain.handle('productos:update', (_e, id, payload) => repos.productos.update(id, payload))
  ipcMain.handle('productos:remove', (_e, id) => repos.productos.remove(id))

  // Operaciones de mantenimiento (destructivas): exigen la contraseña del
  // usuario que las ejecuta. Se devuelve { ok, message } en vez de lanzar, para
  // que el renderer reciba el mensaje limpio (sin el prefijo que Electron
  // agrega a los errores de IPC).
  ipcMain.handle('operaciones:vaciarProductosYVentas', async (_e, payload) => {
    try {
      const { usuarioId, password } = payload || {}
      const passwordOk = await repos.usuarios.verificarPassword(usuarioId, password)
      if (!passwordOk) {
        return { ok: false, message: 'Contraseña incorrecta' }
      }
      const resultado = await repos.operaciones.vaciarProductosYVentas()
      return { ok: true, ...resultado }
    } catch (e) {
      return { ok: false, message: e?.message || 'No se pudo vaciar la base de datos' }
    }
  })

  // Categorías
  ipcMain.handle('categorias:list', () => repos.categorias.list())
  ipcMain.handle('categorias:create', (_e, payload) => repos.categorias.create(payload))
  ipcMain.handle('categorias:update', (_e, id, payload) => repos.categorias.update(id, payload))
  ipcMain.handle('categorias:remove', (_e, id) => repos.categorias.remove(id))

  // Proveedores
  ipcMain.handle('proveedores:list', () => repos.proveedores.list())
  ipcMain.handle('proveedores:create', (_e, payload) => repos.proveedores.create(payload))
  ipcMain.handle('proveedores:update', (_e, id, payload) => repos.proveedores.update(id, payload))
  ipcMain.handle('proveedores:remove', (_e, id) => repos.proveedores.remove(id))

  // Clientes
  ipcMain.handle('clientes:list', () => repos.clientes.list())
  ipcMain.handle('clientes:search', (_e, term) => repos.clientes.search(term))
  ipcMain.handle('clientes:findByCedula', (_e, cedula) => repos.clientes.findByCedula(cedula))
  ipcMain.handle('clientes:create', (_e, payload) => repos.clientes.create(payload))
  ipcMain.handle('clientes:update', (_e, id, payload) => repos.clientes.update(id, payload))
  ipcMain.handle('clientes:remove', (_e, id) => repos.clientes.remove(id))

  // Métodos de pago
  ipcMain.handle('metodosPago:list', () => repos.metodosPago.list())
  ipcMain.handle('bancos:list', () => repos.bancos.list())

  // Ventas
  ipcMain.handle('ventas:registrar', (_e, payload) => repos.ventas.registrar(payload))
  ipcMain.handle('ventas:list', (_e, filtros) => repos.ventas.list(filtros))
  ipcMain.handle('ventas:findByNumero', (_e, numero) => repos.ventas.findByNumero(numero))
  ipcMain.handle('ventas:topProducto', () => repos.ventas.topProducto())
  ipcMain.handle('ventas:anular', (_e, id) => repos.ventas.anular(id))
  // Deshabilitado: la impresión fiscal quedó comentada (ver src/main/index.js).
  // ipcMain.handle('ventas:marcarImpresaFiscalmente', (_e, id) => repos.ventas.marcarImpresaFiscalmente(id))

  // Entradas de stock
  ipcMain.handle('stock:registrarEntrada', (_e, payload) => repos.entradasStock.registrar(payload))
  ipcMain.handle('stock:list', () => repos.entradasStock.list())

  // Descargos de stock
  ipcMain.handle('descargos:registrar', (_e, payload) => repos.descargosStock.registrar(payload))
  ipcMain.handle('descargos:list', () => repos.descargosStock.list())

  // Caja
  ipcMain.handle('caja:actual', () => repos.sesionesCaja.actual())
  ipcMain.handle('caja:abrir', (_e, payload) => repos.sesionesCaja.abrir(payload))
  ipcMain.handle('caja:cerrar', (_e, id, payload) => repos.sesionesCaja.cerrar(id, payload))
  ipcMain.handle('caja:actualizarTasa', (_e, id, tasa) => repos.sesionesCaja.actualizarTasa(id, tasa))
  ipcMain.handle('caja:historial', (_e, filtros) => repos.sesionesCaja.historial(filtros))

  // Usuarios / autenticación
  ipcMain.handle('usuarios:login', (_e, usuario, password) => repos.usuarios.login(usuario, password))
  ipcMain.handle('usuarios:list', () => repos.usuarios.list())
  ipcMain.handle('usuarios:create', (_e, payload) => repos.usuarios.create(payload))
  ipcMain.handle('usuarios:update', (_e, id, payload) => repos.usuarios.update(id, payload))
  ipcMain.handle('usuarios:desactivar', (_e, id) => repos.usuarios.desactivar(id))

  // Configuración
  ipcMain.handle('config:empresa:get', () => repos.configEmpresa.get())
  ipcMain.handle('config:empresa:update', (_e, payload) => repos.configEmpresa.update(payload))
  ipcMain.handle('config:impresora:get', () => repos.configImpresora.get())
  ipcMain.handle('config:impresora:update', (_e, payload) => repos.configImpresora.update(payload))

  // Integración fiscal: histórico de cierres Z. FiscalizacionView.vue llama
  // a 'registrar' justo después de que el comando TFHKA (src/main/index.js)
  // se envía con éxito y la caja ya cerró.
  ipcMain.handle('fiscal:reporteZ:registrar', (_e, payload) => repos.cierresFiscales.registrar(payload))
  ipcMain.handle('fiscal:reporteZ:ultimo', () => repos.cierresFiscales.ultimo())
  ipcMain.handle('fiscal:reporteZ:historial', (_e, filtros) => repos.cierresFiscales.historial(filtros))

  // Reportes PDF (descargos de inventario, etc.)
  ipcMain.handle('reportes:pdf:generar', async (_e, payload) =>
    generarReportePdf(await repos.configEmpresa.get(), payload)
  )
}
