export function makeCategoriasRepository(knex) {
  return {
    list() {
      return knex('categorias').where({ activo: 1 }).orderBy('nombre')
    },

    async create({ nombre }) {
      const [id] = await knex('categorias').insert({ nombre })
      return knex('categorias').where({ id }).first()
    },

    async update(id, { nombre }) {
      await knex('categorias')
        .where({ id })
        .update({ nombre, updated_at: knex.fn.now() })
      return knex('categorias').where({ id }).first()
    },

    remove(id) {
      return knex('categorias').where({ id }).update({ activo: 0, updated_at: knex.fn.now() })
    }
  }
}
