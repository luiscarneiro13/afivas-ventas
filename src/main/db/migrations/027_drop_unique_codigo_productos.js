// El código de producto deja de ser UNIQUE: un producto borrado, un color o
// una talla del mismo artículo pueden compartir el mismo código.
//
// Estrategia (por pedido explícito):
//   1. Se crea `productos_backup` con TODA la información actual de `productos`.
//      Es una tabla "muerta": sin FK, sin UNIQUE, que nadie consulta. Queda
//      de forma permanente como respaldo del sistema.
//   2. Se hace DROP de `productos`.
//   3. Se crea nuevamente `productos` con los mismos campos, conservando la FK
//      hacia `categorias` y el resto de constraints, pero SIN el UNIQUE de
//      `codigo`.
//   4. Se copian todos los productos desde `productos_backup`.
//
// La migración corre sola y sin que el cliente lo note: `migrateAndSeed()` se
// ejecuta en `app.whenReady()` ANTES de `createWindow()` (src/main/index.js).
// Una vez registrada en `knex_migrations`, Knex no vuelve a ejecutarla.
//
// Nota sobre `transaction: false`: la app activa `PRAGMA foreign_keys = ON`
// en cada conexión (src/main/db/knexfile.js). Con las FKs activas, el
// `DROP TABLE productos` dispara `ON DELETE RESTRICT` desde `venta_items` y
// falla. Dentro de una transacción el PRAGMA no se puede cambiar (es no-op
// dentro de un BEGIN), por eso esta migración corre sin transacción y apaga
// las FKs solo durante la ventana del DROP/CREATE/INSERT, restaurándolas
// al final. `productos_backup` queda intacta ante cualquier falla.
export const config = { transaction: false }

const COLUMNAS = [
  'id',
  'codigo',
  'descripcion',
  'categoria_id',
  'precio',
  'existencia',
  'activo',
  'created_at',
  'updated_at',
  'stock_minimo',
  'precio_con_iva'
]

const LISTA_COLUMNAS = COLUMNAS.join(', ')

async function existeTabla(knex, nombre) {
  // OJO: `knex.raw()` NO devuelve filas (solo encola la sentencia en
  // el SchemaBuilder). Para leer datos hay que usar `knex.raw()`.
  const filas = await knex.raw(
    'SELECT name FROM sqlite_master WHERE type = ? AND name = ?',
    ['table', nombre]
  )
  return filas.length > 0
}

async function leerPragma(knex, pragma) {
  const filas = await knex.raw(`PRAGMA ${pragma}`)
  if (!filas.length) return null
  return Object.values(filas[0])[0]
}

async function crearProductosBackup(knex) {
  // Copia íntegra, sin FK y sin UNIQUE: es una tabla muerta de respaldo.
  await knex.raw(`
    CREATE TABLE productos_backup (
      id             INTEGER PRIMARY KEY,
      codigo         TEXT NOT NULL,
      descripcion    TEXT NOT NULL,
      categoria_id   INTEGER NULL,
      precio         NUMERIC(12,2) NOT NULL,
      existencia     INTEGER NOT NULL DEFAULT 0,
      activo         INTEGER NOT NULL DEFAULT 1,
      created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      stock_minimo   INTEGER NOT NULL DEFAULT 3,
      precio_con_iva NUMERIC(12,2) NOT NULL DEFAULT 0
    )
  `)
  await knex.raw(
    `INSERT INTO productos_backup (${LISTA_COLUMNAS}) SELECT ${LISTA_COLUMNAS} FROM productos`
  )
}

async function crearProductos(knex) {
  // Mismo esquema que la original, con la FK hacia `categorias` intacta y
  // con el UNIQUE de `codigo` eliminado (de ahí en adelante el código puede
  // repetirse).
  await knex.raw(`
    CREATE TABLE productos (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo          TEXT NOT NULL,
      descripcion     TEXT NOT NULL,
      categoria_id    INTEGER NULL REFERENCES categorias(id) ON DELETE RESTRICT ON UPDATE CASCADE,
      precio          NUMERIC(12,2) NOT NULL CHECK (precio >= 0),
      existencia      INTEGER NOT NULL DEFAULT 0 CHECK (existencia >= 0),
      activo          INTEGER NOT NULL DEFAULT 1,
      created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      stock_minimo    INTEGER NOT NULL DEFAULT 3 CHECK (stock_minimo >= 0),
      precio_con_iva  NUMERIC(12,2) NOT NULL DEFAULT 0
    )
  `)
}

async function crearIndices(knex) {
  await knex.raw('CREATE INDEX idx_productos_categoria ON productos(categoria_id)')
  await knex.raw('CREATE INDEX idx_productos_activo ON productos(activo)')
  // El UNIQUE anterior generaba sqlite_autoindex_productos_1, que servía de
  // índice para los `WHERE codigo = ?` de la app. Se reemplaza por un índice
  // NO único para no perder rendimiento.
  await knex.raw('CREATE INDEX idx_productos_codigo ON productos(codigo)')
}

export async function up(knex) {
  // --- Recuperación ante una corrida anterior interrumpida -------------
  // Si `productos` no existe pero `productos_backup` sí, la corrida previa
  // se cortó entre el DROP y el CREATE. Se restaura desde el respaldo y se
  // sigue adelante.
  if (!(await existeTabla(knex, 'productos'))) {
    if (await existeTabla(knex, 'productos_backup')) {
      await crearProductos(knex)
      await knex.raw(
        `INSERT INTO productos (${LISTA_COLUMNAS}) SELECT ${LISTA_COLUMNAS} FROM productos_backup`
      )
      await crearIndices(knex)
    } else {
      throw new Error('Migración 027: no existe la tabla productos ni productos_backup')
    }
  }

  // Si ya quedó una `productos_new` de una corrida fallida, se descarta.
  if (await existeTabla(knex, 'productos_new')) {
    await knex.raw('DROP TABLE productos_new')
  }

  // Valor original del AUTOINCREMENT: se restaura al final para que los
  // próximos productos no reutilicen ids ya usados (y borrados) antes.
  const seqOriginal = await knex('sqlite_sequence').where({ name: 'productos' }).first()

  const fkEstadoOriginal = await leerPragma(knex, 'foreign_keys')

  try {
    // Las FKs se apagan solo durante esta ventana. Es indispensable: con
    // FKs activas, el DROP de `productos` dispara el ON DELETE RESTRICT de
    // `venta_items` / `entradas_stock` / `descargos_stock` y falla.
    await knex.raw('PRAGMA foreign_keys = OFF')

    // 1) Respaldo permanente de toda la información actual.
    if (await existeTabla(knex, 'productos_backup')) {
      await knex.raw('DROP TABLE productos_backup')
    }
    await crearProductosBackup(knex)

    // 2) Se rehace la tabla productos sin el UNIQUE de codigo.
    await knex.raw('DROP TABLE productos')
    await crearProductos(knex)

    // 3) Se repuebla desde el respaldo (mismos ids, mismos datos).
    await knex.raw(
      `INSERT INTO productos (${LISTA_COLUMNAS}) SELECT ${LISTA_COLUMNAS} FROM productos_backup`
    )

    await crearIndices(knex)
  } finally {
    // Las FKs se restauran siempre, haya terminado bien o mal.
    await knex.raw(`PRAGMA foreign_keys = ${fkEstadoOriginal === 0 ? 'OFF' : 'ON'}`)
  }

  // Se restaura el valor del AUTOINCREMENT para no reutilizar ids.
  if (seqOriginal && seqOriginal.seq) {
    const seqActual = await knex('sqlite_sequence').where({ name: 'productos' }).first()
    if (seqActual) {
      await knex('sqlite_sequence').where({ name: 'productos' }).update({ seq: seqOriginal.seq })
    }
  }

  // Verificación: si quedara alguna referencia rota, se avisa en el log en vez
  // de dejar la app en un estado inconsistente.
  const violaciones = await knex.raw('PRAGMA foreign_key_check')
  if (violaciones.length) {
    console.error('[migración 027] violaciones de FK detectadas:', violaciones)
  }
}

export async function down(knex) {
  // Restaura el UNIQUE de `codigo` tomando los datos de `productos_backup`.
  // Falla si ya existen códigos duplicados (habría que resolverlos a mano).
  // `productos_backup` NO se elimina: es el respaldo permanente del sistema.
  const fkEstadoOriginal = await leerPragma(knex, 'foreign_keys')
  try {
    await knex.raw('PRAGMA foreign_keys = OFF')
    await knex.raw(`
      CREATE TABLE productos_restaurada (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo          TEXT NOT NULL UNIQUE,
        descripcion     TEXT NOT NULL,
        categoria_id    INTEGER NULL REFERENCES categorias(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        precio          NUMERIC(12,2) NOT NULL CHECK (precio >= 0),
        existencia      INTEGER NOT NULL DEFAULT 0 CHECK (existencia >= 0),
        activo          INTEGER NOT NULL DEFAULT 1,
        created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        stock_minimo    INTEGER NOT NULL DEFAULT 3 CHECK (stock_minimo >= 0),
        precio_con_iva  NUMERIC(12,2) NOT NULL DEFAULT 0
      )
    `)
    await knex.raw(
      `INSERT INTO productos_restaurada (${LISTA_COLUMNAS}) SELECT ${LISTA_COLUMNAS} FROM productos_backup`
    )
    await knex.raw('DROP TABLE productos')
    await knex.raw('ALTER TABLE productos_restaurada RENAME TO productos')
    await knex.raw('CREATE INDEX idx_productos_categoria ON productos(categoria_id)')
    await knex.raw('CREATE INDEX idx_productos_activo ON productos(activo)')
  } finally {
    await knex.raw(`PRAGMA foreign_keys = ${fkEstadoOriginal === 0 ? 'OFF' : 'ON'}`)
  }
}
