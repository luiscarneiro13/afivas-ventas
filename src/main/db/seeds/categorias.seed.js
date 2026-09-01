// Migra CATEGORIES de src/renderer/src/data/dummy.js tal cual.
const CATEGORIES = {
  Accesorios: { icon: 'phone', color: '#5d3fd3' },
  Bazar: { icon: 'gift', color: '#f59e0b' },
  Juegos: { icon: 'layers', color: '#e11d48' },
  Papelería: { icon: 'edit', color: '#10b981' },
  'Cuidado Personal': { icon: 'droplet', color: '#0ea5e9' },
  Decoración: { icon: 'image', color: '#8b5cf6' },
  Bisutería: { icon: 'circle', color: '#db2777' }
}

export async function seedCategorias(knex) {
  const count = await knex('categorias').count({ c: '*' }).first()
  if (Number(count.c) > 0) return

  const rows = Object.entries(CATEGORIES).map(([nombre, { icon, color }]) => ({
    nombre,
    icono: icon,
    color
  }))
  await knex('categorias').insert(rows)
}
