function withCategoria(query) {
  return query
    .select('productos.*', 'categorias.nombre as categoria_nombre')
    .leftJoin('categorias', 'categorias.id', 'productos.categoria_id')
}

// El precio que carga el usuario (en el formulario y acá) es el precio CON
// IVA — precio sin IVA se deriva de ese valor con el % de IVA vigente en
// config_empresa, en el momento exacto de guardar. Se recalcula siempre acá
// (autoridad única) en vez de confiar en un valor ya calculado que mande el
// front, para no desincronizarse si el % de IVA cambió entretanto.
async function calcularPrecioSinIva(knex, precioConIva) {
  const config = await knex('config_empresa').where({ id: 1 }).first()
  const porcentajeIva = config ? Number(config.porcentaje_iva) : 16
  return Math.round((Number(precioConIva) / (1 + porcentajeIva / 100)) * 100) / 100
}

// Blindaje: el front ya manda precioConIva con exactamente 2 decimales (ver
// la máscara de dígitos en ProductoModal.vue), pero se redondea igual acá
// para no depender de eso como única garantía.
function round2(n) {
  return Math.round(Number(n) * 100) / 100
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

    async create({ codigo, descripcion, categoriaId, precioConIva, existencia, stockMinimo }) {
      const precio = await calcularPrecioSinIva(knex, precioConIva)
      const [id] = await knex('productos').insert({
        codigo,
        descripcion,
        categoria_id: categoriaId,
        precio,
        precio_con_iva: round2(precioConIva),
        existencia: existencia ?? 0,
        stock_minimo: stockMinimo ?? 3
      })
      return withCategoria(knex('productos')).where('productos.id', id).first()
    },

    async update(codigo, { descripcion, categoriaId, precioConIva, existencia, stockMinimo }) {
      const precio = await calcularPrecioSinIva(knex, precioConIva)
      await knex('productos')
        .where({ codigo })
        .update({
          descripcion,
          categoria_id: categoriaId,
          precio,
          precio_con_iva: round2(precioConIva),
          existencia: existencia ?? 0,
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
    },

    // Actualiza solo el precio (recalculando precio sin IVA), sin tocar el
    // resto de los campos del producto. Usado por entradasStockRepository
    // cuando el usuario elige actualizar el precio de venta al cargar
    // inventario. Debe llamarse dentro de una transacción.
    async updatePrecioConIva(trx, productoId, precioConIva) {
      const precio = await calcularPrecioSinIva(trx, precioConIva)
      return trx('productos').where({ id: productoId }).update({
        precio,
        precio_con_iva: round2(precioConIva),
        updated_at: trx.fn.now()
      })
    }
  }
}
