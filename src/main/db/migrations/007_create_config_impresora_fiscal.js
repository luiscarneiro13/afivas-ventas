export async function up(knex) {
  await knex.schema.raw(`
    CREATE TABLE config_impresora_fiscal (
      id                             INTEGER PRIMARY KEY CHECK (id = 1),
      conector                       TEXT NOT NULL DEFAULT 'tfhkaif',
      puerto_com                     TEXT NULL,
      modelo_impresora               TEXT NOT NULL DEFAULT 'Aclas PP9-Plus',
      ultimo_test_ok                 INTEGER NOT NULL DEFAULT 0,
      ultimo_test_at                 DATETIME NULL,
      ultimo_test_mensaje            TEXT NULL,
      correlativo_factura_fiscal     INTEGER NOT NULL DEFAULT 0,
      ultimo_reporte_z_numero        INTEGER NULL,
      ultimo_reporte_z_fecha         DATETIME NULL,
      updated_at                     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

export async function down(knex) {
  await knex.schema.raw('DROP TABLE IF EXISTS config_impresora_fiscal')
}
