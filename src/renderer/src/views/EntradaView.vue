<script setup>
import { computed, onMounted, ref } from 'vue'
import { useCatalogStore } from '@renderer/stores/catalog'
import { useStockStore } from '@renderer/stores/stock'
import { useAuthStore } from '@renderer/stores/auth'
import { useUiStore } from '@renderer/stores/ui'
import AppIcon from '@renderer/components/ui/AppIcon.vue'
import BaseField from '@renderer/components/ui/BaseField.vue'
import BaseButton from '@renderer/components/ui/BaseButton.vue'
import SearchDropdown from '@renderer/components/ui/SearchDropdown.vue'
import EmptyState from '@renderer/components/ui/EmptyState.vue'
import { fmtDateTime } from '@renderer/utils/format'

const catalog = useCatalogStore()
const stock = useStockStore()
const auth = useAuthStore()
const ui = useUiStore()

const searchQuery = ref('')
const searchResults = computed(() => catalog.search(searchQuery.value))
const selectedProduct = ref(null)

const cantidad = ref(1)
const proveedor = ref('')
const nota = ref('')

onMounted(() => {
  stock.fetchAll()
  catalog.fetchAll()
})

// Si la categoría del producto fue desactivada/eliminada, catalog.categories
// ya no la incluye — evita que eso rompa la vista.
function catInfo(catName) {
  return catalog.categories[catName] || { color: '#9ca3af' }
}

function selectProduct(item) {
  selectedProduct.value = item
  searchQuery.value = ''
}

function resetForm() {
  selectedProduct.value = null
  searchQuery.value = ''
  cantidad.value = 1
  proveedor.value = ''
  nota.value = ''
}

async function registrar() {
  if (!selectedProduct.value) {
    ui.toast('Selecciona un producto', 'error')
    return
  }
  const cant = parseInt(cantidad.value, 10)
  if (isNaN(cant) || cant <= 0) {
    ui.toast('Ingresa una cantidad válida', 'error')
    return
  }
  const desc = selectedProduct.value.desc
  try {
    await stock.registrarEntrada({
      productoId: selectedProduct.value.id,
      cantidad: cant,
      proveedor: proveedor.value,
      nota: nota.value,
      usuarioId: auth.usuarioId
    })
    ui.toast(`Se agregaron ${cant} unidades a "${desc}"`, 'success')
    resetForm()
  } catch (e) {
    ui.toast(e?.message || 'No se pudo registrar la entrada', 'error')
  }
}
</script>

<template>
  <div class="view-content">
    <router-link :to="{ name: 'configuracion' }" class="back-link">
      <AppIcon name="chevron" :size="14" />
      Volver a Configuración
    </router-link>

    <div class="entrada-grid">
      <div class="card">
        <h3>Registrar entrada</h3>
        <div class="field" style="position: relative">
          <label>Producto</label>
          <SearchDropdown
            v-model="searchQuery"
            placeholder="Buscar por código o nombre..."
            :items="searchResults"
            item-key="codigo"
            empty-message="Sin coincidencias"
            @select="selectProduct"
          >
            <template #item="{ item }">
              <b>{{ item.desc }}</b>
              <span>{{ item.codigo }} · Exist: {{ item.existencia }}</span>
            </template>
          </SearchDropdown>
        </div>
        <div v-if="selectedProduct" class="selected-product-box">
          <div class="ptile-sm" :style="{ background: catInfo(selectedProduct.cat).color }"></div>
          <div class="info">
            <b>{{ selectedProduct.desc }}</b>
            <span>{{ selectedProduct.codigo }} · Existencia actual: {{ selectedProduct.existencia }}</span>
          </div>
        </div>
        <BaseField label="Cantidad a ingresar">
          <input v-model="cantidad" type="number" min="1" />
        </BaseField>
        <BaseField label="Proveedor">
          <input v-model="proveedor" type="text" placeholder="Ej. Distribuidora Central" />
        </BaseField>
        <BaseField label="Nota (opcional)">
          <input v-model="nota" type="text" placeholder="Ej. Reposición de mercancía" />
        </BaseField>
        <BaseButton variant="primary" block @click="registrar">Registrar entrada</BaseButton>
      </div>

      <div class="card">
        <h3>Historial de entradas</h3>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Proveedor</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="stock.entries.length === 0">
                <td colspan="5">
                  <EmptyState icon="inbox" title="Sin entradas registradas" subtitle="Registra la primera entrada de mercancía" />
                </td>
              </tr>
              <tr v-for="(e, i) in stock.entries" :key="i">
                <td class="num">{{ fmtDateTime(e.fecha) }}</td>
                <td>
                  <b>{{ e.desc }}</b><br />
                  <span class="mono-sub">{{ e.codigo }}</span>
                </td>
                <td class="num qty-in">+{{ e.cantidad }}</td>
                <td>{{ e.proveedor }}</td>
                <td>{{ e.usuario }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
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
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-muted);
  text-decoration: none;
  padding: 6px 4px;
}
.back-link:hover {
  color: var(--primary);
}

.entrada-grid {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 20px;
  align-items: start;
}
@media (max-width: 980px) {
  .entrada-grid {
    grid-template-columns: 1fr;
  }
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: var(--shadow-sm);
}
.card h3 {
  font-size: 14.5px;
  font-weight: 700;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.field {
  text-align: left;
  margin-bottom: 14px;
}
.field label {
  display: block;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.selected-product-box {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--primary-light);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  margin-top: 6px;
  margin-bottom: 14px;
}
.selected-product-box .info {
  flex: 1;
  min-width: 0;
}
.selected-product-box b {
  font-size: 12.5px;
  display: block;
}
.selected-product-box span {
  font-size: 11px;
  color: var(--text-muted);
}
.selected-product-box .ptile-sm {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.table-wrap {
  background: var(--surface);
  border-radius: 12px;
  overflow: hidden;
  overflow-x: auto;
}
table.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 560px;
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
.mono-sub {
  color: var(--text-muted);
  font-size: 11px;
  font-family: 'Roboto Mono', monospace;
}
.qty-in {
  color: var(--success);
  font-weight: 700;
}
</style>
