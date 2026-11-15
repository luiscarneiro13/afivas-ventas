// Operaciones de mantenimiento de la base de datos.
//
// IMPORTANTE: estas operaciones son destructivas y por eso el renderer pide
// la contraseña del usuario antes de invocarlas (ver db-handlers.js).
export function makeOperacionesRepository(knex) {
  return {
    // Vacía SOLO las tablas de productos y ventas. El resto de la base de
    // datos (usuarios, categorías, clientes, proveedores, bancos, métodos de
    // pago, configuración, sesiones de caja) NO se toca.
    //
    // Las líneas de venta (`venta_items`) se borran en cascada con su venta
    // (ON DELETE CASCADE). Los movimientos de stock (`entradas_stock` y
    // `descargos_stock`) apuntan a los productos con ON DELETE RESTRICT: si
    // existieran, vaciar los productos dejaría esas referencias rotas, así
    // que se cancela la operación y se le explica al usuario.
    async vaciarProductosYVentas() {
      return knex.transaction(async (trx) => {
        const entradas = await trx('entradas_stock').count({ c: '*' }).first()
        const descargos = await trx('descargos_stock').count({ c: '*' }).first()
        const movimientos = Number(entradas.c) + Number(descargos.c)
        if (movimientos > 0) {
          throw new Error(
            `No se puede vaciar: hay ${movimientos} movimiento(s) de inventario (entradas/descargos) ` +
              'que apuntan a productos. Primero deben eliminarse esos movimientos.'
          )
        }

        const ventas = await trx('ventas').count({ c: '*' }).first()
        const productos = await trx('productos').count({ c: '*' }).first()

        // Primero las ventas (sus items caen en cascada), luego los productos.
        await trx('ventas').delete()
        await trx('productos').delete()

        // Se reinician los contadores AUTOINCREMENT de las tablas vaciadas
        // para que el catálogo que se vuelva a cargar empiece desde 1.
        await trx('sqlite_sequence')
          .whereIn('name', ['productos', 'ventas', 'venta_items'])
          .delete()

        return { ventas: Number(ventas.c), productos: Number(productos.c) }
      })
    }
  }
}
