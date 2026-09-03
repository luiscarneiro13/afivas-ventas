export function makeCierresFiscalesRepository(knex) {
  return {
    // El número de Reporte Z lo lleva el software (igual que el correlativo
    // de factura fiscal): el protocolo TFHKA no lo devuelve, así que se
    // calcula acá como "el último guardado + 1" y solo se persiste cuando el
    // cierre ya se registró con éxito.
    async registrar({ sesionCajaId, usuarioId, totalVentas, respuestaCruda }) {
      return knex.transaction(async (trx) => {
        const config = await trx('config_impresora_fiscal').where({ id: 1 }).first()
        const numeroReporteZ = (config?.ultimo_reporte_z_numero || 0) + 1

        const [id] = await trx('cierres_fiscales_z').insert({
          numero_reporte_z: numeroReporteZ,
          sesion_caja_id: sesionCajaId ?? null,
          usuario_id: usuarioId,
          total_ventas: totalVentas ?? null,
          respuesta_cruda: respuestaCruda ?? null
        })

        await trx('config_impresora_fiscal').where({ id: 1 }).update({
          ultimo_reporte_z_numero: numeroReporteZ,
          ultimo_reporte_z_fecha: trx.fn.now(),
          updated_at: trx.fn.now()
        })

        return trx('cierres_fiscales_z').where({ id }).first()
      })
    },

    ultimo() {
      return knex('cierres_fiscales_z').orderBy('fecha', 'desc').first()
    },

    // Histórico completo de cierres Z, con el nombre del usuario que cerró.
    historial({ limit = 50 } = {}) {
      return knex('cierres_fiscales_z')
        .leftJoin('usuarios', 'usuarios.id', 'cierres_fiscales_z.usuario_id')
        .select('cierres_fiscales_z.*', 'usuarios.nombre_completo as usuario_nombre')
        .orderBy('cierres_fiscales_z.fecha', 'desc')
        .limit(limit)
    }
  }
}
