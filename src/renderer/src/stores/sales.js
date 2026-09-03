import { defineStore } from 'pinia'
import { useCatalogStore } from './catalog'
import { useMetodosPagoStore } from './metodosPago'
import { useConfigEmpresaStore } from './configEmpresa'

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
      // El cliente tiene teléfono fijo y móvil por separado; la factura
      // muestra cualquiera de los dos que tenga cargado (la mayoría solo
      // llena el móvil).
      telefono: [venta.cliente_telefono, venta.cliente_movil].filter(Boolean).join(' / ')
    },
    cajero: venta.cajero_nombre,
    itemsCount: items ? items.reduce((a, i) => a + i.cantidad, 0) : Number(venta.items_count) || 0,
    // precioBs/subtotalLineaBs: snapshot guardado al momento de la venta. Las
    // ventas registradas antes de que existieran estas columnas las tienen en
    // NULL — para esas se recalcula con la tasa de esa venta como respaldo.
    items: (items || []).map((i) => ({
      codigo: i.codigo_snapshot,
      desc: i.descripcion_snapshot,
      precio: Number(i.precio_unitario_snapshot),
      precioBs:
        i.precio_unitario_bs != null
          ? Number(i.precio_unitario_bs)
          : Number(i.precio_unitario_snapshot) * Number(venta.tasa_cambio),
      cantidad: i.cantidad,
      subtotalLineaBs:
        i.subtotal_linea_bs != null
          ? Number(i.subtotal_linea_bs)
          : Number(i.precio_unitario_snapshot) * i.cantidad * Number(venta.tasa_cambio)
    })),
    subtotal: Number(venta.subtotal),
    subtotalBs: venta.subtotal_bs != null ? Number(venta.subtotal_bs) : Number(venta.subtotal) * Number(venta.tasa_cambio),
    porcentajeIva: Number(venta.porcentaje_iva),
    iva: Number(venta.iva),
    ivaBs: venta.iva_bs != null ? Number(venta.iva_bs) : Number(venta.iva) * Number(venta.tasa_cambio),
    total: Number(venta.total),
    totalBs: venta.total_bs != null ? Number(venta.total_bs) : Number(venta.total) * Number(venta.tasa_cambio),
    recibido: Number(venta.recibido),
    vuelto: Number(venta.vuelto),
    tasaCambio: Number(venta.tasa_cambio),
    numeroFacturaFiscal: venta.numero_factura_fiscal,
    impresaFiscalmente: !!venta.impresa_fiscalmente,
    method: metodo
      ? { ...metodo }
      : {
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
      subtotalBs,
      iva,
      ivaBs,
      total,
      totalBs,
      numeroFacturaFiscal
    }) {
      const configEmpresa = useConfigEmpresaStore()
      const venta = await window.api.ventasRegistrar({
        clienteId,
        sesionCajaId,
        usuarioId,
        metodoPagoId,
        items: items.map((i) => ({
          productoId: i.productoId,
          cantidad: i.cantidad,
          precioUnitario: i.precio,
          precioUnitarioBs: i.precioBs,
          subtotalLineaBs: i.subtotalLineaBs
        })),
        subtotal,
        subtotalBs,
        porcentajeIva: configEmpresa.porcentajeIva,
        iva,
        ivaBs,
        total,
        totalBs,
        recibido,
        vuelto,
        referenciaPago,
        bancoId,
        tasaCambio,
        numeroFacturaFiscal
      })

      const catalog = useCatalogStore()
      await catalog.fetchAll()
      await this.fetchAll()

      return this.fetchDetalle(venta.numero)
    }
  }
})
