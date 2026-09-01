export async function up(knex) {
  await knex.schema.raw(`
    CREATE TABLE venta_items (
      id                          INTEGER PRIMARY KEY AUTOINCREMENT,
      venta_id                    INTEGER NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
      producto_id                 INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
      codigo_snapshot              TEXT NOT NULL,
      descripcion_snapshot         TEXT NOT NULL,
      precio_unitario_snapshot     NUMERIC(12,2) NOT NULL,
      cantidad                     INTEGER NOT NULL CHECK (cantidad > 0),
      subtotal_linea               NUMERIC(12,2) NOT NULL,
      created_at                   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await knex.schema.raw('CREATE INDEX idx_venta_items_venta ON venta_items(venta_id)')
  await knex.schema.raw('CREATE INDEX idx_venta_items_producto ON venta_items(producto_id)')
}

export async function down(knex) {
  await knex.schema.raw('DROP TABLE IF EXISTS venta_items')
}
