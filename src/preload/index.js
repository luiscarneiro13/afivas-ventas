import { contextBridge, ipcRenderer } from 'electron'

// API expuesta al renderer.
const api = {
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  },
  scanComPorts: () => ipcRenderer.invoke('ports:scan'),
  testTfhka: (comPort) => ipcRenderer.invoke('tfhka:test', comPort),
  printReporteX: (comPort) => ipcRenderer.invoke('tfhka:printReporteX', comPort),
  printReporteZ: (comPort) => ipcRenderer.invoke('tfhka:printReporteZ', comPort),
  printFacturaFiscal: (comPort, venta) => ipcRenderer.invoke('tfhka:printFactura', comPort, venta),

  // Productos
  productosList: () => ipcRenderer.invoke('productos:list'),
  productosSearch: (term) => ipcRenderer.invoke('productos:search', term),
  productosCreate: (payload) => ipcRenderer.invoke('productos:create', payload),
  productosUpdate: (codigo, payload) => ipcRenderer.invoke('productos:update', codigo, payload),
  productosRemove: (codigo) => ipcRenderer.invoke('productos:remove', codigo),

  // Categorías
  categoriasList: () => ipcRenderer.invoke('categorias:list'),
  categoriasCreate: (payload) => ipcRenderer.invoke('categorias:create', payload),
  categoriasUpdate: (id, payload) => ipcRenderer.invoke('categorias:update', id, payload),
  categoriasRemove: (id) => ipcRenderer.invoke('categorias:remove', id),

  // Proveedores
  proveedoresList: () => ipcRenderer.invoke('proveedores:list'),
  proveedoresCreate: (payload) => ipcRenderer.invoke('proveedores:create', payload),
  proveedoresUpdate: (id, payload) => ipcRenderer.invoke('proveedores:update', id, payload),
  proveedoresRemove: (id) => ipcRenderer.invoke('proveedores:remove', id),

  // Clientes
  clientesList: () => ipcRenderer.invoke('clientes:list'),
  clientesSearch: (term) => ipcRenderer.invoke('clientes:search', term),
  clientesFindByCedula: (cedula) => ipcRenderer.invoke('clientes:findByCedula', cedula),
  clientesCreate: (payload) => ipcRenderer.invoke('clientes:create', payload),
  clientesUpdate: (id, payload) => ipcRenderer.invoke('clientes:update', id, payload),
  clientesRemove: (id) => ipcRenderer.invoke('clientes:remove', id),

  // Métodos de pago
  metodosPagoList: () => ipcRenderer.invoke('metodosPago:list'),
  bancosList: () => ipcRenderer.invoke('bancos:list'),

  // Ventas
  ventasRegistrar: (payload) => ipcRenderer.invoke('ventas:registrar', payload),
  ventasList: (filtros) => ipcRenderer.invoke('ventas:list', filtros),
  ventasFindByNumero: (numero) => ipcRenderer.invoke('ventas:findByNumero', numero),
  ventasTopProducto: () => ipcRenderer.invoke('ventas:topProducto'),
  ventasAnular: (id) => ipcRenderer.invoke('ventas:anular', id),
  ventasMarcarImpresaFiscalmente: (id) => ipcRenderer.invoke('ventas:marcarImpresaFiscalmente', id),

  // Entradas de stock
  stockRegistrarEntrada: (payload) => ipcRenderer.invoke('stock:registrarEntrada', payload),
  stockList: () => ipcRenderer.invoke('stock:list'),

  // Caja
  cajaActual: () => ipcRenderer.invoke('caja:actual'),
  cajaAbrir: (payload) => ipcRenderer.invoke('caja:abrir', payload),
  cajaCerrar: (id, payload) => ipcRenderer.invoke('caja:cerrar', id, payload),
  cajaActualizarTasa: (id, tasa) => ipcRenderer.invoke('caja:actualizarTasa', id, tasa),
  cajaHistorial: (filtros) => ipcRenderer.invoke('caja:historial', filtros),

  // Usuarios / autenticación
  usuariosLogin: (usuario, password) => ipcRenderer.invoke('usuarios:login', usuario, password),
  usuariosList: () => ipcRenderer.invoke('usuarios:list'),
  usuariosCreate: (payload) => ipcRenderer.invoke('usuarios:create', payload),
  usuariosUpdate: (id, payload) => ipcRenderer.invoke('usuarios:update', id, payload),
  usuariosDesactivar: (id) => ipcRenderer.invoke('usuarios:desactivar', id),

  // Configuración
  configEmpresaGet: () => ipcRenderer.invoke('config:empresa:get'),
  configEmpresaUpdate: (payload) => ipcRenderer.invoke('config:empresa:update', payload),
  configImpresoraGet: () => ipcRenderer.invoke('config:impresora:get'),
  configImpresoraUpdate: (payload) => ipcRenderer.invoke('config:impresora:update', payload),

  // Integración fiscal
  fiscalReporteZRegistrar: (payload) => ipcRenderer.invoke('fiscal:reporteZ:registrar', payload),
  fiscalReporteZUltimo: () => ipcRenderer.invoke('fiscal:reporteZ:ultimo'),
  fiscalReporteZHistorial: (filtros) => ipcRenderer.invoke('fiscal:reporteZ:historial', filtros)
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
