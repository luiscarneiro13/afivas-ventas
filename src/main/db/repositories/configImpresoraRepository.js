export function makeConfigImpresoraRepository(knex) {
  return {
    // Si el correlativo nunca se configuró (sigue en 0, el default de la
    // columna), se autocompleta una sola vez con el último número de
    // factura ya emitido en la BD local, para que el primer arranque no
    // vuelva a empezar la numeración fiscal desde cero.
    async get() {
      let config = await knex('config_impresora_fiscal').where({ id: 1 }).first()
      if (!config.correlativo_factura_fiscal) {
        const row = await knex('ventas').max({ maxNumero: 'numero' }).first()
        const correlativo = row?.maxNumero || 0
        await knex('config_impresora_fiscal').where({ id: 1 }).update({ correlativo_factura_fiscal: correlativo })
        config = { ...config, correlativo_factura_fiscal: correlativo }
      }
      return config
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
      if (patch.correlativoFacturaFiscal !== undefined) {
        row.correlativo_factura_fiscal = patch.correlativoFacturaFiscal
      }

      await knex('config_impresora_fiscal').where({ id: 1 }).update(row)
      return knex('config_impresora_fiscal').where({ id: 1 }).first()
    }
  }
}
