<script setup>
import { ref, onMounted } from 'vue'
import { useCategoriasStore } from '@renderer/stores/categorias'
import { useUiStore } from '@renderer/stores/ui'
import AppIcon from '@renderer/components/ui/AppIcon.vue'
import BaseButton from '@renderer/components/ui/BaseButton.vue'
import EmptyState from '@renderer/components/ui/EmptyState.vue'
import ConfirmModal from '@renderer/components/ui/ConfirmModal.vue'
import CategoriaModal from '@renderer/components/productos/CategoriaModal.vue'

const categorias = useCategoriasStore()
const ui = useUiStore()

onMounted(() => categorias.fetchAll())

const modalOpen = ref(false)
const categoriaEditando = ref(null)

function openCreate() {
  categoriaEditando.value = null
  modalOpen.value = true
}
function openEdit(c) {
  categoriaEditando.value = c
  modalOpen.value = true
}

const confirmOpen = ref(false)
const categoriaAEliminar = ref(null)

function askDelete(c) {
  categoriaAEliminar.value = c
  confirmOpen.value = true
}
async function confirmDelete() {
  if (!categoriaAEliminar.value) return
  try {
    await categorias.remove(categoriaAEliminar.value.id)
    ui.toast('Categoría eliminada', 'info')
  } catch (e) {
    ui.toast(e?.message || 'No se pudo eliminar la categoría', 'error')
  }
  categoriaAEliminar.value = null
}
</script>

<template>
  <div class="view-content">
    <router-link :to="{ name: 'configuracion' }" class="back-link">
      <AppIcon name="chevron" :size="14" />
      Volver a Configuración
    </router-link>

    <div class="view-toolbar">
      <h2 class="vt-title">Categorías de productos</h2>
      <div class="vt-actions">
        <BaseButton variant="ghost" size="sm">
          <AppIcon name="excel" :size="15" />
          Exportar
        </BaseButton>
        <BaseButton variant="ghost" size="sm">
          <AppIcon name="excel" :size="15" />
          Importar
        </BaseButton>
        <BaseButton variant="primary" size="sm" @click="openCreate">
          <AppIcon name="plus" :size="14" />
          Nueva categoría
        </BaseButton>
      </div>
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Categoría</th>
            <th>Color</th>
            <th></th>
          </tr>
        </thead>
        <tbody v-if="categorias.items.length">
          <tr v-for="c in categorias.items" :key="c.id">
            <td>
              <div class="cat-cell">
                <div class="ctile" :style="{ background: c.color }"></div>
                <b>{{ c.nombre }}</b>
              </div>
            </td>
            <td class="num">{{ c.color }}</td>
            <td>
              <div class="table-actions">
                <button class="icon-btn" title="Editar" @click="openEdit(c)"><AppIcon name="edit" :size="15" /></button>
                <button class="icon-btn danger" title="Eliminar" @click="askDelete(c)"><AppIcon name="trash" :size="15" /></button>
              </div>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="3">
              <EmptyState icon="layers" title="Sin categorías" subtitle="Crea la primera categoría de productos" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <CategoriaModal v-model="modalOpen" :categoria="categoriaEditando" />
    <ConfirmModal
      v-model="confirmOpen"
      :title="categoriaAEliminar ? `¿Eliminar &quot;${categoriaAEliminar.nombre}&quot;?` : '¿Eliminar categoría?'"
      text="La categoría se desactivará y dejará de estar disponible para nuevos productos."
      icon="trash"
      confirm-label="Eliminar"
      @confirm="confirmDelete"
    />
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
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-muted);
  text-decoration: none;
  padding: 6px 4px;
  margin-bottom: 14px;
}
.back-link:hover {
  color: var(--primary);
}
.view-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 18px;
}
.vt-title {
  font-size: 16px;
  font-weight: 700;
}
.vt-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.table-wrap {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  overflow-x: auto;
}
table.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 420px;
}
.data-table th {
  text-align: left;
  padding: 12px 16px;
  background: var(--surface-alt);
  color: var(--text-muted);
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}
.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}
.data-table tr:last-child td {
  border-bottom: none;
}
.data-table tbody tr:hover td {
  background: var(--surface-alt);
}
.cat-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ctile {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.table-actions {
  display: flex;
  gap: 6px;
}
.icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  background: var(--surface-alt);
  border: 1px solid var(--border);
  transition: 0.15s;
  flex-shrink: 0;
}
.icon-btn:hover {
  background: var(--primary-light);
  color: var(--primary);
}
.icon-btn.danger:hover {
  background: var(--danger-light);
  color: var(--danger);
}
</style>
