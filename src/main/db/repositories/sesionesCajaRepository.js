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

    // Permite corregir la tasa de cambio de la sesión abierta en curso (se
    // edita desde el pill de tasa en el header). Se persiste en
    // tasa_apertura porque esa es la única columna que fetchActual() lee de
    // vuelta al reabrir la app — si no se persiste acá, un logout/login
    // revierte la tasa a la que tenía la sesión al abrirse.
    async actualizarTasa(id, tasa) {
      await knex('sesiones_caja')
        .where({ id, estado: 'abierta' })
        .update({ tasa_apertura: tasa, updated_at: knex.fn.now() })
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
      const sesionCerrada = await knex('sesiones_caja').where({ id }).first()
      // total_ventas no es columna de la tabla (solo se usó para calcular la
      // diferencia), pero el llamador lo necesita para el histórico de
      // cierres fiscales Z, así que se agrega al objeto devuelto.
      return { ...sesionCerrada, total_ventas: totalVentas }
    },

    // Histórico de aperturas/cierres de caja (nunca se borran filas: abrir()
    // siempre inserta una nueva y cerrar() solo actualiza la existente).
    historial({ limit = 50 } = {}) {
      return knex('sesiones_caja')
        .leftJoin('usuarios', 'usuarios.id', 'sesiones_caja.usuario_id')
        .select('sesiones_caja.*', 'usuarios.nombre_completo as usuario_nombre')
        .orderBy('sesiones_caja.abierta_at', 'desc')
        .limit(limit)
    }
  }
}
