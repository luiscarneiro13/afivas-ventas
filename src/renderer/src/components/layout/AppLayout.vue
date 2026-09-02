<script setup>
import { onMounted } from 'vue'
import Sidebar from './Sidebar.vue'
import ContentHeader from './ContentHeader.vue'
import { useCatalogStore } from '@renderer/stores/catalog'
import { useCategoriasStore } from '@renderer/stores/categorias'
import { useSalesStore } from '@renderer/stores/sales'
import { useClientesStore } from '@renderer/stores/clientes'
import { useMetodosPagoStore } from '@renderer/stores/metodosPago'
import { useBancosStore } from '@renderer/stores/bancos'

const catalog = useCatalogStore()
const categorias = useCategoriasStore()
const sales = useSalesStore()
const clientes = useClientesStore()
const metodosPago = useMetodosPagoStore()
const bancos = useBancosStore()

// Carga una sola vez, al entrar a la app, para que Venta/Reportes tengan
// datos reales sin que cada vista repita el fetch. metodosPago debe estar
// listo antes que sales.fetchAll() (mapVenta busca el método por id).
onMounted(async () => {
  await Promise.all([
    categorias.fetchAll(),
    catalog.fetchAll(),
    clientes.fetchAll(),
    metodosPago.fetchAll(),
    bancos.fetchAll()
  ])
  await sales.fetchAll()
})
</script>

<template>
  <div class="app-shell">
    <Sidebar />
    <div class="content">
      <ContentHeader />
      <div class="view">
        <router-view />
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}
.view {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

@media (max-width: 980px) {
  .app-shell {
    flex-direction: column;
    height: auto;
    min-height: 100vh;
  }
}
</style>
