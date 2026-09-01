export function makeSesionesCajaRepository(knex) {
  return {
    actual() {
      return knex('sesiones_caja').where({ estado: 'abierta' }).first()
    },

    async abrir({ usuarioId, tasaApertura, montoInicial }) {
      const abierta = await knex('sesiones_caja').where({ estado: 'abierta' }).first()
      if (abierta) {
        throw new Error('Ya hay una sesión de caja abierta.')
      }
      // El índice único parcial idx_sesiones_caja_unica_abierta es el
      // resguardo real contra condiciones de carrera; este chequeo previo
      // solo da un mensaje de error legible en el caso común.
      const [id] = await knex('sesiones_caja').insert({
        usuario_id: usuarioId,
        tasa_apertura: tasaApertura,
        monto_inicial: montoInicial ?? 0
      })
      return knex('sesiones_caja').where({ id }).first()
    },

    async cerrar(id, { tasaCierre, montoContadoCierre, notasCierre }) {
      const sesion = await knex('sesiones_caja').where({ id }).first()
      if (!sesion) throw new Error('Sesión de caja no encontrada.')

      const ventas = await knex('ventas')
        .where({ sesion_caja_id: id, estado: 'completada' })
        .sum({ total: 'total' })
        .first()
      const totalVentas = Number(ventas.total ?? 0)
      const montoEsperado = Number(sesion.monto_inicial) + totalVentas
      const diferencia = Number(montoContadoCierre ?? 0) - montoEsperado

      await knex('sesiones_caja')
        .where({ id })
        .update({
          estado: 'cerrada',
          tasa_cierre: tasaCierre,
          monto_contado_cierre: montoContadoCierre,
          diferencia_cierre: diferencia,
          notas_cierre: notasCierre ?? null,
          cerrada_at: knex.fn.now(),
          updated_at: knex.fn.now()
        })
      return knex('sesiones_caja').where({ id }).first()
    }
  }
}
