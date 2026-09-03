import { seedUsuarios } from './usuarios.seed.js'
import { seedCategorias } from './categorias.seed.js'
import { seedInventarioReal } from './inventarioRealCsv.seed.js'
import { seedClientesReales } from './clientesReales.seed.js'
import { seedMetodosPago } from './metodosPago.seed.js'
import { seedBancos } from './bancos.seed.js'
import { seedConfigEmpresa } from './configEmpresa.seed.js'
import { seedConfigImpresoraFiscal } from './configImpresoraFiscal.seed.js'

// Orden respeta dependencias de FK (categorías antes que productos, etc).
// Cada seed es idempotente por su clave única (onConflict().ignore() o
// chequeo previo por id): en cada arranque puede volver a correr sin
// duplicar lo que ya existe, y agregar filas nuevas a instalaciones viejas.
export async function runSeeds(knex) {
  await seedUsuarios(knex)
  await seedCategorias(knex)
  await seedInventarioReal(knex)
  await seedClientesReales(knex)
  await seedMetodosPago(knex)
  await seedBancos(knex)
  await seedConfigEmpresa(knex)
  await seedConfigImpresoraFiscal(knex)
}
