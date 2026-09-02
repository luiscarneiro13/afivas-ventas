// Corrige la fila única de config_empresa en bases de datos ya migradas
// (donde el seed original insertó "AFIVAS STORE" / "J-40512378-3" de
// prueba) con los datos reales del negocio, tomados de los tickets que
// emite la impresora fiscal. En una instalación nueva, seedConfigEmpresa()
// ya inserta estos mismos valores, así que este UPDATE no tiene efecto.
export async function up(knex) {
  await knex('config_empresa')
    .where({ id: 1 })
    .update({
      razon_social: 'AFIVAS STORE BY ANA SILVA, F.P',
      rif: 'V-182285559',
      direccion: 'CR 3ERA CARRERA SUR LOCAL NRO 01, SECTOR PUEBLO NUEVO SUR, EL TIGRE EDO ANZOATEGUI, ZONA POSTAL 6050'
    })
}

export async function down(knex) {
  await knex('config_empresa').where({ id: 1 }).update({
    razon_social: 'AFIVAS STORE',
    rif: 'J-40512378-3',
    direccion: null
  })
}
