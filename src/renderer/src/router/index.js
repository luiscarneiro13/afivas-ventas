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
      { path: 'productos', name: 'productos', component: ProductosView, meta: { title: 'Productos' } },
      { path: 'entrada', name: 'entrada', component: EntradaView, meta: { title: 'Entrada de Productos' } },
      { path: 'reportes', name: 'reportes', component: ReportesView, meta: { title: 'Reportes' } }
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
