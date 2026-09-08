import { defineStore } from 'pinia'
import { useCatalogStore } from './catalog'
import { useCajaStore } from './caja'
import { useConfigEmpresaStore } from './configEmpresa'
import { useUiStore } from './ui'
import { round2 } from '@renderer/utils/format'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    cliente: null
  }),
  getters: {
    count: (state) => state.items.reduce((a, x) => a + x.cantidad, 0),
    // x.precio ya es el precio CON IVA (el de venta) — total es simplemente
    // la suma de cada línea. subtotal/iva se desglosan hacia atrás a partir
    // de ese total (no se suman hacia adelante): con IVA incluido en el
    // precio, el subtotal "sin IVA" es una consecuencia del total, no al
    // revés.
    total: (state) => round2(state.items.reduce((a, x) => a + x.precio * x.cantidad, 0)),
    subtotal() {
      const configEmpresa = useConfigEmpresaStore()
      return round2(this.total / (1 + configEmpresa.porcentajeIva / 100))
    },
    iva() {
      return round2(this.total - this.subtotal)
    },
    // Los productos se cargan y almacenan en dólares; los bolívares siempre
    // se calculan al vuelo con la tasa vigente, nunca se guardan como base.
    // itemsConBs agrega precioBs/subtotalLineaBs (CON IVA, cada uno ya
    // redondeado a 2 decimales — el mismo número que se ve por fila en la
    // grilla) y precioSinIvaBs (SIN IVA: es lo que se le manda a la
    // impresora fiscal, que calcula el IVA ella misma según su propia tasa
    // programada — nunca se le debe mandar un precio que ya lo incluya).
    itemsConBs() {
      const caja = useCajaStore()
      return this.items.map((x) => ({
        ...x,
        precioBs: round2(x.precio * caja.tasa),
        subtotalLineaBs: round2(x.precio * x.cantidad * caja.tasa),
        precioSinIvaBs: round2(x.precioSinIva * caja.tasa)
      }))
    },
    // totalBs es la suma de las líneas ya redondeadas (con IVA); subtotalBs/
    // ivaBs se desglosan hacia atrás a partir de él, igual que en USD.
    totalBs() {
      return round2(this.itemsConBs.reduce((a, x) => a + x.subtotalLineaBs, 0))
    },
    subtotalBs() {
      const configEmpresa = useConfigEmpresaStore()
      return round2(this.totalBs / (1 + configEmpresa.porcentajeIva / 100))
    },
    ivaBs() {
      return round2(this.totalBs - this.subtotalBs)
    }
  },
  actions: {
    addProduct(codigo) {
      const catalog = useCatalogStore()
      const ui = useUiStore()
      const p = catalog.findByCodigo(codigo)
      if (!p || p.existencia <= 0) {
        ui.toast('Producto agotado', 'error')
        return
      }
      const item = this.items.find((x) => x.codigo === codigo)
      const enCarrito = item ? item.cantidad : 0
      if (enCarrito + 1 > p.existencia) {
        ui.toast('No hay más existencia disponible', 'warning')
        return
      }
      if (item) {
        item.cantidad++
      } else {
        this.items.push({
          productoId: p.id,
          codigo: p.codigo,
          desc: p.desc,
          precio: p.precio,
          precioSinIva: p.precioSinIva,
          cantidad: 1
        })
      }
      const restante = p.existencia - (enCarrito + 1)
      const minimo = p.stockMinimo ?? 3
      if (restante <= minimo && restante > 0) {
        ui.toast(`Quedan solo ${restante} unidades de "${p.desc}"`, 'warning')
      }
      ui.toast(`"${p.desc}" agregado a la venta`, 'success', 'cart')
    },
    // Aplica una cantidad ya validada por el llamador (VentaView decide si
    // hace falta mostrar el modal de "existencia insuficiente" antes de
    // llegar aquí). Igual se hace un clamp defensivo por si acaso.
    setQty(codigo, valor) {
      const catalog = useCatalogStore()
      const item = this.items.find((x) => x.codigo === codigo)
      const p = catalog.findByCodigo(codigo)
      if (!item) return
      const qty = Math.floor(Number(valor))
      if (!qty || qty <= 0) {
        this.removeProduct(codigo)
        return
      }
      item.cantidad = p ? Math.min(qty, p.existencia) : qty
    },
    removeProduct(codigo) {
      this.items = this.items.filter((x) => x.codigo !== codigo)
    },
    setCliente(cliente) {
      this.cliente = cliente
    },
    clear() {
      this.items = []
      this.cliente = null
    }
  }
})
