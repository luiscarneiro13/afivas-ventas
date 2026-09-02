// Migra CLIENTS_SEED de dummy.js. Ya no se siembra el "Cliente Eventual":
// toda venta ahora requiere un cliente real registrado (ver es_eventual en
// clientesRepository — se conserva solo como resguardo para instalaciones
// existentes que ya tengan ese registro histórico).
const CLIENTS_SEED = [
  { cedula: '31179420', nombre: 'Mariana Carneiro', telefono: '0414-1234567' },
  { cedula: '27845213', nombre: 'José Rodríguez', telefono: '0424-9876543' },
  { cedula: '19563287', nombre: 'Ana Silva', telefono: '0412-5551234' },
  { cedula: '25102938', nombre: 'Carlos Peña', telefono: '0416-4432109' },
  { cedula: '30456712', nombre: 'Valentina Gómez', telefono: '0426-7788990' }
]

export async function seedClientes(knex) {
  const count = await knex('clientes').count({ c: '*' }).first()
  if (Number(count.c) > 0) return

  await knex('clientes').insert(
    CLIENTS_SEED.map((c) => ({
      cedula: c.cedula,
      tipo_documento: 'V',
      nombre: c.nombre,
      telefono: c.telefono,
      es_eventual: 0
    }))
  )
}
