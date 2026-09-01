export async function up(knex) {
  await knex.schema.raw(`
    CREATE TABLE metodos_pago (
      id             TEXT PRIMARY KEY,
      etiqueta       TEXT NOT NULL,
      icono          TEXT NOT NULL,
      es_efectivo    INTEGER NOT NULL DEFAULT 0,
      codigo_fiscal  TEXT NOT NULL CHECK (length(codigo_fiscal) = 2),
      activo         INTEGER NOT NULL DEFAULT 1,
      orden          INTEGER NOT NULL DEFAULT 0,
      created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

export async function down(knex) {
  await knex.schema.raw('DROP TABLE IF EXISTS metodos_pago')
}
