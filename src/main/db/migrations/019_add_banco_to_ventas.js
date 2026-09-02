export async function up(knex) {
  await knex.schema.raw('ALTER TABLE ventas ADD COLUMN banco_id INTEGER NULL REFERENCES bancos(id)')
}

export async function down(knex) {
  await knex.schema.raw('ALTER TABLE ventas DROP COLUMN banco_id')
}
