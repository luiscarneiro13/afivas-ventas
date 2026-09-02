import { ipcMain } from 'electron'
import { makeRepositories } from '../db/repositories/index.js'

// Registra los canales IPC de acceso a datos. Sigue el mismo patrón que
// 'ports:scan'/'tfhka:*' en src/main/index.js: un ipcMain.handle por
// canal, agrupados aquí por prolijidad ya que son muchos.
export function registerDbHandlers(knex) {
  const repos = makeRepositories(knex)

  // Productos
  ipcMain.handle('productos:list', () => repos.productos.list())
  ipcMain.handle('productos:search', (_e, term) => repos.productos.search(term))
  ipcMain.handle('productos:create', (_e, payload) => repos.productos.create(payload))
  ipcMain.handle('productos:update', (_e, codigo, payload) => repos.productos.update(codigo, payload))
  ipcMain.handle('productos:remove', (_e, codigo) => repos.productos.remove(codigo))

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
  ipcMain.handle('ventas:marcarImpresaFiscalmente', (_e, id, payload) =>
    repos.ventas.marcarImpresaFiscalmente(id, payload)
  )

  // Entradas de stock
  ipcMain.handle('stock:registrarEntrada', (_e, payload) => repos.entradasStock.registrar(payload))
  ipcMain.handle('stock:list', () => repos.entradasStock.list())

  // Caja
  ipcMain.handle('caja:actual', () => repos.sesionesCaja.actual())
  ipcMain.handle('caja:abrir', (_e, payload) => repos.sesionesCaja.abrir(payload))
  ipcMain.handle('caja:cerrar', (_e, id, payload) => repos.sesionesCaja.cerrar(id, payload))

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

  // Integración fiscal (registro de cierres Z; el protocolo TFHKA en sí
  // vive en src/main/index.js y aún no llama a estos canales)
  ipcMain.handle('fiscal:reporteZ:registrar', (_e, payload) => repos.cierresFiscales.registrar(payload))
  ipcMain.handle('fiscal:reporteZ:ultimo', () => repos.cierresFiscales.ultimo())
}
