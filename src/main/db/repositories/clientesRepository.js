export function makeClientesRepository(knex) {
  return {
    list() {
      return knex('clientes').where({ activo: 1 }).orderBy('nombre')
    },

    search(term) {
      const like = `%${term}%`
      return knex('clientes')
        .where('activo', 1)
        .andWhere((qb) => {
          qb.where('cedula', 'like', like).orWhere('nombre', 'like', like)
        })
        .orderBy('nombre')
    },

    findByCedula(cedula) {
      return knex('clientes').where({ cedula, activo: 1 }).first()
    },

    async create({ cedula, tipoDocumento, nombre, telefono }) {
      const [id] = await knex('clientes').insert({
        cedula,
        tipo_documento: tipoDocumento ?? 'V',
        nombre,
        telefono
      })
      return knex('clientes').where({ id }).first()
    },

    async update(id, { nombre, telefono, tipoDocumento }) {
      await knex('clientes')
        .where({ id })
        .update({ nombre, telefono, tipo_documento: tipoDocumento, updated_at: knex.fn.now() })
      return knex('clientes').where({ id }).first()
    },

    async remove(id) {
      const cliente = await knex('clientes').where({ id }).first()
      if (cliente?.es_eventual) {
        throw new Error('El Cliente Eventual es un registro del sistema y no puede eliminarse.')
      }
      return knex('clientes').where({ id }).update({ activo: 0, updated_at: knex.fn.now() })
    }
  }
}
