// Clientes reales registrados actualmente en el negocio (no incluye el
// "Cliente Eventual": toda venta ahora requiere un cliente real registrado,
// ver es_eventual en clientesRepository — ese registro se conserva solo
// como resguardo para instalaciones existentes que ya lo tengan).
// Idempotente por cédula (onConflict('cedula').ignore()): agregar clientes
// nuevos a esta lista los lleva también a instalaciones ya sembradas.
const CLIENTES_REALES = [
  { cedula: '16572916', nombre: 'Luis Carneiro', direccion: 'El Tigre' },
  { cedula: '18228555', nombre: 'Ana Silva', direccion: 'El Tigre' }
]

export async function seedClientesReales(knex) {
  await knex('clientes')
    .insert(
      CLIENTES_REALES.map((c) => ({
        cedula: c.cedula,
        tipo_documento: 'V',
        nombre: c.nombre,
        direccion: c.direccion,
        es_eventual: 0
      }))
    )
    .onConflict('cedula')
    .ignore()
}
