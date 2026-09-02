<script setup>
import NavCard from '@renderer/components/ui/NavCard.vue'
</script>

<template>
  <div class="view-content">
    <section class="config-section">
      <h2 class="section-title">Operaciones</h2>
      <div class="config-grid">
        <NavCard icon="box" label="Productos" :to="{ name: 'productos' }" />
        <NavCard icon="layers" label="Categorías de productos" :to="{ name: 'configuracion-categorias' }" />
        <NavCard icon="truck" label="Proveedores" :to="{ name: 'configuracion-proveedores' }" />
        <NavCard icon="inbox" label="Carga de inventario" :to="{ name: 'entrada' }" />
        <NavCard icon="bars" label="Gráficas" :to="{ name: 'reportes' }" />
        <NavCard icon="user" label="Clientes" :to="{ name: 'configuracion-clientes' }" />
        <NavCard icon="dollar" label="Ventas" :to="{ name: 'configuracion-ventas' }" />
      </div>
    </section>

    <section class="config-section">
      <h2 class="section-title">Configuración de sistema</h2>
      <div class="config-grid">
        <NavCard icon="printer" label="Máquina fiscal" :to="{ name: 'configuracion-maquina-fiscal' }" />
        <NavCard icon="lock" label="Usuarios" :to="{ name: 'configuracion-usuarios' }" />
      </div>
    </section>
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
.config-section {
  margin-bottom: 28px;
}
.config-section:last-child {
  margin-bottom: 0;
}
.section-title {
  font-size: 14.5px;
  font-weight: 700;
  margin-bottom: 12px;
}
.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  width: 100%;
}
</style>
