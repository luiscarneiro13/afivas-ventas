import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@renderer/stores/auth'
import { useCajaStore } from '@renderer/stores/caja'

import LoginView from '@renderer/views/LoginView.vue'
import CajaView from '@renderer/views/CajaView.vue'
import AppLayout from '@renderer/components/layout/AppLayout.vue'
import VentaView from '@renderer/views/VentaView.vue'
import ProductosView from '@renderer/views/ProductosView.vue'
import EntradaView from '@renderer/views/EntradaView.vue'
import ReportesView from '@renderer/views/ReportesView.vue'
import ConfiguracionView from '@renderer/views/ConfiguracionView.vue'
import ConfiguracionMaquinaFiscalView from '@renderer/views/ConfiguracionMaquinaFiscalView.vue'
import ConfiguracionCategoriasView from '@renderer/views/ConfiguracionCategoriasView.vue'
import ConfiguracionProveedoresView from '@renderer/views/ConfiguracionProveedoresView.vue'
import ConfiguracionClientesView from '@renderer/views/ConfiguracionClientesView.vue'
import ConfiguracionUsuariosView from '@renderer/views/ConfiguracionUsuariosView.vue'
import FiscalizacionView from '@renderer/views/FiscalizacionView.vue'

const routes = [
  { path: '/login', name: 'login', component: LoginView },
  { path: '/caja', name: 'caja', component: CajaView, meta: { requiresAuth: true } },
  {
    path: '/',
    component: AppLayout,
    meta: { requiresAuth: true, requiresCaja: true },
    children: [
      { path: '', redirect: { name: 'venta' } },
      { path: 'venta', name: 'venta', component: VentaView, meta: { title: 'Venta' } },
      {
        path: 'configuracion/productos',
        name: 'productos',
        component: ProductosView,
        meta: { title: 'Configuración · Productos' }
      },
      { path: 'entrada', name: 'entrada', component: EntradaView, meta: { title: 'Carga de Inventario' } },
      { path: 'reportes', name: 'reportes', component: ReportesView, meta: { title: 'Gráficas' } },
      { path: 'configuracion', name: 'configuracion', component: ConfiguracionView, meta: { title: 'Configuración' } },
      {
        path: 'configuracion/maquina-fiscal',
        name: 'configuracion-maquina-fiscal',
        component: ConfiguracionMaquinaFiscalView,
        meta: { title: 'Configuración · Máquina fiscal' }
      },
      {
        path: 'configuracion/categorias',
        name: 'configuracion-categorias',
        component: ConfiguracionCategoriasView,
        meta: { title: 'Configuración · Categorías de productos' }
      },
      {
        path: 'configuracion/proveedores',
        name: 'configuracion-proveedores',
        component: ConfiguracionProveedoresView,
        meta: { title: 'Configuración · Proveedores' }
      },
      {
        path: 'configuracion/clientes',
        name: 'configuracion-clientes',
        component: ConfiguracionClientesView,
        meta: { title: 'Configuración · Clientes' }
      },
      {
        path: 'configuracion/usuarios',
        name: 'configuracion-usuarios',
        component: ConfiguracionUsuariosView,
        meta: { title: 'Configuración · Usuarios' }
      },
      {
        path: 'fiscalizacion',
        name: 'fiscalizacion',
        component: FiscalizacionView,
        meta: { title: 'Fiscalización' }
      }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/login' }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  const caja = useCajaStore()

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'login' }
  }
  if (to.meta.requiresCaja && !caja.abierta) {
    return { name: 'caja' }
  }
  if (to.name === 'login' && auth.isLoggedIn) {
    return caja.abierta ? { name: 'venta' } : { name: 'caja' }
  }
  return true
})

export default router
