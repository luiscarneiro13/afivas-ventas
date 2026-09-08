// Snapshot en bolívares del precio SIN IVA de cada línea, al momento de la
// venta. Es lo que se le manda a la impresora fiscal (ella calcula el IVA
// según su propia tasa programada) — precio_unitario_bs pasó a guardar el
// precio CON IVA (el que ve/paga el cliente), así que ya no sirve para eso.
export async function up(knex) {
  await knex.schema.raw('ALTER TABLE venta_items ADD COLUMN precio_unitario_sin_iva_bs NUMERIC(14,2) NULL')
}

export async function down(knex) {
  await knex.schema.raw('ALTER TABLE venta_items DROP COLUMN precio_unitario_sin_iva_bs')
}
