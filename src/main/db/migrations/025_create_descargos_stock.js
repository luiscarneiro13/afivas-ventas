export async function up(knex) {
  await knex.schema.raw(`
    CREATE TABLE descargos_stock (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      producto_id   INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
      cantidad      INTEGER NOT NULL CHECK (cantidad > 0),
      motivo        TEXT NOT NULL CHECK (motivo IN ('Producto defectuoso', 'Auto consumo')),
      nota          TEXT NULL,
      usuario_id    INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
      fecha         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await knex.schema.raw('CREATE INDEX idx_descargos_producto ON descargos_stock(producto_id)')
  await knex.schema.raw('CREATE INDEX idx_descargos_usuario ON descargos_stock(usuario_id)')
  await knex.schema.raw('CREATE INDEX idx_descargos_fecha ON descargos_stock(fecha)')
}

export async function down(knex) {
  await knex.schema.raw('DROP TABLE IF EXISTS descargos_stock')
}
