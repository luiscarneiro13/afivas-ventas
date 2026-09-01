export function makeMetodosPagoRepository(knex) {
  return {
    list() {
      return knex('metodos_pago').where({ activo: 1 }).orderBy('orden')
    }
  }
}
