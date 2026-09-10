<script setup>
import { ref, onMounted } from 'vue'
import { useDescargosStore } from '@renderer/stores/descargos'
import { useUiStore } from '@renderer/stores/ui'
import AppIcon from '@renderer/components/ui/AppIcon.vue'
import BaseButton from '@renderer/components/ui/BaseButton.vue'
import EmptyState from '@renderer/components/ui/EmptyState.vue'
import DescargoModal from '@renderer/components/productos/DescargoModal.vue'
import { fmtDateTime } from '@renderer/utils/format'
import { exportToExcel } from '@renderer/utils/excel'

const descargos = useDescargosStore()
const ui = useUiStore()

onMounted(() => descargos.fetchAll())

const modalOpen = ref(false)
function openCreate() {
  modalOpen.value = true
}

const DESCARGOS_COLUMNS = [
  { key: 'fecha', header: 'Fecha', width: 20, format: (r) => fmtDateTime(r.fecha) },
  { key: 'codigo', header: 'Código', width: 16 },
  { key: 'desc', header: 'Producto', width: 32 },
  { key: 'cantidad', header: 'Cantidad', width: 12 },
  { key: 'motivo', header: 'Motivo', width: 20 },
  { key: 'nota', header: 'Nota', width: 28 },
  { key: 'usuario', header: 'Usuario', width: 20 }
]

async function exportDescargos() {
  if (descargos.entries.length === 0) {
    ui.toast('No hay descargos para exportar', 'error')
    return
  }
  await exportToExcel({
    filename: `descargos_${new Date().toISOString().slice(0, 10)}.xlsx`,
    sheetName: 'Descargos',
    columns: DESCARGOS_COLUMNS,
    rows: descargos.entries
  })
  ui.toast('Descargos exportados', 'info')
}
</script>

<template>
  <div class="view-content">
    <router-link :to="{ name: 'configuracion' }" class="back-link">
      <AppIcon name="chevron" :size="14" />
      Volver a Configuración
    </router-link>

    <div class="view-toolbar">
      <h2 class="vt-title">Descargo de inventario</h2>
      <div class="vt-actions">
        <BaseButton variant="ghost" size="sm" @click="exportDescargos">
          <AppIcon name="excel" :size="15" />
          Exportar
        </BaseButton>
        <BaseButton variant="primary" size="sm" @click="openCreate">
          <AppIcon name="plus" :size="14" />
          Nuevo descargo
        </BaseButton>
      </div>
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Motivo</th>
            <th>Nota</th>
            <th>Usuario</th>
          </tr>
        </thead>
        <tbody v-if="descargos.entries.length">
          <tr v-for="(d, i) in descargos.entries" :key="i">
            <td class="num">{{ fmtDateTime(d.fecha) }}</td>
            <td>
              <b>{{ d.desc }}</b><br />
              <span class="mono-sub">{{ d.codigo }}</span>
            </td>
            <td class="num qty-out">-{{ d.cantidad }}</td>
            <td>{{ d.motivo }}</td>
            <td>{{ d.nota || '—' }}</td>
            <td>{{ d.usuario }}</td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="6">
              <EmptyState icon="outbox" title="Sin descargos registrados" subtitle="Registra el primer descargo de inventario" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <DescargoModal v-model="modalOpen" />
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
.mono-sub {
  color: var(--text-muted);
  font-size: 11px;
  font-family: 'Roboto Mono', monospace;
}
.qty-out {
  color: var(--danger);
  font-weight: 700;
}
</style>
