export async function up(knex) {
  await knex.schema.raw('ALTER TABLE categorias DROP COLUMN color')
}

export async function down(knex) {
  await knex.schema.raw("ALTER TABLE categorias ADD COLUMN color TEXT NOT NULL DEFAULT '#5d3fd3'")
}
