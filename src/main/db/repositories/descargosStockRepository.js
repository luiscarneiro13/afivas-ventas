export function makeDescargosStockRepository(knex) {
  return {
    list() {
      return knex('descargos_stock')
        .select(
          'descargos_stock.*',
          'productos.codigo as producto_codigo',
          'productos.descripcion as producto_descripcion',
          'usuarios.nombre_completo as usuario_nombre'
        )
        .join('productos', 'productos.id', 'descargos_stock.producto_id')
        .join('usuarios', 'usuarios.id', 'descargos_stock.usuario_id')
        .orderBy('descargos_stock.fecha', 'desc')
    },

    async registrar({ productoId, cantidad, motivo, nota, usuarioId }) {
      return knex.transaction(async (trx) => {
        const producto = await trx('productos').where({ id: productoId }).first()
        if (!producto) {
          throw new Error('El producto indicado no existe.')
        }
        if (producto.existencia < cantidad) {
          throw new Error(`Existencia insuficiente para ${producto.codigo}.`)
        }
        const [id] = await trx('descargos_stock').insert({
          producto_id: productoId,
          cantidad,
          motivo,
          nota: nota ?? null,
          usuario_id: usuarioId
        })
        await trx('productos').where({ id: productoId }).decrement('existencia', cantidad)
        return trx('descargos_stock').where({ id }).first()
      })
    }
  }
}
