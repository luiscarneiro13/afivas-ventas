<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useCatalogStore } from '@renderer/stores/catalog'
import { useCajaStore } from '@renderer/stores/caja'
import { useUiStore } from '@renderer/stores/ui'
import { useCategoriasStore } from '@renderer/stores/categorias'
import AppIcon from '@renderer/components/ui/AppIcon.vue'
import BaseButton from '@renderer/components/ui/BaseButton.vue'
import BaseBadge from '@renderer/components/ui/BaseBadge.vue'
import CatChip from '@renderer/components/ui/CatChip.vue'
import EmptyState from '@renderer/components/ui/EmptyState.vue'
import ConfirmModal from '@renderer/components/ui/ConfirmModal.vue'
import ProductoModal from '@renderer/components/productos/ProductoModal.vue'
import SearchDropdown from '@renderer/components/ui/SearchDropdown.vue'
import { fmtUsd, fmtBs } from '@renderer/utils/format'

const catalog = useCatalogStore()
const caja = useCajaStore()
const ui = useUiStore()
const categorias = useCategoriasStore()

onMounted(() => {
  categorias.fetchAll()
  catalog.fetchAll()
})

const search = ref('')
const catQuery = ref('')
const catFilter = ref('Todos')

const catItems = computed(() => {
  const q = catQuery.value.trim().toLowerCase()
  return q ? categorias.items.filter((c) => c.nombre.toLowerCase().includes(q)) : categorias.items
})

function selectCategoria(c) {
  catFilter.value = c.nombre
  catQuery.value = c.nombre
}

watch(catQuery, (val) => {
  if (!val.trim()) catFilter.value = 'Todos'
})

const filteredProducts = computed(() => {
  const q = search.value.trim().toLowerCase()
  return catalog.products.filter((p) => {
    const matchCat = catFilter.value === 'Todos' || p.cat === catFilter.value
    const matchQ = !q || p.codigo.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
    return matchCat && matchQ
  })
})

function badgeInfo(p) {
  if (p.existencia === 0) return { variant: 'out', text: 'Agotado' }
  if (p.existencia <= 3) return { variant: 'low', text: `Quedan ${p.existencia}` }
  return { variant: 'ok', text: 'En stock' }
}

// Si la categoría del producto fue desactivada/eliminada, catalog.categories
// ya no la incluye — evita que un solo producto así rompa toda la tabla.
function catInfo(catName) {
  return catalog.categories[catName] || { icon: 'box', color: '#9ca3af' }
}

const modalOpen = ref(false)
const productoEditando = ref(null)

function openCreate() {
  productoEditando.value = null
  modalOpen.value = true
}
function openEdit(p) {
  productoEditando.value = p
  modalOpen.value = true
}

const confirmOpen = ref(false)
const productoAEliminar = ref(null)

function askDelete(p) {
  productoAEliminar.value = p
  confirmOpen.value = true
}
async function confirmDelete() {
  if (!productoAEliminar.value) return
  try {
    await catalog.remove(productoAEliminar.value.codigo)
    ui.toast('Producto eliminado', 'info')
  } catch (e) {
    ui.toast(e?.message || 'No se pudo eliminar el producto', 'error')
  }
  productoAEliminar.value = null
}
</script>

<template>
  <div class="view-content">
    <router-link :to="{ name: 'configuracion' }" class="back-link">
      <AppIcon name="chevron" :size="14" />
      Volver a Configuración
    </router-link>

    <div class="view-toolbar">
      <div class="vt-left">
        <div class="searchbar">
          <span class="sicon"><AppIcon name="search" :size="14" /></span>
          <input v-model="search" type="text" placeholder="Buscar producto..." />
        </div>
        <SearchDropdown
          v-model="catQuery"
          class="cat-search"
          placeholder="Buscar categoría..."
          :items="catItems"
          item-key="id"
          show-on-empty-focus
          empty-message="Sin categorías"
          @select="selectCategoria"
        >
          <template #item="{ item }">
            <div class="cat-item">
              <span class="cat-dot" :style="{ background: item.color }">
                <AppIcon :name="item.icono" :size="12" />
              </span>
              <b>{{ item.nombre }}</b>
            </div>
          </template>
        </SearchDropdown>
        <button type="button" class="export-btn" title="Exportar a Excel">
          <AppIcon name="excel" :size="15" />
        </button>
        <button type="button" class="export-btn" title="Exportar a PDF">
          <AppIcon name="pdf" :size="15" />
        </button>
      </div>
      <BaseButton variant="primary" size="sm" @click="openCreate">
        <AppIcon name="plus" :size="14" />
        Nuevo producto
      </BaseButton>
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Precio $</th>
            <th>Precio Bs</th>
            <th>Existencia</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredProducts.length === 0">
            <td colspan="6">
              <EmptyState icon="box" title="Sin productos" subtitle="No se encontraron coincidencias" />
            </td>
          </tr>
          <tr v-for="p in filteredProducts" :key="p.codigo">
            <td>
              <div class="prod-cell">
                <div class="ptile-sm" :style="{ background: catInfo(p.cat).color }">
                  <AppIcon :name="catInfo(p.cat).icon" :size="15" />
                </div>
                <div>
                  <b>{{ p.desc }}</b>
                  <span>{{ p.codigo }}</span>
                </div>
              </div>
            </td>
            <td><CatChip :label="p.cat" :color="catInfo(p.cat).color" /></td>
            <td class="num">{{ fmtUsd(p.precio) }}</td>
            <td class="num">{{ fmtBs(p.precio * caja.tasa) }}</td>
            <td><BaseBadge :variant="badgeInfo(p).variant">{{ badgeInfo(p).text }}</BaseBadge></td>
            <td>
              <div class="table-actions">
                <button class="icon-btn" title="Editar" @click="openEdit(p)"><AppIcon name="edit" :size="15" /></button>
                <button class="icon-btn danger" title="Eliminar" @click="askDelete(p)"><AppIcon name="trash" :size="15" /></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ProductoModal v-model="modalOpen" :producto="productoEditando" />
    <ConfirmModal
      v-model="confirmOpen"
      :title="productoAEliminar ? `¿Eliminar &quot;${productoAEliminar.desc}&quot;?` : '¿Eliminar producto?'"
      text="El producto se quitará del catálogo permanentemente."
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
  flex-wrap: wrap;
}
.vt-left {
  display: flex;
  gap: 10px;
  flex: 1;
  min-width: 240px;
}
.vt-left .searchbar {
  flex: 1;
  max-width: 340px;
  align-self: flex-start;
}
.vt-left .cat-search {
  flex: 1;
  max-width: 220px;
  align-self: flex-start;
}
.cat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.cat-dot {
  width: 22px;
  height: 22px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
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
  min-width: 640px;
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
.prod-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.prod-cell .ptile-sm {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.prod-cell b {
  font-size: 12.5px;
  display: block;
}
.prod-cell span {
  font-size: 11px;
  color: var(--text-muted);
  font-family: 'Roboto Mono', monospace;
}
</style>
