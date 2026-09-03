export function makeConfigEmpresaRepository(knex) {
  return {
    get() {
      return knex('config_empresa').where({ id: 1 }).first()
    },

    // Update parcial: solo escribe los campos que vienen definidos en el
    // patch. Necesario porque esta tabla la editan pantallas distintas (ej.
    // el % de IVA se edita desde Configuración > Máquina fiscal) que no
    // conocen ni deben pisar el resto de los datos de la empresa.
    async update(patch) {
      const row = { updated_at: knex.fn.now() }
      if (patch.razonSocial !== undefined) row.razon_social = patch.razonSocial
      if (patch.rif !== undefined) row.rif = patch.rif
      if (patch.direccion !== undefined) row.direccion = patch.direccion
      if (patch.telefono !== undefined) row.telefono = patch.telefono
      if (patch.porcentajeIva !== undefined) row.porcentaje_iva = patch.porcentajeIva
      if (patch.mensajePieFactura !== undefined) row.mensaje_pie_factura = patch.mensajePieFactura
      if (patch.updatedByUsuarioId !== undefined) row.updated_by_usuario_id = patch.updatedByUsuarioId

      await knex('config_empresa').where({ id: 1 }).update(row)
      return knex('config_empresa').where({ id: 1 }).first()
    }
  }
}
