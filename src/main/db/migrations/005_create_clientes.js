export async function up(knex) {
  await knex.schema.raw(`
    CREATE TABLE clientes (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      cedula            TEXT NOT NULL UNIQUE,
      tipo_documento    TEXT NOT NULL DEFAULT 'V' CHECK (tipo_documento IN ('V','E','J','G','P')),
      nombre            TEXT NOT NULL,
      telefono          TEXT NULL,
      es_eventual       INTEGER NOT NULL DEFAULT 0,
      activo            INTEGER NOT NULL DEFAULT 1,
      created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await knex.schema.raw('CREATE INDEX idx_clientes_nombre ON clientes(nombre)')
  await knex.schema.raw(
    'CREATE UNIQUE INDEX idx_clientes_eventual_unico ON clientes(es_eventual) WHERE es_eventual = 1'
  )
}

export async function down(knex) {
  await knex.schema.raw('DROP TABLE IF EXISTS clientes')
}
