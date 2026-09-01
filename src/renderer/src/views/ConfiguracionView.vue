<script setup>
import NavCard from '@renderer/components/ui/NavCard.vue'
</script>

<template>
  <div class="view-content">
    <div class="config-grid">
      <NavCard icon="printer" label="Máquina fiscal" :to="{ name: 'configuracion-maquina-fiscal' }" />
      <NavCard icon="inbox" label="Carga de inventario" :to="{ name: 'entrada' }" />
      <NavCard icon="bars" label="Gráficas" :to="{ name: 'reportes' }" />
      <NavCard icon="layers" label="Categorías de productos" :to="{ name: 'configuracion-categorias' }" />
      <NavCard icon="truck" label="Proveedores" :to="{ name: 'configuracion-proveedores' }" />
      <NavCard icon="user" label="Clientes" :to="{ name: 'configuracion-clientes' }" />
    </div>
  </div>
</template>

<style scoped>
.view-content {
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow-y: auto;
  padding: 22px 26px;
}
.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  width: 100%;
}
</style>
