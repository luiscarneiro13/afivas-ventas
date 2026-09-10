// Costo (con IVA incluido) que se pagó por la mercancía en esta entrada.
// Es opcional: permite comparar contra precio_con_iva del producto para ver
// margen, sin obligar a cargarlo en cada entrada.
export async function up(knex) {
  await knex.schema.raw(`
    ALTER TABLE entradas_stock
    ADD COLUMN costo_con_iva NUMERIC(12,2) NULL CHECK (costo_con_iva IS NULL OR costo_con_iva >= 0)
  `)
}

export async function down(knex) {
  await knex.schema.raw('ALTER TABLE entradas_stock DROP COLUMN costo_con_iva')
}
