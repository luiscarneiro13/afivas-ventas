<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSalesStore } from '@renderer/stores/sales'
import { useCajaStore } from '@renderer/stores/caja'
import { fmtUsd, fmtBs, fmtDateTime, isSameDay } from '@renderer/utils/format'
import AppIcon from '@renderer/components/ui/AppIcon.vue'
import StatCard from '@renderer/components/ui/StatCard.vue'
import EmptyState from '@renderer/components/ui/EmptyState.vue'
import FacturaModal from '@renderer/components/shared/FacturaModal.vue'

const salesStore = useSalesStore()
const caja = useCajaStore()

const todaySales = computed(() => salesStore.sales.filter((s) => isSameDay(s.fecha, new Date())))
const ventasHoy = computed(() => todaySales.value.reduce((a, s) => a + s.total, 0))
const facturasHoy = computed(() => todaySales.value.length)
const ticketProm = computed(() => (facturasHoy.value ? ventasHoy.value / facturasHoy.value : 0))

// Agregado en SQL (ver ventas:topProducto) en vez de sumar en memoria sobre
// todas las ventas — evita tener que cargar los items de cada una.
const topProduct = ref({ producto: null, qty: 0 })
async function loadTopProduct() {
  const row = await window.api?.ventasTopProducto?.()
  topProduct.value = row
    ? { producto: { desc: row.descripcion }, qty: Number(row.cantidad) }
    : { producto: null, qty: 0 }
}

const chartDays = computed(() => {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const total = salesStore.sales
      .filter((s) => isSameDay(s.fecha, d))
      .reduce((a, s) => a + s.total, 0)
    days.push({ d, total })
  }
  const max = Math.max(...days.map((x) => x.total), 1)
  return days.map((x) => ({
    total: x.total,
    label: x.d.toLocaleDateString('es-VE', { weekday: 'short' }).replace('.', ''),
    height: Math.max((x.total / max) * 100, 2)
  }))
})

const lastSales = computed(() => [...salesStore.sales].sort((a, b) => b.fecha - a.fecha).slice(0, 10))

const facturaOpen = ref(false)
const selectedSale = ref(null)

async function openSale(sale) {
  // La lista (para la tabla) no trae los items — se piden al detalle solo
  // cuando el usuario realmente quiere ver esa factura.
  const detalle = await salesStore.fetchDetalle(sale.numero)
  if (!detalle) return
  selectedSale.value = detalle
  facturaOpen.value = true
}

onMounted(async () => {
  await salesStore.fetchAll()
  await loadTopProduct()
})
</script>

<template>
  <div class="view-content">
    <router-link :to="{ name: 'configuracion' }" class="back-link">
      <AppIcon name="chevron" :size="14" />
      Volver a Configuración
    </router-link>

    <div class="stats-grid">
      <StatCard
        label="Ventas de hoy"
        :value="fmtUsd(ventasHoy)"
        :sub="fmtBs(ventasHoy * caja.tasa)"
        icon="dollar"
        icon-bg="var(--primary-light)"
        icon-color="var(--primary)"
      />
      <StatCard
        label="Facturas de hoy"
        :value="String(facturasHoy)"
        sub="Ventas registradas hoy"
        icon="filetext"
        icon-bg="var(--success-light)"
        icon-color="var(--success)"
      />
      <StatCard
        label="Ticket promedio"
        :value="fmtUsd(ticketProm)"
        sub="Por factura, hoy"
        icon="trending"
        icon-bg="var(--warning-light)"
        icon-color="var(--warning)"
      />
      <StatCard
        label="Producto más vendido"
        :value="topProduct.producto ? topProduct.producto.desc : '—'"
        :sub="topProduct.producto ? `${topProduct.qty} unidades vendidas` : 'Aún sin ventas'"
        icon="award"
        icon-bg="#fce7f3"
        icon-color="#db2777"
      />
    </div>

    <div class="chart-card">
      <h3>Ventas de los últimos 7 días</h3>
      <p>Total facturado por día ($)</p>
      <div class="chart-bars">
        <div v-for="(day, idx) in chartDays" :key="idx" class="chart-bar-col">
          <span class="bv num">{{ day.total > 0 ? '$' + day.total.toFixed(0) : '' }}</span>
          <div class="chart-bar" :style="{ height: day.height + '%' }"></div>
          <span class="bl">{{ day.label }}</span>
        </div>
      </div>
    </div>

    <div class="section-title">Últimas facturas</div>
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Factura</th>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Items</th>
            <th>Total</th>
            <th>Método</th>
          </tr>
        </thead>
        <tbody v-if="lastSales.length">
          <tr v-for="sale in lastSales" :key="sale.numero" @click="openSale(sale)">
            <td class="num">#{{ String(sale.numero).padStart(6, '0') }}</td>
            <td class="num">{{ fmtDateTime(sale.fecha) }}</td>
            <td>{{ sale.cliente.nombre }}</td>
            <td>{{ sale.itemsCount }}</td>
            <td class="num" style="font-weight: 700">{{ fmtUsd(sale.total) }}</td>
            <td><span class="badge ok">{{ sale.method.label }}</span></td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="6">
              <EmptyState icon="filetext" title="Sin facturas" subtitle="Aún no se han registrado ventas" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <FacturaModal v-model="facturaOpen" :sale="selectedSale" />
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
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.chart-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px 22px;
  margin-bottom: 20px;
  box-shadow: var(--shadow-sm);
}
.chart-card h3 {
  font-size: 14.5px;
  font-weight: 700;
  margin-bottom: 2px;
}
.chart-card p {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 6px;
}
.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 14px;
  height: 170px;
  margin-top: 18px;
  padding: 0 4px;
}
.chart-bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  gap: 8px;
}
.chart-bar-col .bv {
  font-size: 10.5px;
  font-weight: 700;
  color: var(--text);
}
.chart-bar {
  width: 100%;
  max-width: 34px;
  border-radius: 8px 8px 3px 3px;
  background: linear-gradient(180deg, var(--accent), var(--primary));
  transition: 0.4s;
  min-height: 4px;
}
.chart-bar-col .bl {
  font-size: 10.5px;
  color: var(--text-muted);
  font-weight: 600;
}

.section-title {
  font-size: 14.5px;
  font-weight: 700;
  margin-bottom: 12px;
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
.data-table tbody tr {
  cursor: pointer;
}

.badge {
  font-size: 10px;
  font-weight: 700;
  padding: 3px 7px;
  border-radius: 999px;
  white-space: nowrap;
}
.badge.ok {
  background: var(--success-light);
  color: var(--success);
}
</style>
