export async function up(knex) {
  await knex.schema.raw(`
    CREATE TABLE sesiones_caja (
      id                     INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id             INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
      tasa_apertura          NUMERIC(12,4) NOT NULL,
      tasa_cierre            NUMERIC(12,4) NULL,
      monto_inicial          NUMERIC(12,2) NOT NULL DEFAULT 0,
      monto_contado_cierre   NUMERIC(12,2) NULL,
      diferencia_cierre      NUMERIC(12,2) NULL,
      estado                 TEXT NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta','cerrada')),
      abierta_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      cerrada_at             DATETIME NULL,
      notas_cierre           TEXT NULL,
      created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await knex.schema.raw('CREATE INDEX idx_sesiones_caja_usuario ON sesiones_caja(usuario_id)')
  await knex.schema.raw(
    "CREATE UNIQUE INDEX idx_sesiones_caja_unica_abierta ON sesiones_caja(estado) WHERE estado = 'abierta'"
  )
}

export async function down(knex) {
  await knex.schema.raw('DROP TABLE IF EXISTS sesiones_caja')
}
