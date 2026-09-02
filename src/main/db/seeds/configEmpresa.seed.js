// Inserta la fila única (singleton, id=1) con los datos reales del negocio,
// tal como aparecen en los tickets emitidos por la impresora fiscal.
export async function seedConfigEmpresa(knex) {
  const existing = await knex('config_empresa').where({ id: 1 }).first()
  if (existing) return

  await knex('config_empresa').insert({
    id: 1,
    razon_social: 'AFIVAS STORE BY ANA SILVA, F.P',
    rif: 'V-182285559',
    direccion: 'CR 3ERA CARRERA SUR LOCAL NRO 01, SECTOR PUEBLO NUEVO SUR, EL TIGRE EDO ANZOATEGUI, ZONA POSTAL 6050',
    porcentaje_iva: 16.0
  })
}
