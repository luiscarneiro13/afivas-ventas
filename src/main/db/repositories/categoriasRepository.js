export function makeCategoriasRepository(knex) {
  return {
    list() {
      return knex('categorias').where({ activo: 1 }).orderBy('nombre')
    },

    async create({ nombre, color }) {
      const [id] = await knex('categorias').insert({ nombre, color })
      return knex('categorias').where({ id }).first()
    },

    async update(id, { nombre, color }) {
      await knex('categorias')
        .where({ id })
        .update({ nombre, color, updated_at: knex.fn.now() })
      return knex('categorias').where({ id }).first()
    },

    remove(id) {
      return knex('categorias').where({ id }).update({ activo: 0, updated_at: knex.fn.now() })
    }
  }
}
