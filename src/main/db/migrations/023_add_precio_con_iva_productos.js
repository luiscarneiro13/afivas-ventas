// `productos.precio` sigue siendo el precio SIN IVA (el que ya usaba el
// sistema y el que se le manda a la impresora fiscal, que calcula el IVA
// ella misma). Esta migración agrega el precio CON IVA — el que ahora se
// vende y se muestra en Ventas/Productos — como columna aparte.
//
// Backfill: en una instalación nueva la tabla está vacía en este punto (los
// seeds corren después de las migraciones), así que el loop no hace nada y
// seedInventarioReal ya inserta precio_con_iva calculado. En una instalación
// existente, se completa acá con el % de IVA vigente de config_empresa (o
// 16 si esa fila todavía no existe).
export async function up(knex) {
  await knex.schema.raw('ALTER TABLE productos ADD COLUMN precio_con_iva NUMERIC(12,2) NOT NULL DEFAULT 0')

  const config = await knex('config_empresa').where({ id: 1 }).first()
  const porcentajeIva = config ? Number(config.porcentaje_iva) : 16
  const productos = await knex('productos').select('id', 'precio')
  for (const p of productos) {
    const precioConIva = Math.round(Number(p.precio) * (1 + porcentajeIva / 100) * 100) / 100
    await knex('productos').where({ id: p.id }).update({ precio_con_iva: precioConIva })
  }
}

export async function down(knex) {
  await knex.schema.raw('ALTER TABLE productos DROP COLUMN precio_con_iva')
}
