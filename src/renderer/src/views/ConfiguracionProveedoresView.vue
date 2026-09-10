<script setup>
import { ref, onMounted } from 'vue'
import { useProveedoresStore } from '@renderer/stores/proveedores'
import { useUiStore } from '@renderer/stores/ui'
import AppIcon from '@renderer/components/ui/AppIcon.vue'
import BaseButton from '@renderer/components/ui/BaseButton.vue'
import EmptyState from '@renderer/components/ui/EmptyState.vue'
import ConfirmModal from '@renderer/components/ui/ConfirmModal.vue'
import ProveedorModal from '@renderer/components/productos/ProveedorModal.vue'
import { exportToExcel, importFromExcel, pickExcelFile } from '@renderer/utils/excel'

const proveedores = useProveedoresStore()
const ui = useUiStore()

onMounted(() => proveedores.fetchAll())

const modalOpen = ref(false)
const proveedorEditando = ref(null)

function openCreate() {
  proveedorEditando.value = null
  modalOpen.value = true
}
function openEdit(p) {
  proveedorEditando.value = p
  modalOpen.value = true
}

const confirmOpen = ref(false)
const proveedorAEliminar = ref(null)

function askDelete(p) {
  proveedorAEliminar.value = p
  confirmOpen.value = true
}
async function confirmDelete() {
  if (!proveedorAEliminar.value) return
  try {
    await proveedores.remove(proveedorAEliminar.value.id)
    ui.toast('Proveedor eliminado', 'info')
  } catch (e) {
    ui.toast(e?.message || 'No se pudo eliminar el proveedor', 'error')
  }
  proveedorAEliminar.value = null
}

const PROVEEDORES_COLUMNS = [
  { key: 'nombre', header: 'Nombre', width: 28 },
  { key: 'rif', header: 'RIF', width: 16 },
  { key: 'telefono', header: 'Teléfono', width: 16 },
  { key: 'contacto', header: 'Contacto', width: 20 }
]

async function exportProveedores() {
  if (proveedores.items.length === 0) {
    ui.toast('No hay proveedores para exportar', 'error')
    return
  }
  await exportToExcel({
    filename: `proveedores_${new Date().toISOString().slice(0, 10)}.xlsx`,
    sheetName: 'Proveedores',
    columns: PROVEEDORES_COLUMNS,
    rows: proveedores.items
  })
  ui.toast('Proveedores exportados', 'info')
}

async function importProveedores() {
  const file = await pickExcelFile()
  if (!file) return
  let filas
  try {
    filas = await importFromExcel(file)
  } catch (e) {
    ui.toast('No se pudo leer el archivo: ' + (e?.message || 'archivo inválido'), 'error')
    return
  }
  if (filas.length === 0) {
    ui.toast('El archivo no tiene filas para importar', 'error')
    return
  }

  let creados = 0
  let actualizados = 0
  const errores = []
  for (const fila of filas) {
    const nombre = String(fila['Nombre'] ?? '').trim()
    const rif = String(fila['RIF'] ?? '').trim()
    const telefono = String(fila['Teléfono'] ?? '').trim()
    const contacto = String(fila['Contacto'] ?? '').trim()

    if (!nombre) {
      errores.push(`Fila con RIF "${rif || '(vacío)'}": falta el nombre`)
      continue
    }

    let existente = null
    if (rif) {
      existente = proveedores.items.find((p) => p.rif === rif)
    }
    if (!existente) {
      existente = proveedores.items.find((p) => p.nombre.trim().toLowerCase() === nombre.toLowerCase())
    }

    try {
      if (existente) {
        await proveedores.update(existente.id, { nombre, rif, telefono, contacto })
        actualizados++
      } else {
        await proveedores.create({ nombre, rif, telefono, contacto })
        creados++
      }
    } catch (e) {
      errores.push(`${nombre}: ${e?.message || 'error al guardar'}`)
    }
  }

  if (creados || actualizados) {
    ui.toast(`Importación completa: ${creados} creados, ${actualizados} actualizados`, 'info')
  }
  if (errores.length) {
    ui.toast(`${errores.length} fila(s) con errores: ${errores.slice(0, 3).join(' | ')}`, 'error')
  }
}
</script>

<template>
  <div class="view-content">
    <router-link :to="{ name: 'configuracion' }" class="back-link">
      <AppIcon name="chevron" :size="14" />
      Volver a Configuración
    </router-link>

    <div class="view-toolbar">
      <h2 class="vt-title">Proveedores</h2>
      <div class="vt-actions">
        <BaseButton variant="ghost" size="sm" @click="exportProveedores">
          <AppIcon name="excel" :size="15" />
          Exportar
        </BaseButton>
        <BaseButton variant="ghost" size="sm" @click="importProveedores">
          <AppIcon name="excel" :size="15" />
          Importar
        </BaseButton>
        <BaseButton variant="primary" size="sm" @click="openCreate">
          <AppIcon name="plus" :size="14" />
          Nuevo proveedor
        </BaseButton>
      </div>
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Proveedor</th>
            <th>RIF</th>
            <th>Teléfono</th>
            <th>Contacto</th>
            <th></th>
          </tr>
        </thead>
        <tbody v-if="proveedores.items.length">
          <tr v-for="p in proveedores.items" :key="p.id">
            <td><b>{{ p.nombre }}</b></td>
            <td class="num">{{ p.rif || '—' }}</td>
            <td>{{ p.telefono || '—' }}</td>
            <td>{{ p.contacto || '—' }}</td>
            <td>
              <div class="table-actions">
                <button class="icon-btn" title="Editar" @click="openEdit(p)"><AppIcon name="edit" :size="15" /></button>
                <button class="icon-btn danger" title="Eliminar" @click="askDelete(p)"><AppIcon name="trash" :size="15" /></button>
              </div>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="5">
              <EmptyState icon="truck" title="Sin proveedores" subtitle="Crea el primer proveedor" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ProveedorModal v-model="modalOpen" :proveedor="proveedorEditando" />
    <ConfirmModal
      v-model="confirmOpen"
      :title="proveedorAEliminar ? `¿Eliminar &quot;${proveedorAEliminar.nombre}&quot;?` : '¿Eliminar proveedor?'"
      text="El proveedor se desactivará y dejará de estar disponible para nuevas entradas."
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
