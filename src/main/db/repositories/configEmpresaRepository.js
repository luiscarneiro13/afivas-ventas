export function makeConfigEmpresaRepository(knex) {
  return {
    get() {
      return knex('config_empresa').where({ id: 1 }).first()
    },

    async update({ razonSocial, rif, direccion, telefono, porcentajeIva, mensajePieFactura, updatedByUsuarioId }) {
      await knex('config_empresa').where({ id: 1 }).update({
        razon_social: razonSocial,
        rif,
        direccion,
        telefono,
        porcentaje_iva: porcentajeIva,
        mensaje_pie_factura: mensajePieFactura,
        updated_by_usuario_id: updatedByUsuarioId ?? null,
        updated_at: knex.fn.now()
      })
      return knex('config_empresa').where({ id: 1 }).first()
    }
  }
}
