// Migra PRODUCTS_SEED de src/renderer/src/data/dummy.js, resolviendo `cat`
// (nombre de categoría) a `categoria_id` por join contra la tabla categorias.
const PRODUCTS_SEED = [
  { codigo: 'AA0001', desc: 'Protector celular contra agua', cat: 'Accesorios', existencia: 15, precio: 8.5 },
  { codigo: 'AA0002', desc: 'Soporte celular para silla', cat: 'Accesorios', existencia: 22, precio: 5.0 },
  { codigo: 'AA0003', desc: 'Popsockets diseño surtido', cat: 'Accesorios', existencia: 3, precio: 4.25 },
  { codigo: 'AA0004', desc: 'Cajita de curitas Sanrio', cat: 'Bazar', existencia: 40, precio: 2.1 },
  { codigo: 'AA0005', desc: 'Cartas de UNO', cat: 'Juegos', existencia: 2, precio: 4.75 },
  { codigo: 'AA0006', desc: 'Sellos escolares surtidos', cat: 'Bazar', existencia: 30, precio: 1.5 },
  { codigo: 'AA0007', desc: 'Correctores sencillos', cat: 'Papelería', existencia: 18, precio: 1.2 },
  { codigo: 'AA0008', desc: 'Correctores forma de muñecos', cat: 'Papelería', existencia: 12, precio: 1.8 },
  { codigo: 'AA0009', desc: 'Cera para cabello', cat: 'Cuidado Personal', existencia: 9, precio: 6.0 },
  { codigo: 'AC0001', desc: 'Aceites esenciales relajantes', cat: 'Cuidado Personal', existencia: 14, precio: 7.5 },
  { codigo: 'AC0002', desc: 'Aceite para bebés Baby Finger', cat: 'Cuidado Personal', existencia: 20, precio: 5.25 },
  { codigo: 'AC0003', desc: 'Aceite para cutícula', cat: 'Cuidado Personal', existencia: 16, precio: 3.1 },
  { codigo: 'AC0004', desc: 'Aceite cosmético corporal', cat: 'Cuidado Personal', existencia: 0, precio: 4.4 },
  { codigo: 'AF0001', desc: 'Afiches anime surtidos', cat: 'Decoración', existencia: 25, precio: 2.75 },
  { codigo: 'AF0002', desc: 'Stickers holográficos', cat: 'Decoración', existencia: 37, precio: 1.9 },
  { codigo: 'AN0001', desc: 'Anillos ajustables', cat: 'Bisutería', existencia: 33, precio: 3.0 },
  { codigo: 'AN0002', desc: 'Anillos sencillos', cat: 'Bisutería', existencia: 5, precio: 2.5 },
  { codigo: 'AN0003', desc: 'Anillos de lujo bañados en oro', cat: 'Bisutería', existencia: 3, precio: 9.9 },
  { codigo: 'AN0004', desc: 'Anillos Naruto Akatsuki', cat: 'Bisutería', existencia: 8, precio: 4.6 },
  { codigo: 'AN0005', desc: 'Anillos Genshin Impact', cat: 'Bisutería', existencia: 7, precio: 4.6 },
  { codigo: 'AR0001', desc: 'Argollas largas', cat: 'Bisutería', existencia: 19, precio: 3.4 },
  { codigo: 'AR0002', desc: 'Argollas con piedras', cat: 'Bisutería', existencia: 2, precio: 5.8 },
  { codigo: 'AR0003', desc: 'Argollas clásicas', cat: 'Bisutería', existencia: 28, precio: 2.9 },
  { codigo: 'AA0010', desc: 'Llavero acrílico personalizado', cat: 'Bazar', existencia: 1, precio: 3.5 }
]

export async function seedProductos(knex) {
  const count = await knex('productos').count({ c: '*' }).first()
  if (Number(count.c) > 0) return

  const categorias = await knex('categorias').select('id', 'nombre')
  const categoriaIdPorNombre = new Map(categorias.map((c) => [c.nombre, c.id]))

  const rows = PRODUCTS_SEED.map((p) => {
    const categoriaId = categoriaIdPorNombre.get(p.cat)
    if (!categoriaId) {
      throw new Error(`Seed de productos: categoría "${p.cat}" no existe (producto ${p.codigo})`)
    }
    return {
      codigo: p.codigo,
      descripcion: p.desc,
      categoria_id: categoriaId,
      precio: p.precio,
      existencia: p.existencia
    }
  })
  await knex('productos').insert(rows)
}
