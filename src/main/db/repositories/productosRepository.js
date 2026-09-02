function withCategoria(query) {
  return query
    .select(
      'productos.*',
      'categorias.nombre as categoria_nombre',
      'categorias.color as categoria_color'
    )
    .join('categorias', 'categorias.id', 'productos.categoria_id')
}

export function makeProductosRepository(knex) {
  return {
    list() {
      return withCategoria(knex('productos')).where('productos.activo', 1).orderBy('productos.codigo')
    },

    search(term) {
      // SQLite: LIKE es case-insensitive por defecto para ASCII, no hace
      // falta lower()/whereILike (soporte de dialecto desigual en Knex).
      const like = `%${term}%`
      return withCategoria(knex('productos'))
        .where('productos.activo', 1)
        .andWhere((qb) => {
          qb.where('productos.codigo', 'like', like).orWhere('productos.descripcion', 'like', like)
        })
        .orderBy('productos.codigo')
    },

    async create({ codigo, descripcion, categoriaId, precio, existencia, stockMinimo }) {
      const [id] = await knex('productos').insert({
        codigo,
        descripcion,
        categoria_id: categoriaId,
        precio,
        existencia: existencia ?? 0,
        stock_minimo: stockMinimo ?? 3
      })
      return withCategoria(knex('productos')).where('productos.id', id).first()
    },

    async update(codigo, { descripcion, categoriaId, precio, stockMinimo }) {
      await knex('productos')
        .where({ codigo })
        .update({
          descripcion,
          categoria_id: categoriaId,
          precio,
          stock_minimo: stockMinimo ?? 3,
          updated_at: knex.fn.now()
        })
      return withCategoria(knex('productos')).where('productos.codigo', codigo).first()
    },

    remove(codigo) {
      return knex('productos').where({ codigo }).update({ activo: 0, updated_at: knex.fn.now() })
    },

    // delta puede ser positivo (entrada de stock) o negativo (venta).
    // Debe llamarse dentro de una transacción cuando forme parte de una
    // operación mayor (ver ventasRepository.registrar / entradasStockRepository.registrar).
    adjustStock(trx, productoId, delta) {
      return trx('productos').where({ id: productoId }).increment('existencia', delta)
    }
  }
}
