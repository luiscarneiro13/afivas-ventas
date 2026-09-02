import { makeProductosRepository } from './productosRepository.js'

// Coincide con FACTURA_NUM_INICIAL de dummy.js: la numeración interna de
// facturas ya venía de 513 en la maqueta, se respeta ese punto de partida.
const NUMERO_FACTURA_INICIAL = 513

async function nextNumero(trx) {
  const row = await trx('ventas').max({ maxNumero: 'numero' }).first()
  return row.maxNumero ? row.maxNumero + 1 : NUMERO_FACTURA_INICIAL
}

function withRelaciones(query) {
  return query
    .select(
      'ventas.*',
      'usuarios.nombre_completo as cajero_nombre',
      'metodos_pago.etiqueta as metodo_pago_etiqueta',
      'bancos.nombre as banco_nombre'
    )
    .join('usuarios', 'usuarios.id', 'ventas.usuario_id')
    .join('metodos_pago', 'metodos_pago.id', 'ventas.metodo_pago_id')
    .leftJoin('bancos', 'bancos.id', 'ventas.banco_id')
}

export function makeVentasRepository(knex) {
  const productos = makeProductosRepository(knex)

  return {
    async registrar({
      clienteId,
      sesionCajaId,
      usuarioId,
      metodoPagoId,
      items,
      subtotal,
      porcentajeIva,
      iva,
      total,
      recibido,
      vuelto,
      referenciaPago,
      bancoId,
      tasaCambio
    }) {
      return knex.transaction(async (trx) => {
        const sesion = await trx('sesiones_caja').where({ id: sesionCajaId, estado: 'abierta' }).first()
        if (!sesion) {
          throw new Error('La sesión de caja indicada no está abierta.')
        }

        const cliente = await trx('clientes').where({ id: clienteId }).first()
        if (!cliente) {
          throw new Error('Cliente no encontrado.')
        }

        const numero = await nextNumero(trx)

        const [ventaId] = await trx('ventas').insert({
          numero,
          cliente_id: clienteId,
          cliente_cedula_snapshot: cliente.cedula,
          cliente_nombre_snapshot: cliente.nombre,
          cliente_tipo_documento_snapshot: cliente.tipo_documento,
          sesion_caja_id: sesionCajaId,
          usuario_id: usuarioId,
          metodo_pago_id: metodoPagoId,
          subtotal,
          porcentaje_iva: porcentajeIva,
          iva,
          total,
          recibido,
          vuelto,
          referencia_pago: referenciaPago ?? null,
          banco_id: bancoId ?? null,
          tasa_cambio: tasaCambio
        })

        for (const item of items) {
          const producto = await trx('productos').where({ id: item.productoId }).first()
          if (!producto) {
            throw new Error(`Producto ${item.productoId} no encontrado.`)
          }
          if (producto.existencia < item.cantidad) {
            throw new Error(`Existencia insuficiente para ${producto.codigo}.`)
          }

          await trx('venta_items').insert({
            venta_id: ventaId,
            producto_id: item.productoId,
            codigo_snapshot: producto.codigo,
            descripcion_snapshot: producto.descripcion,
            precio_unitario_snapshot: item.precioUnitario,
            cantidad: item.cantidad,
            subtotal_linea: item.precioUnitario * item.cantidad
          })
          await productos.adjustStock(trx, item.productoId, -item.cantidad)
        }

        return withRelaciones(trx('ventas')).where('ventas.id', ventaId).first()
      })
    },

    list({ desde, hasta, usuarioId, sesionCajaId } = {}) {
      // Subquery de cantidad de items en vez de traer venta_items completos:
      // list() se usa para tablas/resúmenes, no para el detalle de factura
      // (eso lo resuelve findByNumero).
      let query = withRelaciones(knex('ventas'))
        .select(
          knex('venta_items')
            .where('venta_items.venta_id', knex.raw('ventas.id'))
            .sum({ total: 'cantidad' })
            .as('items_count')
        )
        .orderBy('ventas.fecha', 'desc')
      if (desde) query = query.andWhere('ventas.fecha', '>=', desde)
      if (hasta) query = query.andWhere('ventas.fecha', '<=', hasta)
      if (usuarioId) query = query.andWhere('ventas.usuario_id', usuarioId)
      if (sesionCajaId) query = query.andWhere('ventas.sesion_caja_id', sesionCajaId)
      return query
    },

    async findByNumero(numero) {
      const venta = await withRelaciones(knex('ventas')).where('ventas.numero', numero).first()
      if (!venta) return null
      const items = await knex('venta_items').where({ venta_id: venta.id })
      return { ...venta, items }
    },

    // Agregado en SQL en vez de traer todos los venta_items al renderer:
    // evita cargar el historial completo solo para calcular un dato.
    async topProducto() {
      const row = await knex('venta_items')
        .join('ventas', 'ventas.id', 'venta_items.venta_id')
        .where('ventas.estado', 'completada')
        .groupBy('venta_items.codigo_snapshot', 'venta_items.descripcion_snapshot')
        .select(
          'venta_items.codigo_snapshot as codigo',
          'venta_items.descripcion_snapshot as descripcion'
        )
        .sum({ cantidad: 'venta_items.cantidad' })
        .orderBy('cantidad', 'desc')
        .first()
      return row || null
    },

    // Anular una venta restaura el stock de cada línea y marca la venta
    // como 'anulada'. No borra el registro: queda como historial/auditoría.
    async anular(id) {
      return knex.transaction(async (trx) => {
        const venta = await trx('ventas').where({ id }).first()
        if (!venta) {
          throw new Error('Venta no encontrada.')
        }
        if (venta.estado === 'anulada') {
          throw new Error('Esta venta ya está anulada.')
        }

        const items = await trx('venta_items').where({ venta_id: id })
        for (const item of items) {
          await productos.adjustStock(trx, item.producto_id, item.cantidad)
        }

        await trx('ventas').where({ id }).update({ estado: 'anulada' })
        return withRelaciones(trx('ventas')).where('ventas.id', id).first()
      })
    },

    marcarImpresaFiscalmente(id, { numeroFacturaFiscal }) {
      return knex('ventas').where({ id }).update({
        numero_factura_fiscal: numeroFacturaFiscal,
        impresa_fiscalmente: 1,
        fecha_impresion_fiscal: knex.fn.now()
      })
    }
  }
}
