// Inserta la fila única (singleton, id=1) con el conector 'tfhkaif' por
// defecto (el único funcional hoy en ConfiguracionView.vue).
export async function seedConfigImpresoraFiscal(knex) {
  const existing = await knex('config_impresora_fiscal').where({ id: 1 }).first()
  if (existing) return

  await knex('config_impresora_fiscal').insert({
    id: 1,
    conector: 'tfhkaif',
    modelo_impresora: 'Aclas PP9-Plus'
  })
}
