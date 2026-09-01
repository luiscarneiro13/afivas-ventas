export async function up(knex) {
  await knex.schema.raw(`
    CREATE TABLE entradas_stock (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      producto_id   INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
      cantidad      INTEGER NOT NULL CHECK (cantidad > 0),
      proveedor     TEXT NOT NULL DEFAULT '—',
      nota          TEXT NULL,
      usuario_id    INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
      fecha         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await knex.schema.raw('CREATE INDEX idx_entradas_producto ON entradas_stock(producto_id)')
  await knex.schema.raw('CREATE INDEX idx_entradas_usuario ON entradas_stock(usuario_id)')
  await knex.schema.raw('CREATE INDEX idx_entradas_fecha ON entradas_stock(fecha)')
}

export async function down(knex) {
  await knex.schema.raw('DROP TABLE IF EXISTS entradas_stock')
}
