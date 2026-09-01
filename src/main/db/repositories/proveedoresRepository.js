export function makeProveedoresRepository(knex) {
  return {
    list() {
      return knex('proveedores').where({ activo: 1 }).orderBy('nombre')
    },

    async create({ nombre, rif, telefono, contacto }) {
      const [id] = await knex('proveedores').insert({
        nombre,
        rif: rif || null,
        telefono: telefono || null,
        contacto: contacto || null
      })
      return knex('proveedores').where({ id }).first()
    },

    async update(id, { nombre, rif, telefono, contacto }) {
      await knex('proveedores')
        .where({ id })
        .update({
          nombre,
          rif: rif || null,
          telefono: telefono || null,
          contacto: contacto || null,
          updated_at: knex.fn.now()
        })
      return knex('proveedores').where({ id }).first()
    },

    remove(id) {
      return knex('proveedores').where({ id }).update({ activo: 0, updated_at: knex.fn.now() })
    }
  }
}
