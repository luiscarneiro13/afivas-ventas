<script setup>
import { ref } from 'vue'
import NavCard from '@renderer/components/ui/NavCard.vue'
import BaseButton from '@renderer/components/ui/BaseButton.vue'
import VaciarDatosModal from '@renderer/components/ui/VaciarDatosModal.vue'
import { useAuthStore } from '@renderer/stores/auth'
import { useCatalogStore } from '@renderer/stores/catalog'
import { useSalesStore } from '@renderer/stores/sales'

const auth = useAuthStore()
const catalog = useCatalogStore()
const sales = useSalesStore()

const vaciarOpen = ref(false)

// Tras vaciar, se recargan los catálogos que ya estaban en memoria para que
// no queden datos viejos en pantalla.
async function onVacio() {
  await catalog.fetchAll()
  await sales.fetchAll()
}
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
        <NavCard icon="outbox" label="Descargo de inventario" :to="{ name: 'descargo' }" />
        <NavCard icon="bars" label="Gráficas" :to="{ name: 'reportes' }" />
        <NavCard icon="user" label="Clientes" :to="{ name: 'configuracion-clientes' }" />
        <NavCard icon="dollar" label="Ventas" :to="{ name: 'configuracion-ventas' }" />
      </div>

      <!-- Operación destructiva: solo para administradores y siempre con
           confirmación por contraseña. -->
      <div v-if="auth.rol === 'administrador'" class="zona-peligro">
        <div class="zp-texto">
          <b>Vaciar productos y ventas</b>
          <span>Elimina todos los productos y todas las ventas registradas.</span>
        </div>
        <BaseButton variant="danger" @click="vaciarOpen = true">Vaciar productos y ventas</BaseButton>
      </div>
    </section>

    <section class="config-section">
      <h2 class="section-title">Configuración de sistema</h2>
      <div class="config-grid">
        <NavCard icon="printer" label="Conf. Fiscal" :to="{ name: 'configuracion-maquina-fiscal' }" />
        <NavCard icon="lock" label="Usuarios" :to="{ name: 'configuracion-usuarios' }" />
      </div>
    </section>

    <VaciarDatosModal v-model="vaciarOpen" @vacio="onVacio" />
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
/* Zona de operaciones destructivas: separada de las tarjetas normales para
   que el usuario no la pulse por accidente. */
.zona-peligro {
  margin-top: 20px;
  padding: 14px 16px;
  border: 1px dashed var(--danger);
  border-radius: var(--radius-sm);
  background: rgba(220, 38, 38, 0.04);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.zp-texto {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.zp-texto b {
  font-size: 13.5px;
  color: var(--text);
}
.zp-texto span {
  font-size: 12.5px;
  color: var(--text-muted);
}
</style>
