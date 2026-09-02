import * as m001 from './001_create_usuarios.js'
import * as m002 from './002_create_config_empresa.js'
import * as m003 from './003_create_categorias.js'
import * as m004 from './004_create_productos.js'
import * as m005 from './005_create_clientes.js'
import * as m006 from './006_create_metodos_pago.js'
import * as m007 from './007_create_config_impresora_fiscal.js'
import * as m008 from './008_create_sesiones_caja.js'
import * as m009 from './009_create_entradas_stock.js'
import * as m010 from './010_create_ventas.js'
import * as m011 from './011_create_venta_items.js'
import * as m012 from './012_create_cierres_fiscales_z.js'
import * as m013 from './013_create_proveedores.js'
import * as m014 from './014_add_stock_minimo_productos.js'
import * as m015 from './015_drop_icono_categorias.js'
import * as m016 from './016_add_contacto_clientes.js'
import * as m017 from './017_drop_color_categorias.js'
import * as m018 from './018_create_bancos.js'
import * as m019 from './019_add_banco_to_ventas.js'
import * as m020 from './020_make_categoria_opcional_productos.js'
import * as m021 from './021_update_config_empresa_datos_reales.js'

// Lista ordenada y estática: Knex escanea directorios por defecto con
// fs.readdirSync + require() dinámico, que Rollup no puede resolver dentro
// del bundle empaquetado en el .asar. Este migration source evita el
// escaneo de filesystem en tiempo de ejecución.
const MIGRATIONS = [
  { name: '001_create_usuarios.js', module: m001 },
  { name: '002_create_config_empresa.js', module: m002 },
  { name: '003_create_categorias.js', module: m003 },
  { name: '004_create_productos.js', module: m004 },
  { name: '005_create_clientes.js', module: m005 },
  { name: '006_create_metodos_pago.js', module: m006 },
  { name: '007_create_config_impresora_fiscal.js', module: m007 },
  { name: '008_create_sesiones_caja.js', module: m008 },
  { name: '009_create_entradas_stock.js', module: m009 },
  { name: '010_create_ventas.js', module: m010 },
  { name: '011_create_venta_items.js', module: m011 },
  { name: '012_create_cierres_fiscales_z.js', module: m012 },
  { name: '013_create_proveedores.js', module: m013 },
  { name: '014_add_stock_minimo_productos.js', module: m014 },
  { name: '015_drop_icono_categorias.js', module: m015 },
  { name: '016_add_contacto_clientes.js', module: m016 },
  { name: '017_drop_color_categorias.js', module: m017 },
  { name: '018_create_bancos.js', module: m018 },
  { name: '019_add_banco_to_ventas.js', module: m019 },
  { name: '020_make_categoria_opcional_productos.js', module: m020 },
  { name: '021_update_config_empresa_datos_reales.js', module: m021 }
]

export const migrationSource = {
  getMigrations() {
    return Promise.resolve(MIGRATIONS)
  },
  getMigrationName(migration) {
    return migration.name
  },
  getMigration(migration) {
    return migration.module
  }
}
