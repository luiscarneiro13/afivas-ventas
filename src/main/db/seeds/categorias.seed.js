// Incluye las categorías demo originales (referenciadas por
// productos.seed.js) más las familias de inventario reales del negocio
// (tomadas del sistema fiscal previo) — sin duplicar los nombres que ya
// coinciden entre ambos conjuntos (Accesorios, Papelería, Bisutería).
const CATEGORIES = [
  'Accesorios',
  'Bazar',
  'Juegos',
  'Papelería',
  'Cuidado Personal',
  'Decoración',
  'Bisutería',
  'Maquillaje',
  'Skincare',
  'Combos y Promociones',
  'Manicura',
  'Cabellos',
  'Perfumes y Cremas',
  'Anime'
]

export async function seedCategorias(knex) {
  const count = await knex('categorias').count({ c: '*' }).first()
  if (Number(count.c) > 0) return

  const rows = CATEGORIES.map((nombre) => ({ nombre }))
  await knex('categorias').insert(rows)
}
