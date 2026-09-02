// SQLite no soporta ALTER COLUMN para quitar NOT NULL, así que se
// reconstruye la tabla (patrón estándar de SQLite para este tipo de cambio).
export async function up(knex) {
  await knex.schema.raw('PRAGMA foreign_keys = OFF')
  await knex.schema.raw(`
    CREATE TABLE productos_new (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo          TEXT NOT NULL UNIQUE,
      descripcion     TEXT NOT NULL,
      categoria_id    INTEGER NULL REFERENCES categorias(id) ON DELETE RESTRICT ON UPDATE CASCADE,
      precio          NUMERIC(12,2) NOT NULL CHECK (precio >= 0),
      existencia      INTEGER NOT NULL DEFAULT 0 CHECK (existencia >= 0),
      activo          INTEGER NOT NULL DEFAULT 1,
      created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      stock_minimo    INTEGER NOT NULL DEFAULT 3 CHECK (stock_minimo >= 0)
    )
  `)
  await knex.schema.raw(`
    INSERT INTO productos_new (id, codigo, descripcion, categoria_id, precio, existencia, activo, created_at, updated_at, stock_minimo)
    SELECT id, codigo, descripcion, categoria_id, precio, existencia, activo, created_at, updated_at, stock_minimo FROM productos
  `)
  await knex.schema.raw('DROP TABLE productos')
  await knex.schema.raw('ALTER TABLE productos_new RENAME TO productos')
  await knex.schema.raw('CREATE INDEX idx_productos_categoria ON productos(categoria_id)')
  await knex.schema.raw('CREATE INDEX idx_productos_activo ON productos(activo)')
  await knex.schema.raw('PRAGMA foreign_keys = ON')
}

export async function down(knex) {
  await knex.schema.raw('PRAGMA foreign_keys = OFF')
  await knex.schema.raw(`
    CREATE TABLE productos_old (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo          TEXT NOT NULL UNIQUE,
      descripcion     TEXT NOT NULL,
      categoria_id    INTEGER NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT ON UPDATE CASCADE,
      precio          NUMERIC(12,2) NOT NULL CHECK (precio >= 0),
      existencia      INTEGER NOT NULL DEFAULT 0 CHECK (existencia >= 0),
      activo          INTEGER NOT NULL DEFAULT 1,
      created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      stock_minimo    INTEGER NOT NULL DEFAULT 3 CHECK (stock_minimo >= 0)
    )
  `)
  await knex.schema.raw(`
    INSERT INTO productos_old (id, codigo, descripcion, categoria_id, precio, existencia, activo, created_at, updated_at, stock_minimo)
    SELECT id, codigo, descripcion, categoria_id, precio, existencia, activo, created_at, updated_at, stock_minimo FROM productos
    WHERE categoria_id IS NOT NULL
  `)
  await knex.schema.raw('DROP TABLE productos')
  await knex.schema.raw('ALTER TABLE productos_old RENAME TO productos')
  await knex.schema.raw('CREATE INDEX idx_productos_categoria ON productos(categoria_id)')
  await knex.schema.raw('CREATE INDEX idx_productos_activo ON productos(activo)')
  await knex.schema.raw('PRAGMA foreign_keys = ON')
}
