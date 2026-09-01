export function makeCierresFiscalesRepository(knex) {
  return {
    async registrar({ numeroReporteZ, sesionCajaId, usuarioId, totalVentas, respuestaCruda }) {
      const [id] = await knex('cierres_fiscales_z').insert({
        numero_reporte_z: numeroReporteZ,
        sesion_caja_id: sesionCajaId ?? null,
        usuario_id: usuarioId,
        total_ventas: totalVentas ?? null,
        respuesta_cruda: respuestaCruda ?? null
      })

      await knex('config_impresora_fiscal').where({ id: 1 }).update({
        ultimo_reporte_z_numero: numeroReporteZ,
        ultimo_reporte_z_fecha: knex.fn.now(),
        updated_at: knex.fn.now()
      })

      return knex('cierres_fiscales_z').where({ id }).first()
    },

    ultimo() {
      return knex('cierres_fiscales_z').orderBy('fecha', 'desc').first()
    }
  }
}
