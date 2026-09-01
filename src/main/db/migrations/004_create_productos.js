export async function up(knex) {
  await knex.schema.raw(`
    CREATE TABLE productos (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo          TEXT NOT NULL UNIQUE,
      descripcion     TEXT NOT NULL,
      categoria_id    INTEGER NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT ON UPDATE CASCADE,
      precio          NUMERIC(12,2) NOT NULL CHECK (precio >= 0),
      existencia      INTEGER NOT NULL DEFAULT 0 CHECK (existencia >= 0),
      activo          INTEGER NOT NULL DEFAULT 1,
      created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await knex.schema.raw('CREATE INDEX idx_productos_categoria ON productos(categoria_id)')
  await knex.schema.raw('CREATE INDEX idx_productos_activo ON productos(activo)')
}

export async function down(knex) {
  await knex.schema.raw('DROP TABLE IF EXISTS productos')
}
