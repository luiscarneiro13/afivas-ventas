<script setup>
import { onMounted } from 'vue'
import Sidebar from './Sidebar.vue'
import ContentHeader from './ContentHeader.vue'
import { useCatalogStore } from '@renderer/stores/catalog'
import { useCategoriasStore } from '@renderer/stores/categorias'
import { useSalesStore } from '@renderer/stores/sales'

const catalog = useCatalogStore()
const categorias = useCategoriasStore()
const sales = useSalesStore()

// Carga una sola vez, al entrar a la app, para que Venta/Reportes tengan
// productos y categorías reales sin que cada vista repita el fetch.
// sales.seed() necesita catalog.products ya cargado (busca productos por
// código), por eso va después del fetchAll y no en LoginView.
onMounted(async () => {
  await categorias.fetchAll()
  await catalog.fetchAll()
  if (!sales.sales.length) sales.seed()
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
