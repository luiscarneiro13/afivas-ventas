export async function up(knex) {
  await knex.schema.raw(`
    CREATE TABLE categorias (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre       TEXT NOT NULL UNIQUE,
      icono        TEXT NOT NULL,
      color        TEXT NOT NULL,
      activo       INTEGER NOT NULL DEFAULT 1,
      created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

export async function down(knex) {
  await knex.schema.raw('DROP TABLE IF EXISTS categorias')
}
