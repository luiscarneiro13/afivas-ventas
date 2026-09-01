import bcrypt from 'bcryptjs'

function toPublicUser(row) {
  if (!row) return null
  return {
    id: row.id,
    usuario: row.usuario,
    nombreCompleto: row.nombre_completo,
    rol: row.rol,
    activo: !!row.activo
  }
}

export function makeUsuariosRepository(knex) {
  return {
    async login(usuario, password) {
      const row = await knex('usuarios').where({ usuario, activo: 1 }).first()
      if (!row) return null

      const ok = await bcrypt.compare(password, row.password_hash)
      if (!ok) return null

      await knex('usuarios')
        .where({ id: row.id })
        .update({ ultimo_login_at: knex.fn.now() })

      return toPublicUser(row)
    },

    async list() {
      const rows = await knex('usuarios').orderBy('nombre_completo')
      return rows.map(toPublicUser)
    },

    async create({ usuario, nombreCompleto, password, rol }) {
      const passwordHash = await bcrypt.hash(password, 10)
      const [id] = await knex('usuarios').insert({
        usuario,
        nombre_completo: nombreCompleto,
        password_hash: passwordHash,
        rol
      })
      const row = await knex('usuarios').where({ id }).first()
      return toPublicUser(row)
    },

    async update(id, { nombreCompleto, rol, password }) {
      const patch = {
        nombre_completo: nombreCompleto,
        rol,
        updated_at: knex.fn.now()
      }
      if (password) {
        patch.password_hash = await bcrypt.hash(password, 10)
      }
      await knex('usuarios').where({ id }).update(patch)
      const row = await knex('usuarios').where({ id }).first()
      return toPublicUser(row)
    },

    async desactivar(id) {
      await knex('usuarios').where({ id }).update({ activo: 0, updated_at: knex.fn.now() })
    }
  }
}
