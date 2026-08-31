// ---------- DATA DUMMY ----------
// Datos de ejemplo para trabajar la interfaz sin backend todavía.

export const CATEGORIES = {
  Accesorios: { icon: 'phone', color: '#5d3fd3' },
  Bazar: { icon: 'gift', color: '#f59e0b' },
  Juegos: { icon: 'layers', color: '#e11d48' },
  Papelería: { icon: 'edit', color: '#10b981' },
  'Cuidado Personal': { icon: 'droplet', color: '#0ea5e9' },
  Decoración: { icon: 'image', color: '#8b5cf6' },
  Bisutería: { icon: 'circle', color: '#db2777' }
}

export const PRODUCTS_SEED = [
  { codigo: 'AA0001', desc: 'Protector celular contra agua', cat: 'Accesorios', existencia: 15, precio: 8.5 },
  { codigo: 'AA0002', desc: 'Soporte celular para silla', cat: 'Accesorios', existencia: 22, precio: 5.0 },
  { codigo: 'AA0003', desc: 'Popsockets diseño surtido', cat: 'Accesorios', existencia: 3, precio: 4.25 },
  { codigo: 'AA0004', desc: 'Cajita de curitas Sanrio', cat: 'Bazar', existencia: 40, precio: 2.1 },
  { codigo: 'AA0005', desc: 'Cartas de UNO', cat: 'Juegos', existencia: 2, precio: 4.75 },
  { codigo: 'AA0006', desc: 'Sellos escolares surtidos', cat: 'Bazar', existencia: 30, precio: 1.5 },
  { codigo: 'AA0007', desc: 'Correctores sencillos', cat: 'Papelería', existencia: 18, precio: 1.2 },
  { codigo: 'AA0008', desc: 'Correctores forma de muñecos', cat: 'Papelería', existencia: 12, precio: 1.8 },
  { codigo: 'AA0009', desc: 'Cera para cabello', cat: 'Cuidado Personal', existencia: 9, precio: 6.0 },
  { codigo: 'AC0001', desc: 'Aceites esenciales relajantes', cat: 'Cuidado Personal', existencia: 14, precio: 7.5 },
  { codigo: 'AC0002', desc: 'Aceite para bebés Baby Finger', cat: 'Cuidado Personal', existencia: 20, precio: 5.25 },
  { codigo: 'AC0003', desc: 'Aceite para cutícula', cat: 'Cuidado Personal', existencia: 16, precio: 3.1 },
  { codigo: 'AC0004', desc: 'Aceite cosmético corporal', cat: 'Cuidado Personal', existencia: 0, precio: 4.4 },
  { codigo: 'AF0001', desc: 'Afiches anime surtidos', cat: 'Decoración', existencia: 25, precio: 2.75 },
  { codigo: 'AF0002', desc: 'Stickers holográficos', cat: 'Decoración', existencia: 37, precio: 1.9 },
  { codigo: 'AN0001', desc: 'Anillos ajustables', cat: 'Bisutería', existencia: 33, precio: 3.0 },
  { codigo: 'AN0002', desc: 'Anillos sencillos', cat: 'Bisutería', existencia: 5, precio: 2.5 },
  { codigo: 'AN0003', desc: 'Anillos de lujo bañados en oro', cat: 'Bisutería', existencia: 3, precio: 9.9 },
  { codigo: 'AN0004', desc: 'Anillos Naruto Akatsuki', cat: 'Bisutería', existencia: 8, precio: 4.6 },
  { codigo: 'AN0005', desc: 'Anillos Genshin Impact', cat: 'Bisutería', existencia: 7, precio: 4.6 },
  { codigo: 'AR0001', desc: 'Argollas largas', cat: 'Bisutería', existencia: 19, precio: 3.4 },
  { codigo: 'AR0002', desc: 'Argollas con piedras', cat: 'Bisutería', existencia: 2, precio: 5.8 },
  { codigo: 'AR0003', desc: 'Argollas clásicas', cat: 'Bisutería', existencia: 28, precio: 2.9 },
  { codigo: 'AA0010', desc: 'Llavero acrílico personalizado', cat: 'Bazar', existencia: 1, precio: 3.5 }
]

export const CLIENTS_SEED = [
  { cedula: '31179420', nombre: 'Mariana Carneiro', telefono: '0414-1234567' },
  { cedula: '27845213', nombre: 'José Rodríguez', telefono: '0424-9876543' },
  { cedula: '19563287', nombre: 'Ana Silva', telefono: '0412-5551234' },
  { cedula: '25102938', nombre: 'Carlos Peña', telefono: '0416-4432109' },
  { cedula: '30456712', nombre: 'Valentina Gómez', telefono: '0426-7788990' }
]

export const CLIENTE_EVENTUAL = { cedula: '000', nombre: 'Cliente Eventual', telefono: '' }

export const PAY_METHODS = [
  { id: 'efectivo', label: 'Efectivo', icon: 'dollar', cash: true },
  { id: 'debito', label: 'Tarjeta débito', icon: 'card', cash: false },
  { id: 'credito', label: 'Tarjeta crédito', icon: 'card', cash: false },
  { id: 'transferencia', label: 'Transferencia', icon: 'repeat', cash: false },
  { id: 'pagomovil', label: 'Pago móvil', icon: 'phone', cash: false },
  { id: 'divisas', label: 'Divisas', icon: 'globe', cash: true }
]

export const NAV_ITEMS = [
  { id: 'venta', label: 'Venta', icon: 'cart' },
  { id: 'productos', label: 'Productos', icon: 'box' },
  { id: 'entrada', label: 'Entrada de Productos', icon: 'inbox' },
  { id: 'reportes', label: 'Reportes', icon: 'bars' }
]

function saleAt(products, numero, daysAgo, hour, minute, clienteIdx, itemsSpec, methodId, cajero) {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() - daysAgo)
  fecha.setHours(hour, minute, 0, 0)
  const items = itemsSpec.map((s) => {
    const p = products.find((x) => x.codigo === s.codigo)
    return { codigo: p.codigo, desc: p.desc, precio: p.precio, cantidad: s.cantidad }
  })
  const subtotal = items.reduce((a, i) => a + i.precio * i.cantidad, 0)
  const iva = subtotal * 0.16
  const total = subtotal + iva
  const method = PAY_METHODS.find((m) => m.id === methodId)
  return {
    numero,
    fecha,
    cliente: clienteIdx === null ? CLIENTE_EVENTUAL : CLIENTS_SEED[clienteIdx],
    items,
    subtotal,
    iva,
    total,
    method,
    recibido: total,
    vuelto: 0,
    cajero
  }
}

// Genera ventas de ejemplo de los últimos días (para poblar Reportes).
export function seedSales(products) {
  return [
    saleAt(products, 501, 6, 10, 15, 1, [{ codigo: 'AA0001', cantidad: 1 }, { codigo: 'AN0001', cantidad: 2 }], 'efectivo', 'admin'),
    saleAt(products, 502, 5, 11, 40, null, [{ codigo: 'AA0004', cantidad: 3 }], 'pagomovil', 'admin'),
    saleAt(products, 503, 5, 16, 5, 2, [{ codigo: 'AC0001', cantidad: 1 }, { codigo: 'AA0009', cantidad: 1 }], 'debito', 'admin'),
    saleAt(products, 504, 4, 9, 50, 3, [{ codigo: 'AN0003', cantidad: 1 }], 'transferencia', 'admin'),
    saleAt(products, 505, 3, 10, 30, null, [{ codigo: 'AA0005', cantidad: 1 }, { codigo: 'AF0001', cantidad: 2 }], 'efectivo', 'admin'),
    saleAt(products, 506, 3, 14, 10, 4, [{ codigo: 'AR0001', cantidad: 2 }], 'credito', 'admin'),
    saleAt(products, 507, 3, 17, 45, 1, [{ codigo: 'AA0002', cantidad: 1 }], 'pagomovil', 'admin'),
    saleAt(products, 508, 2, 12, 0, null, [{ codigo: 'AA0006', cantidad: 4 }], 'efectivo', 'admin'),
    saleAt(products, 509, 1, 10, 20, 2, [{ codigo: 'AN0004', cantidad: 1 }, { codigo: 'AN0005', cantidad: 1 }], 'debito', 'admin'),
    saleAt(products, 510, 1, 15, 55, null, [{ codigo: 'AA0007', cantidad: 2 }, { codigo: 'AA0008', cantidad: 2 }], 'efectivo', 'admin'),
    saleAt(products, 511, 0, 9, 10, 3, [{ codigo: 'AA0001', cantidad: 1 }, { codigo: 'AA0003', cantidad: 1 }], 'pagomovil', 'admin'),
    saleAt(products, 512, 0, 11, 25, null, [{ codigo: 'AC0002', cantidad: 1 }], 'efectivo', 'admin')
  ]
}

export const FACTURA_NUM_INICIAL = 513

export function seedStockEntries() {
  const d1 = new Date()
  d1.setDate(d1.getDate() - 4)
  const d2 = new Date()
  d2.setDate(d2.getDate() - 2)
  return [
    { fecha: d1, codigo: 'AA0004', desc: 'Cajita de curitas Sanrio', cantidad: 20, proveedor: 'Distribuidora Central', usuario: 'admin' },
    { fecha: d2, codigo: 'AN0001', desc: 'Anillos ajustables', cantidad: 15, proveedor: 'Bisutería La Perla', usuario: 'admin' }
  ]
}
