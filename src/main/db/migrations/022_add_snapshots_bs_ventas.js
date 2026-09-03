// Snapshots en bolívares al momento de la venta. tasa_cambio y
// porcentaje_iva ya se guardaban, pero subtotal/iva/total y el precio por
// ítem solo se guardaban en USD — reconstruir los montos en Bs después
// multiplicando por la tasa actual da un resultado distinto al que vio el
// cliente, tanto porque la tasa/IVA pueden cambiar como por el orden de
// redondeo (sumar líneas ya redondeadas a 2 decimales no es lo mismo que
// redondear la suma cruda). Se guarda el valor exacto que se mostró/cobró.
export async function up(knex) {
  await knex.schema.raw('ALTER TABLE ventas ADD COLUMN subtotal_bs NUMERIC(14,2) NULL')
  await knex.schema.raw('ALTER TABLE ventas ADD COLUMN iva_bs NUMERIC(14,2) NULL')
  await knex.schema.raw('ALTER TABLE ventas ADD COLUMN total_bs NUMERIC(14,2) NULL')
  await knex.schema.raw('ALTER TABLE venta_items ADD COLUMN precio_unitario_bs NUMERIC(14,2) NULL')
  await knex.schema.raw('ALTER TABLE venta_items ADD COLUMN subtotal_linea_bs NUMERIC(14,2) NULL')
}

export async function down(knex) {
  await knex.schema.raw('ALTER TABLE ventas DROP COLUMN subtotal_bs')
  await knex.schema.raw('ALTER TABLE ventas DROP COLUMN iva_bs')
  await knex.schema.raw('ALTER TABLE ventas DROP COLUMN total_bs')
  await knex.schema.raw('ALTER TABLE venta_items DROP COLUMN precio_unitario_bs')
  await knex.schema.raw('ALTER TABLE venta_items DROP COLUMN subtotal_linea_bs')
}
