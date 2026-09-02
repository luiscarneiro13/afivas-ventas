export function makeBancosRepository(knex) {
  return {
    list() {
      return knex('bancos').orderBy('nombre')
    }
  }
}
