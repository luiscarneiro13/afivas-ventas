import { defineStore } from 'pinia'
import { useCatalogStore } from './catalog'
import { useCajaStore } from './caja'
import { useUiStore } from './ui'
import { round2 } from '@renderer/utils/format'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    cliente: null
  }),
  getters: {
    count: (state) => state.items.reduce((a, x) => a + x.cantidad, 0),
    subtotal: (state) => round2(state.items.reduce((a, x) => a + x.precio * x.cantidad, 0)),
    iva() {
      return round2(this.subtotal * 0.16)
    },
    total() {
      return round2(this.subtotal + this.iva)
    },
    // Los productos se cargan y almacenan en dólares; los bolívares siempre
    // se calculan al vuelo con la tasa vigente, nunca se guardan como base.
    subtotalBs() {
      const caja = useCajaStore()
      return this.subtotal * caja.tasa
    },
    ivaBs() {
      const caja = useCajaStore()
      return this.iva * caja.tasa
    },
    totalBs() {
      const caja = useCajaStore()
      return this.total * caja.tasa
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
        this.items.push({ productoId: p.id, codigo: p.codigo, desc: p.desc, precio: p.precio, cantidad: 1 })
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
