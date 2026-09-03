// Migra PAY_METHODS de dummy.js + agrega codigo_fiscal (2 dígitos que
// exige el comando TFHKA `1<medio>` para totalizar por medio de pago).
//
// PENDIENTE: estos códigos son placeholders (01-06 en orden) y deben
// verificarse contra el manual TFHKA del fabricante antes de usarse en
// producción para registrar pagos fiscalmente.
const PAY_METHODS = [
  { id: 'efectivo', label: 'Efectivo', icon: 'dollar', cash: true, codigoFiscal: '01' },
  { id: 'debito', label: 'Tarjeta débito', icon: 'card', cash: false, codigoFiscal: '02' },
  { id: 'credito', label: 'Tarjeta crédito', icon: 'card', cash: false, codigoFiscal: '03' },
  { id: 'transferencia', label: 'Transferencia', icon: 'repeat', cash: false, codigoFiscal: '04' },
  { id: 'pagomovil', label: 'Pago móvil', icon: 'phone', cash: false, codigoFiscal: '05' },
  { id: 'divisas', label: 'Divisas', icon: 'globe', cash: true, codigoFiscal: '06' }
]

export async function seedMetodosPago(knex) {
  const rows = PAY_METHODS.map((m, idx) => ({
    id: m.id,
    etiqueta: m.label,
    icono: m.icon,
    es_efectivo: m.cash ? 1 : 0,
    codigo_fiscal: m.codigoFiscal,
    orden: idx
  }))
  await knex('metodos_pago').insert(rows).onConflict('id').ignore()
}
