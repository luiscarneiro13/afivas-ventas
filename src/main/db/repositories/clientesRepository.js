const TIPOS_DOCUMENTO_VALIDOS = ['V', 'E', 'J', 'G', 'P']

function assertTipoDocumentoValido(tipoDocumento) {
  if (!TIPOS_DOCUMENTO_VALIDOS.includes(tipoDocumento)) {
    throw new Error('El tipo de documento del cliente es obligatorio (V, E, J, G o P).')
  }
}

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

    async create({ cedula, tipoDocumento, nombre, direccion, telefono, movil, correo }) {
      assertTipoDocumentoValido(tipoDocumento)
      const existente = await knex('clientes').where({ cedula }).first()
      if (existente) {
        throw new Error('Ya existe un cliente registrado con esa cédula/RIF.')
      }
      const [id] = await knex('clientes').insert({
        cedula,
        tipo_documento: tipoDocumento,
        nombre,
        direccion: direccion || null,
        telefono: telefono || null,
        movil: movil || null,
        correo: correo || null
      })
      return knex('clientes').where({ id }).first()
    },

    async update(id, { nombre, direccion, telefono, movil, correo, tipoDocumento }) {
      assertTipoDocumentoValido(tipoDocumento)
      await knex('clientes')
        .where({ id })
        .update({
          nombre,
          direccion: direccion || null,
          telefono: telefono || null,
          movil: movil || null,
          correo: correo || null,
          tipo_documento: tipoDocumento,
          updated_at: knex.fn.now()
        })
      return knex('clientes').where({ id }).first()
    },

    async remove(id) {
      const cliente = await knex('clientes').where({ id }).first()
      if (cliente?.es_eventual) {
        throw new Error('El Cliente Eventual es un registro del sistema y no puede eliminarse.')
      }
      const tieneVentas = await knex('ventas').where({ cliente_id: id }).first()
      if (tieneVentas) {
        throw new Error('No se puede eliminar: el cliente tiene ventas registradas.')
      }
      return knex('clientes').where({ id }).del()
    }
  }
}
