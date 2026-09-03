// Familias de inventario reales del negocio (tomadas del sistema fiscal
// previo, ver inventarioRealCsv.seed.js) más algunas categorías generales
// de resguardo para clasificar productos futuros fuera de ese catálogo.
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
  const rows = CATEGORIES.map((nombre) => ({ nombre }))
  await knex('categorias').insert(rows).onConflict('nombre').ignore()
}
