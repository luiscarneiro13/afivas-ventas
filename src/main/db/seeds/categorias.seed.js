// Migra CATEGORIES de src/renderer/src/data/dummy.js tal cual (sin icono:
// las categorías ya no llevan ícono).
const CATEGORIES = {
  Accesorios: { color: '#5d3fd3' },
  Bazar: { color: '#f59e0b' },
  Juegos: { color: '#e11d48' },
  Papelería: { color: '#10b981' },
  'Cuidado Personal': { color: '#0ea5e9' },
  Decoración: { color: '#8b5cf6' },
  Bisutería: { color: '#db2777' }
}

export async function seedCategorias(knex) {
  const count = await knex('categorias').count({ c: '*' }).first()
  if (Number(count.c) > 0) return

  const rows = Object.entries(CATEGORIES).map(([nombre, { color }]) => ({
    nombre,
    color
  }))
  await knex('categorias').insert(rows)
}
