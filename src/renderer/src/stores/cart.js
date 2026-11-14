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
    // Base fiscal de cada línea (montos SIN IVA). Es exactamente lo que
    // recibe la impresora fiscal, así que es la fuente de verdad de todo el
    // cálculo:
    //
    //   precioSinIva ($) × tasa      → precioSinIvaBs        (unitario Bs)
    //   precioSinIvaBs   × cantidad  → subtotalLineaSinIvaBs (línea Bs)
    //
    // Los montos CON IVA (precioBs/subtotalLineaBs, los que ve el cliente
    // en la grilla) se derivan de aquí, no de x.precio en dólares: ese
    // precio está redondeado a 2 decimales en USD y, multiplicado por la
    // tasa, produce bolívares de diferencia contra el ticket.
    lineasBase() {
      const caja = useCajaStore()
      return this.items.map((x) => {
        const precioSinIvaBs = round2(x.precioSinIva * caja.tasa)
        return {
          ...x,
          precioSinIvaBs,
          subtotalLineaSinIvaBs: round2(precioSinIvaBs * x.cantidad)
        }
      })
    },
    itemsConBs() {
      const configEmpresa = useConfigEmpresaStore()
      const factorIva = 1 + configEmpresa.porcentajeIva / 100
      const lineas = this.lineasBase.map((x) => ({
        ...x,
        precioBs: round2(x.precioSinIvaBs * factorIva),
        // El monto de la línea con IVA NO es precioBs × cantidad: se aplica
        // el IVA sobre la base de la línea, igual que el ticket fiscal. Si
        // se multiplicara el unitario ya redondeado con IVA, 2 × 2.054,85
        // daría 4.109,70 mientras el ticket imprime 4.109,69 (BI 3.542,84
        // + IVA 566,85). Ese céntimo es el que hacía que la grilla no
        // cuadrara con el total a cobrar.
        subtotalLineaBs: round2(x.subtotalLineaSinIvaBs * factorIva)
      }))
      // El redondeo línea a línea puede dejar la suma de la grilla a algún
      // céntimo del total real (BI total × (1 + IVA)), que es lo que cobra
      // el ticket. El residuo se ajusta en la última línea para que la
      // columna "Subtotal (Bs)" sume exactamente cart.totalBs.
      const sumaLíneas = round2(lineas.reduce((a, x) => a + x.subtotalLineaBs, 0))
      const residuo = round2(this.totalBs - sumaLíneas)
      if (residuo !== 0 && lineas.length > 0) {
        const ultima = lineas[lineas.length - 1]
        ultima.subtotalLineaBs = round2(ultima.subtotalLineaBs + residuo)
      }
      return lineas
    },
    // Los totales en Bs se arman igual que en el ticket fiscal, hacia
    // adelante y no hacia atrás desde el total: la base imponible es la
    // SUMA de las líneas SIN IVA (las mismas que se ven en la vista previa
    // y que recibe la impresora), el IVA es el porcentaje sobre esa base y
    // el total es la suma de ambos. Así lo que se cobra cuadra al céntimo
    // con la factura fiscal.
    subtotalBs() {
      return round2(this.lineasBase.reduce((a, x) => a + x.subtotalLineaSinIvaBs, 0))
    },
    ivaBs() {
      const configEmpresa = useConfigEmpresaStore()
      return round2((this.subtotalBs * configEmpresa.porcentajeIva) / 100)
    },
    totalBs() {
      return round2(this.subtotalBs + this.ivaBs)
    },
    // Bs es la moneda de cobro y de la factura; los montos en dólares (que
    // son la base que se guarda en la BD) se derivan de ellos con la tasa
    // vigente para que no se despeguen del total cobrado.
    subtotal() {
      const caja = useCajaStore()
      return round2(this.subtotalBs / (caja.tasa || 1))
    },
    total() {
      const caja = useCajaStore()
      return round2(this.totalBs / (caja.tasa || 1))
    },
    iva() {
      return round2(this.total - this.subtotal)
    },
    // Vista previa de datos fiscales para el resumen de venta: reproduce
    // línea por línea lo que va a imprimir la máquina.
    fiscalPreview() {
      const configEmpresa = useConfigEmpresaStore()
      return {
        items: this.itemsConBs.map((x) => ({
          codigo: x.codigo,
          desc: x.desc,
          cantidad: x.cantidad,
          precioSinIvaBs: x.precioSinIvaBs,
          subtotalLineaSinIvaBs: x.subtotalLineaSinIvaBs
        })),
        subtotalSinIvaBs: this.subtotalBs,
        ivaBs: this.ivaBs,
        totalBs: this.totalBs,
        porcentajeIva: configEmpresa.porcentajeIva
      }
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
