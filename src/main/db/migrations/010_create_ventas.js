export async function up(knex) {
  await knex.schema.raw(`
    CREATE TABLE ventas (
      id                                  INTEGER PRIMARY KEY AUTOINCREMENT,
      numero                              INTEGER NOT NULL UNIQUE,
      cliente_id                          INTEGER NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
      cliente_cedula_snapshot             TEXT NOT NULL,
      cliente_nombre_snapshot             TEXT NOT NULL,
      cliente_tipo_documento_snapshot     TEXT NOT NULL DEFAULT 'V',
      sesion_caja_id                      INTEGER NOT NULL REFERENCES sesiones_caja(id) ON DELETE RESTRICT,
      usuario_id                          INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
      metodo_pago_id                      TEXT NOT NULL REFERENCES metodos_pago(id) ON DELETE RESTRICT,
      subtotal                            NUMERIC(12,2) NOT NULL,
      porcentaje_iva                      NUMERIC(5,2) NOT NULL DEFAULT 16.00,
      iva                                 NUMERIC(12,2) NOT NULL,
      total                               NUMERIC(12,2) NOT NULL,
      recibido                            NUMERIC(12,2) NOT NULL DEFAULT 0,
      vuelto                              NUMERIC(12,2) NOT NULL DEFAULT 0,
      referencia_pago                     TEXT NULL,
      tasa_cambio                         NUMERIC(12,4) NOT NULL,
      estado                              TEXT NOT NULL DEFAULT 'completada' CHECK (estado IN ('completada','anulada')),
      numero_factura_fiscal               TEXT NULL,
      impresa_fiscalmente                 INTEGER NOT NULL DEFAULT 0,
      fecha_impresion_fiscal              DATETIME NULL,
      fecha                               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at                          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await knex.schema.raw('CREATE INDEX idx_ventas_cliente ON ventas(cliente_id)')
  await knex.schema.raw('CREATE INDEX idx_ventas_usuario ON ventas(usuario_id)')
  await knex.schema.raw('CREATE INDEX idx_ventas_sesion_caja ON ventas(sesion_caja_id)')
  await knex.schema.raw('CREATE INDEX idx_ventas_fecha ON ventas(fecha)')
  await knex.schema.raw('CREATE INDEX idx_ventas_estado ON ventas(estado)')
}

export async function down(knex) {
  await knex.schema.raw('DROP TABLE IF EXISTS ventas')
}
