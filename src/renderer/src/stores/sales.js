import { defineStore } from 'pinia'
import { useCatalogStore } from './catalog'
import { useMetodosPagoStore } from './metodosPago'

// Adapta una fila de `ventas` (columnas SQL en snake_case, con snapshots)
// a la forma que ya esperan VentaView/FacturaModal/ReportesView:
// cliente.nombre/cedula, cajero (string), method.label/cash, items[].codigo/desc/precio/cantidad.
function mapVenta(venta, items) {
  const metodosPago = useMetodosPagoStore()
  const metodo = metodosPago.items.find((m) => m.id === venta.metodo_pago_id)
  return {
    id: venta.id,
    numero: venta.numero,
    estado: venta.estado,
    fecha: new Date(venta.fecha),
    cliente: {
      nombre: venta.cliente_nombre_snapshot,
      cedula: venta.cliente_cedula_snapshot,
      tipoDocumento: venta.cliente_tipo_documento_snapshot,
      direccion: venta.cliente_direccion,
      telefono: venta.cliente_telefono
    },
    cajero: venta.cajero_nombre,
    itemsCount: items ? items.reduce((a, i) => a + i.cantidad, 0) : Number(venta.items_count) || 0,
    items: (items || []).map((i) => ({
      codigo: i.codigo_snapshot,
      desc: i.descripcion_snapshot,
      precio: Number(i.precio_unitario_snapshot),
      cantidad: i.cantidad
    })),
    subtotal: Number(venta.subtotal),
    porcentajeIva: Number(venta.porcentaje_iva),
    iva: Number(venta.iva),
    total: Number(venta.total),
    recibido: Number(venta.recibido),
    vuelto: Number(venta.vuelto),
    tasaCambio: Number(venta.tasa_cambio),
    numeroFacturaFiscal: venta.numero_factura_fiscal,
    impresaFiscalmente: !!venta.impresa_fiscalmente,
    method: metodo || {
      id: venta.metodo_pago_id,
      label: venta.metodo_pago_etiqueta,
      cash: false,
      codigoFiscal: venta.metodo_pago_codigo_fiscal
    }
  }
}

export const useSalesStore = defineStore('sales', {
  state: () => ({
    sales: [],
    loading: false
  }),
  actions: {
    async fetchAll() {
      this.loading = true
      try {
        const rows = (await window.api?.ventasList?.()) || []
        this.sales = rows.map((row) => mapVenta(row, null))
      } finally {
        this.loading = false
      }
    },
    // Trae el detalle completo (con items) de una venta ya registrada, para
    // mostrar la factura — tanto recién cobrada como desde el historial.
    async fetchDetalle(numero) {
      const venta = await window.api.ventasFindByNumero(numero)
      if (!venta) return null
      return mapVenta(venta, venta.items)
    },
    // Restaura el stock de cada línea y marca la venta como anulada.
    async anular(id) {
      await window.api.ventasAnular(id)
      const catalog = useCatalogStore()
      await catalog.fetchAll()
      await this.fetchAll()
    },
    /**
     * Registra una venta real en la BD a partir del carrito, descuenta
     * existencias en el backend (dentro de una transacción) y devuelve la
     * factura ya lista para mostrar en FacturaModal.
     */
    async registrarVenta({
      items,
      clienteId,
      sesionCajaId,
      usuarioId,
      metodoPagoId,
      recibido,
      vuelto,
      referenciaPago,
      bancoId,
      tasaCambio,
      subtotal,
      iva,
      total
    }) {
      const venta = await window.api.ventasRegistrar({
        clienteId,
        sesionCajaId,
        usuarioId,
        metodoPagoId,
        items: items.map((i) => ({
          productoId: i.productoId,
          cantidad: i.cantidad,
          precioUnitario: i.precio
        })),
        subtotal,
        porcentajeIva: 16,
        iva,
        total,
        recibido,
        vuelto,
        referenciaPago,
        bancoId,
        tasaCambio
      })

      const catalog = useCatalogStore()
      await catalog.fetchAll()
      await this.fetchAll()

      return this.fetchDetalle(venta.numero)
    }
  }
})
