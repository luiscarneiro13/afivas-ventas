export async function up(knex) {
  await knex.schema.raw(`
    CREATE TABLE proveedores (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre       TEXT NOT NULL,
      rif          TEXT NULL,
      telefono     TEXT NULL,
      contacto     TEXT NULL,
      activo       INTEGER NOT NULL DEFAULT 1,
      created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await knex.schema.raw('CREATE INDEX idx_proveedores_activo ON proveedores(activo)')
  await knex.schema.raw('CREATE INDEX idx_proveedores_nombre ON proveedores(nombre)')
  await knex.schema.raw(
    'CREATE UNIQUE INDEX idx_proveedores_rif_unico ON proveedores(rif) WHERE rif IS NOT NULL'
  )
}

export async function down(knex) {
  await knex.schema.raw('DROP TABLE IF EXISTS proveedores')
}
