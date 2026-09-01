export function makeCategoriasRepository(knex) {
  return {
    list() {
      return knex('categorias').where({ activo: 1 }).orderBy('nombre')
    },

    async create({ nombre, icono, color }) {
      const [id] = await knex('categorias').insert({ nombre, icono, color })
      return knex('categorias').where({ id }).first()
    },

    async update(id, { nombre, icono, color }) {
      await knex('categorias')
        .where({ id })
        .update({ nombre, icono, color, updated_at: knex.fn.now() })
      return knex('categorias').where({ id }).first()
    },

    remove(id) {
      return knex('categorias').where({ id }).update({ activo: 0, updated_at: knex.fn.now() })
    }
  }
}
