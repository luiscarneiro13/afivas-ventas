export async function up(knex) {
  await knex.schema.raw(`
    CREATE TABLE usuarios (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario            TEXT NOT NULL UNIQUE,
      nombre_completo    TEXT NOT NULL,
      password_hash      TEXT NOT NULL,
      rol                TEXT NOT NULL CHECK (rol IN ('administrador','vendedor')),
      activo             INTEGER NOT NULL DEFAULT 1,
      ultimo_login_at    DATETIME NULL,
      created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await knex.schema.raw('CREATE INDEX idx_usuarios_rol ON usuarios(rol)')
  await knex.schema.raw('CREATE INDEX idx_usuarios_activo ON usuarios(activo)')
}

export async function down(knex) {
  await knex.schema.raw('DROP TABLE IF EXISTS usuarios')
}
