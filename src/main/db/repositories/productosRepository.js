function withCategoria(query) {
  return query
    .select('productos.*', 'categorias.nombre as categoria_nombre')
    .leftJoin('categorias', 'categorias.id', 'productos.categoria_id')
}

// El sistema ya no calcula IVA: el precio que carga el usuario es el precio
// final de venta y se guarda tal cual en `productos.precio`. La columna
// heredada `precio_con_iva` se mantiene sincronizada con el mismo valor para
// no romper datos ni reportes antiguos, pero ya no se usa para calcular nada.
//
// Cálculo original (se conserva como referencia por si se reactiva el IVA):
//
// async function calcularPrecioSinIva(knex, precioConIva) {
//   const config = await knex('config_empresa').where({ id: 1 }).first()
//   const porcentajeIva = config ? Number(config.porcentaje_iva) : 16
//   return Math.round((Number(precioConIva) / (1 + porcentajeIva / 100)) * 100) / 100
// }

// Blindaje: el front ya manda el precio con exactamente 2 decimales (ver
// la máscara de dígitos en ProductoModal.vue), pero se redondea igual acá
// para no depender de eso como única garantía.
function round2(n) {
  return Math.round(Number(n) * 100) / 100
}

export function makeProductosRepository(knex) {
  return {
    list() {
      return withCategoria(knex('productos'))
        .where('productos.activo', 1)
        .orderBy('productos.codigo')
        .orderBy('productos.id')
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
      const precioFinal = round2(precio)
      const [id] = await knex('productos').insert({
        codigo,
        descripcion,
        categoria_id: categoriaId,
        precio: precioFinal,
        precio_con_iva: precioFinal,
        existencia: existencia ?? 0,
        stock_minimo: stockMinimo ?? 3
      })
      return withCategoria(knex('productos')).where('productos.id', id).first()
    },

    // A partir de la migración 027 el código de producto YA NO es único: un
    // producto borrado, un color o una talla pueden compartirlo. Por eso las
    // operaciones que modifican un producto lo hacen por `id` (nunca por
    // `codigo`, que podría afectar a varios productos a la vez).
    async update(id, { descripcion, categoriaId, precio, existencia, stockMinimo }) {
      const precioFinal = round2(precio)
      await knex('productos')
        .where({ id })
        .update({
          descripcion,
          categoria_id: categoriaId,
          precio: precioFinal,
          precio_con_iva: precioFinal,
          existencia: existencia ?? 0,
          stock_minimo: stockMinimo ?? 3,
          updated_at: knex.fn.now()
        })
      return withCategoria(knex('productos')).where('productos.id', id).first()
    },

    // Borrado lógico: se marca `activo = 0` y se le agrega el sufijo
    // "-borrado" al código. Así el código original queda libre para poder
    // reutilizarlo (por ejemplo en un producto de otro color o de otra talla)
    // y el producto sigue siendo consultable en la base de datos.
    remove(id) {
      return knex('productos')
        .where({ id })
        .update({
          activo: 0,
          codigo: knex.raw(
            "CASE WHEN codigo LIKE '%-borrado' THEN codigo ELSE codigo || '-borrado' END"
          ),
          updated_at: knex.fn.now()
        })
    },

    // delta puede ser positivo (entrada de stock) o negativo (venta).
    // Debe llamarse dentro de una transacción cuando forme parte de una
    // operación mayor (ver ventasRepository.registrar / entradasStockRepository.registrar).
    adjustStock(trx, productoId, delta) {
      return trx('productos').where({ id: productoId }).increment('existencia', delta)
    },

    // Actualiza solo el precio final de venta, sin tocar el resto de los
    // campos del producto. Usado por entradasStockRepository cuando el
    // usuario elige actualizar el precio de venta al cargar inventario.
    // Debe llamarse dentro de una transacción.
    updatePrecio(trx, productoId, precio) {
      const precioFinal = round2(precio)
      return trx('productos').where({ id: productoId }).update({
        precio: precioFinal,
        precio_con_iva: precioFinal,
        updated_at: trx.fn.now()
      })
    }
  }
}
