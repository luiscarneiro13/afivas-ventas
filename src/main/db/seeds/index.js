import { seedUsuarios } from './usuarios.seed.js'
import { seedCategorias } from './categorias.seed.js'
import { seedProductos } from './productos.seed.js'
import { seedClientes } from './clientes.seed.js'
import { seedMetodosPago } from './metodosPago.seed.js'
import { seedBancos } from './bancos.seed.js'
import { seedConfigEmpresa } from './configEmpresa.seed.js'
import { seedConfigImpresoraFiscal } from './configImpresoraFiscal.seed.js'

// Orden respeta dependencias de FK (categorías antes que productos, etc).
// Cada seed es responsable de no duplicar datos si ya corrió antes.
export async function runSeeds(knex) {
  await seedUsuarios(knex)
  await seedCategorias(knex)
  await seedProductos(knex)
  await seedClientes(knex)
  await seedMetodosPago(knex)
  await seedBancos(knex)
  await seedConfigEmpresa(knex)
  await seedConfigImpresoraFiscal(knex)
}
