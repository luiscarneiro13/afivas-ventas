export async function up(knex) {
  await knex.schema.raw(`
    ALTER TABLE productos
    ADD COLUMN stock_minimo INTEGER NOT NULL DEFAULT 3 CHECK (stock_minimo >= 0)
  `)
}

export async function down(knex) {
  await knex.schema.raw('ALTER TABLE productos DROP COLUMN stock_minimo')
}
