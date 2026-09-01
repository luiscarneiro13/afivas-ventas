// Inserta la fila única (singleton, id=1) con los datos hoy hardcodeados
// en FacturaModal.vue.
export async function seedConfigEmpresa(knex) {
  const existing = await knex('config_empresa').where({ id: 1 }).first()
  if (existing) return

  await knex('config_empresa').insert({
    id: 1,
    razon_social: 'AFIVAS STORE',
    rif: 'J-40512378-3',
    porcentaje_iva: 16.0
  })
}
