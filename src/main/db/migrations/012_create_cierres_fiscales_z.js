export async function up(knex) {
  await knex.schema.raw(`
    CREATE TABLE cierres_fiscales_z (
      id                    INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_reporte_z      INTEGER NOT NULL UNIQUE,
      sesion_caja_id        INTEGER NULL REFERENCES sesiones_caja(id) ON DELETE SET NULL,
      usuario_id            INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
      fecha                 DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      total_ventas          NUMERIC(12,2) NULL,
      respuesta_cruda       TEXT NULL,
      created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await knex.schema.raw('CREATE INDEX idx_cierres_z_fecha ON cierres_fiscales_z(fecha)')
}

export async function down(knex) {
  await knex.schema.raw('DROP TABLE IF EXISTS cierres_fiscales_z')
}
