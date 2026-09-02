export async function up(knex) {
  await knex.schema.raw(`
    CREATE TABLE bancos (
      id     INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE
    )
  `)
}

export async function down(knex) {
  await knex.schema.raw('DROP TABLE IF EXISTS bancos')
}
