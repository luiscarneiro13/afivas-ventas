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
    // El sistema ya no calcula IVA: el precio cargado en el producto es el
    // precio final de venta. Los montos en bolívares se derivan de ese
    // precio ($) por la tasa vigente del día.
    itemsConBs() {
      const caja = useCajaStore()
      return this.items.map((x) => {
        // El precio en Bs sale de redondear el precio unitario (una sola vez).
        // El subtotal de la línea se redondea aparte para que coincida con lo
        // que se guarda en `venta_items.subtotal_linea_bs` y con lo que se
        // cobra en Bs.
        const precioBs = round2(x.precio * caja.tasa)
        return {
          ...x,
          precioBs,
          subtotalLineaBs: round2(precioBs * x.cantidad)
        }
      })
    },
    subtotalBs() {
      return round2(this.itemsConBs.reduce((a, x) => a + x.subtotalLineaBs, 0))
    },
    // Sin IVA el total es igual al subtotal.
    totalBs() {
      return this.subtotalBs
    },
    // Bs es la moneda de cobro; los montos en dólares (que son la base que
    // se guarda en la BD) se derivan de ellos con la tasa vigente para que
    // no se despeguen del total cobrado.
    subtotal() {
      const caja = useCajaStore()
      return round2(this.subtotalBs / (caja.tasa || 1))
    },
    total() {
      const caja = useCajaStore()
      return round2(this.totalBs / (caja.tasa || 1))
    },
    // Compatibilidad con las columnas de la tabla `ventas` (siempre 0 ahora).
    ivaBs() {
      return 0
    },
    iva() {
      return 0
    }
  },
  actions: {
    // El producto se identifica por su `id` y no por su código: el código
    // puede estar repetido (migración 027) y dos productos distintos pueden
    // compartirlo.
    addProduct(productoId) {
      const catalog = useCatalogStore()
      const ui = useUiStore()
      const p = catalog.findById(productoId)
      if (!p) {
        ui.toast('Producto no encontrado', 'error')
        return
      }
      if (p.existencia <= 0) {
        ui.toast('Producto agotado', 'error')
        return
      }
      const item = this.items.find((x) => x.productoId === p.id)
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
    setQty(productoId, valor) {
      const catalog = useCatalogStore()
      const item = this.items.find((x) => x.productoId === productoId)
      const p = catalog.findById(productoId)
      if (!item) return
      const qty = Math.floor(Number(valor))
      if (!qty || qty <= 0) {
        this.removeProduct(productoId)
        return
      }
      item.cantidad = p ? Math.min(qty, p.existencia) : qty
    },
    removeProduct(productoId) {
      this.items = this.items.filter((x) => x.productoId !== productoId)
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
