<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useCatalogStore } from '@renderer/stores/catalog'
import { useStockStore } from '@renderer/stores/stock'
import { useAuthStore } from '@renderer/stores/auth'
import { useUiStore } from '@renderer/stores/ui'
import AppIcon from '@renderer/components/ui/AppIcon.vue'
import BaseField from '@renderer/components/ui/BaseField.vue'
import BaseButton from '@renderer/components/ui/BaseButton.vue'
import SearchDropdown from '@renderer/components/ui/SearchDropdown.vue'
import EmptyState from '@renderer/components/ui/EmptyState.vue'
import { digitsFromDecimal, fmtDateTime, fmtUsd, maskDisplay } from '@renderer/utils/format'

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

// Costo pagado por esta mercancía (opcional, solo informativo/margen).
// Misma máscara de centavos que el precio en ProductoModal.vue.
const costoDigits = ref('0')
const costoDisplay = computed(() => maskDisplay(costoDigits.value))
function onInputCosto(e) {
  costoDigits.value = e.target.value.replace(/\D/g, '').slice(0, 10) || '0'
  nextTick(() => {
    const len = e.target.value.length
    e.target.setSelectionRange(len, len)
  })
}

// Actualizar el precio de venta NUNCA es automático: el usuario tiene que
// marcar el checkbox a propósito. El sistema no maneja lotes/costo
// promedio, así que cambiar el precio solo por cargar inventario podría
// alterar ventas sin que nadie lo haya decidido.
const actualizarPrecio = ref(false)
const nuevoPrecioDigits = ref('0')
const nuevoPrecioDisplay = computed(() => maskDisplay(nuevoPrecioDigits.value))
function onInputNuevoPrecio(e) {
  nuevoPrecioDigits.value = e.target.value.replace(/\D/g, '').slice(0, 10) || '0'
  nextTick(() => {
    const len = e.target.value.length
    e.target.setSelectionRange(len, len)
  })
}
function selectAllMoney(e) {
  e.target.select()
}

watch(actualizarPrecio, (on) => {
  if (on && selectedProduct.value) {
    nuevoPrecioDigits.value = digitsFromDecimal(selectedProduct.value.precio)
  }
})

onMounted(() => {
  stock.fetchAll()
  catalog.fetchAll()
})

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
  costoDigits.value = '0'
  actualizarPrecio.value = false
  nuevoPrecioDigits.value = '0'
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

  const costo = costoDigits.value === '0' ? null : Number(costoDigits.value) / 100

  let nuevoPrecio = null
  if (actualizarPrecio.value) {
    nuevoPrecio = Number(nuevoPrecioDigits.value) / 100
    if (isNaN(nuevoPrecio) || nuevoPrecio <= 0) {
      ui.toast('Ingresa un precio de venta válido', 'error')
      return
    }
  }

  const desc = selectedProduct.value.desc
  try {
    await stock.registrarEntrada({
      productoId: selectedProduct.value.id,
      cantidad: cant,
      proveedor: proveedor.value,
      nota: nota.value,
      costo,
      nuevoPrecio,
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
          <div class="info">
            <b>{{ selectedProduct.desc }}</b>
            <span>{{ selectedProduct.codigo }} · Existencia actual: {{ selectedProduct.existencia }}</span>
            <span>Precio de venta actual: {{ fmtUsd(selectedProduct.precio) }}</span>
          </div>
        </div>
        <BaseField label="Cantidad a ingresar">
          <input v-model="cantidad" type="number" min="1" />
        </BaseField>
        <BaseField label="Costo ($) (opcional)">
          <input
            :value="costoDisplay"
            type="text"
            inputmode="numeric"
            @input="onInputCosto"
            @click="selectAllMoney"
          />
        </BaseField>
        <BaseField label="Proveedor">
          <input v-model="proveedor" type="text" placeholder="Ej. Distribuidora Central" />
        </BaseField>
        <BaseField label="Nota (opcional)">
          <input v-model="nota" type="text" placeholder="Ej. Reposición de mercancía" />
        </BaseField>

        <label class="checkbox-row">
          <input v-model="actualizarPrecio" type="checkbox" :disabled="!selectedProduct" />
          Actualizar precio de venta de este producto
        </label>
        <div v-if="actualizarPrecio">
          <BaseField label="Nuevo precio ($)">
            <input
              :value="nuevoPrecioDisplay"
              type="text"
              inputmode="numeric"
              @input="onInputNuevoPrecio"
              @click="selectAllMoney"
            />
          </BaseField>
        </div>

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
                <th>Costo</th>
                <th>Proveedor</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="stock.entries.length === 0">
                <td colspan="6">
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
                <td class="num">{{ e.costo != null ? fmtUsd(e.costo) : '—' }}</td>
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
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.selected-product-box b {
  font-size: 12.5px;
}
.selected-product-box span {
  font-size: 11px;
  color: var(--text-muted);
}
.checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 14px;
  cursor: pointer;
}
.checkbox-row input[type='checkbox'] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}
.field-row {
  display: flex;
  gap: 12px;
}
.field-row > * {
  flex: 1;
  min-width: 0;
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
  min-width: 620px;
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
