import { makeUsuariosRepository } from './usuariosRepository.js'
import { makeCategoriasRepository } from './categoriasRepository.js'
import { makeProveedoresRepository } from './proveedoresRepository.js'
import { makeProductosRepository } from './productosRepository.js'
import { makeClientesRepository } from './clientesRepository.js'
import { makeMetodosPagoRepository } from './metodosPagoRepository.js'
import { makeSesionesCajaRepository } from './sesionesCajaRepository.js'
import { makeEntradasStockRepository } from './entradasStockRepository.js'
import { makeVentasRepository } from './ventasRepository.js'
import { makeConfigEmpresaRepository } from './configEmpresaRepository.js'
import { makeConfigImpresoraRepository } from './configImpresoraRepository.js'
import { makeCierresFiscalesRepository } from './cierresFiscalesRepository.js'

export function makeRepositories(knex) {
  return {
    usuarios: makeUsuariosRepository(knex),
    categorias: makeCategoriasRepository(knex),
    proveedores: makeProveedoresRepository(knex),
    productos: makeProductosRepository(knex),
    clientes: makeClientesRepository(knex),
    metodosPago: makeMetodosPagoRepository(knex),
    sesionesCaja: makeSesionesCajaRepository(knex),
    entradasStock: makeEntradasStockRepository(knex),
    ventas: makeVentasRepository(knex),
    configEmpresa: makeConfigEmpresaRepository(knex),
    configImpresora: makeConfigImpresoraRepository(knex),
    cierresFiscales: makeCierresFiscalesRepository(knex)
  }
}
