export async function up(knex) {
  await knex.schema.raw(`
    CREATE TABLE config_empresa (
      id                     INTEGER PRIMARY KEY CHECK (id = 1),
      razon_social           TEXT NOT NULL DEFAULT 'AFIVAS STORE',
      rif                    TEXT NOT NULL DEFAULT 'J-40512378-3',
      direccion              TEXT NULL,
      telefono               TEXT NULL,
      porcentaje_iva         NUMERIC(5,2) NOT NULL DEFAULT 16.00,
      mensaje_pie_factura    TEXT NOT NULL DEFAULT '¡Gracias por tu compra!',
      updated_by_usuario_id  INTEGER NULL REFERENCES usuarios(id) ON DELETE SET NULL,
      created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

export async function down(knex) {
  await knex.schema.raw('DROP TABLE IF EXISTS config_empresa')
}
