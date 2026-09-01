import { makeProductosRepository } from './productosRepository.js'

export function makeEntradasStockRepository(knex) {
  const productos = makeProductosRepository(knex)

  return {
    list() {
      return knex('entradas_stock')
        .select(
          'entradas_stock.*',
          'productos.codigo as producto_codigo',
          'productos.descripcion as producto_descripcion',
          'usuarios.nombre_completo as usuario_nombre'
        )
        .join('productos', 'productos.id', 'entradas_stock.producto_id')
        .join('usuarios', 'usuarios.id', 'entradas_stock.usuario_id')
        .orderBy('entradas_stock.fecha', 'desc')
    },

    async registrar({ productoId, cantidad, proveedor, nota, usuarioId }) {
      return knex.transaction(async (trx) => {
        const [id] = await trx('entradas_stock').insert({
          producto_id: productoId,
          cantidad,
          proveedor: proveedor || '—',
          nota: nota ?? null,
          usuario_id: usuarioId
        })
        await productos.adjustStock(trx, productoId, cantidad)
        return trx('entradas_stock').where({ id }).first()
      })
    }
  }
}
