export async function up(knex) {
  await knex.schema.raw('ALTER TABLE clientes ADD COLUMN direccion TEXT NULL')
  await knex.schema.raw('ALTER TABLE clientes ADD COLUMN movil TEXT NULL')
  await knex.schema.raw('ALTER TABLE clientes ADD COLUMN correo TEXT NULL')
}

export async function down(knex) {
  await knex.schema.raw('ALTER TABLE clientes DROP COLUMN direccion')
  await knex.schema.raw('ALTER TABLE clientes DROP COLUMN movil')
  await knex.schema.raw('ALTER TABLE clientes DROP COLUMN correo')
}
