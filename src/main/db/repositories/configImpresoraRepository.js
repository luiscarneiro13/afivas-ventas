export function makeConfigImpresoraRepository(knex) {
  return {
    get() {
      return knex('config_impresora_fiscal').where({ id: 1 }).first()
    },

    async update(patch) {
      const row = { updated_at: knex.fn.now() }
      if (patch.conector !== undefined) row.conector = patch.conector
      if (patch.puertoCom !== undefined) row.puerto_com = patch.puertoCom
      if (patch.ultimoTestOk !== undefined) {
        row.ultimo_test_ok = patch.ultimoTestOk ? 1 : 0
        row.ultimo_test_at = knex.fn.now()
      }
      if (patch.ultimoTestMensaje !== undefined) row.ultimo_test_mensaje = patch.ultimoTestMensaje

      await knex('config_impresora_fiscal').where({ id: 1 }).update(row)
      return knex('config_impresora_fiscal').where({ id: 1 }).first()
    }
  }
}
