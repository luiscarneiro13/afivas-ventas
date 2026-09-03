<script setup>
import { computed, onMounted, ref } from 'vue'
import { useSalesStore } from '@renderer/stores/sales'
import { useMetodosPagoStore } from '@renderer/stores/metodosPago'
import { useUiStore } from '@renderer/stores/ui'
import AppIcon from '@renderer/components/ui/AppIcon.vue'
import BaseBadge from '@renderer/components/ui/BaseBadge.vue'
import EmptyState from '@renderer/components/ui/EmptyState.vue'
import ConfirmModal from '@renderer/components/ui/ConfirmModal.vue'
import FacturaModal from '@renderer/components/shared/FacturaModal.vue'
import { fmtUsd, fmtDateTime } from '@renderer/utils/format'

const sales = useSalesStore()
const metodosPago = useMetodosPagoStore()
const ui = useUiStore()

onMounted(() => sales.fetchAll())

const search = ref('')
const metodoFilter = ref('Todos')
const estadoFilter = ref('Todos')
const desde = ref('')
const hasta = ref('')

const filteredSales = computed(() => {
  const q = search.value.trim().toLowerCase()
  return sales.sales.filter((v) => {
    const matchQ =
      !q || String(v.numero).includes(q) || v.cliente.nombre.toLowerCase().includes(q)
    const matchMetodo = metodoFilter.value === 'Todos' || v.method.id === metodoFilter.value
    const matchEstado = estadoFilter.value === 'Todos' || v.estado === estadoFilter.value
    const matchDesde = !desde.value || v.fecha >= new Date(`${desde.value}T00:00:00`)
    const matchHasta = !hasta.value || v.fecha <= new Date(`${hasta.value}T23:59:59`)
    return matchQ && matchMetodo && matchEstado && matchDesde && matchHasta
  })
})

const facturaOpen = ref(false)
const selectedSale = ref(null)

async function verDetalles(venta) {
  const detalle = await sales.fetchDetalle(venta.numero)
  if (!detalle) return
  selectedSale.value = detalle
  facturaOpen.value = true
}

const confirmOpen = ref(false)
const ventaAAnular = ref(null)

function askAnular(venta) {
  ventaAAnular.value = venta
  confirmOpen.value = true
}
async function confirmAnular() {
  if (!ventaAAnular.value) return
  try {
    await sales.anular(ventaAAnular.value.id)
    ui.toast('Venta anulada', 'info')
  } catch (e) {
    ui.toast(e?.message || 'No se pudo anular la venta', 'error')
  }
  ventaAAnular.value = null
}
</script>

<template>
  <div class="view-content">
    <router-link :to="{ name: 'configuracion' }" class="back-link">
      <AppIcon name="chevron" :size="14" />
      Volver a Configuración
    </router-link>

    <div class="view-toolbar">
      <h2 class="vt-title">Ventas</h2>
    </div>

    <div class="filters-row">
      <div class="searchbar">
        <span class="sicon"><AppIcon name="search" :size="14" /></span>
        <input v-model="search" type="text" placeholder="Buscar por # factura o cliente..." />
      </div>
      <select v-model="metodoFilter" class="select-sm">
        <option value="Todos">Todos los métodos</option>
        <option v-for="m in metodosPago.items" :key="m.id" :value="m.id">{{ m.label }}</option>
      </select>
      <select v-model="estadoFilter" class="select-sm">
        <option value="Todos">Todos los estados</option>
        <option value="completada">Completadas</option>
        <option value="anulada">Anuladas</option>
      </select>
      <div class="date-field">
        <label>Desde</label>
        <input v-model="desde" type="date" />
      </div>
      <div class="date-field">
        <label>Hasta</label>
        <input v-model="hasta" type="date" />
      </div>
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Factura</th>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Total</th>
            <th>Método</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody v-if="filteredSales.length">
          <tr v-for="venta in filteredSales" :key="venta.numero">
            <td class="num">#{{ String(venta.numero).padStart(8, '0') }}</td>
            <td class="num">{{ fmtDateTime(venta.fecha) }}</td>
            <td>{{ venta.cliente.nombre }}</td>
            <td class="num" style="font-weight: 700">{{ fmtUsd(venta.total) }}</td>
            <td>{{ venta.method.label }}</td>
            <td>
              <BaseBadge :variant="venta.estado === 'anulada' ? 'out' : 'ok'">
                {{ venta.estado === 'anulada' ? 'Anulada' : 'Completada' }}
              </BaseBadge>
            </td>
            <td>
              <div class="table-actions">
                <button class="icon-btn" title="Ver detalles" @click="verDetalles(venta)">
                  <AppIcon name="filetext" :size="15" />
                </button>
                <button
                  v-if="venta.estado !== 'anulada'"
                  class="icon-btn danger"
                  title="Anular"
                  @click="askAnular(venta)"
                >
                  <AppIcon name="x" :size="15" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="7">
              <EmptyState
                icon="filetext"
                :title="sales.sales.length ? 'Sin resultados' : 'Sin ventas'"
                :subtitle="
                  sales.sales.length
                    ? 'No hay ventas que coincidan con esos filtros'
                    : 'Aún no se han registrado ventas'
                "
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <FacturaModal v-model="facturaOpen" :sale="selectedSale" />
    <ConfirmModal
      v-model="confirmOpen"
      :title="ventaAAnular ? `¿Anular la factura #${String(ventaAAnular.numero).padStart(8, '0')}?` : '¿Anular venta?'"
      text="Se restaurará la existencia de los productos de esta venta. La factura queda marcada como anulada, no se elimina."
      icon="x"
      confirm-label="Anular"
      @confirm="confirmAnular"
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
.filters-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}
.filters-row .searchbar {
  flex: 1;
  max-width: 280px;
}
.filters-row .select-sm {
  max-width: 190px;
}
.date-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.date-field label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.date-field input[type='date'] {
  height: 42px;
  padding: 0 13px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  font-size: 13px;
  color: var(--text);
}
.date-field input[type='date']:focus {
  outline: none;
  border-color: var(--primary);
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
  min-width: 720px;
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
</style>
