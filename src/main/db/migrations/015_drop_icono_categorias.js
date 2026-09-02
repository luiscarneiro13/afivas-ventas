export async function up(knex) {
  await knex.schema.raw('ALTER TABLE categorias DROP COLUMN icono')
}

export async function down(knex) {
  await knex.schema.raw("ALTER TABLE categorias ADD COLUMN icono TEXT NOT NULL DEFAULT 'box'")
}
