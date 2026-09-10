<script setup>
import { computed, onMounted, ref } from 'vue'
import { useClientesStore } from '@renderer/stores/clientes'
import { useUiStore } from '@renderer/stores/ui'
import { exportToExcel, importFromExcel, pickExcelFile } from '@renderer/utils/excel'
import AppIcon from '@renderer/components/ui/AppIcon.vue'
import BaseButton from '@renderer/components/ui/BaseButton.vue'
import EmptyState from '@renderer/components/ui/EmptyState.vue'
import ConfirmModal from '@renderer/components/ui/ConfirmModal.vue'
import ClienteModal from '@renderer/components/productos/ClienteModal.vue'

const clientes = useClientesStore()
const ui = useUiStore()

onMounted(() => clientes.fetchAll())

// El "Cliente Eventual" era un registro del sistema para ventas sin
// cliente registrado; ya no se ofrece en Venta (toda venta requiere un
// cliente real), pero instalaciones existentes pueden conservarlo por
// las facturas históricas que ya lo referencian — no se administra desde
// este CRUD.
const clientesVisibles = computed(() => clientes.items.filter((c) => !c.es_eventual))

const modalOpen = ref(false)
const clienteEditando = ref(null)

function openCreate() {
  clienteEditando.value = null
  modalOpen.value = true
}
function openEdit(c) {
  clienteEditando.value = c
  modalOpen.value = true
}

const confirmOpen = ref(false)
const clienteAEliminar = ref(null)

function askDelete(c) {
  clienteAEliminar.value = c
  confirmOpen.value = true
}
async function confirmDelete() {
  if (!clienteAEliminar.value) return
  try {
    await clientes.remove(clienteAEliminar.value.id)
    ui.toast('Cliente eliminado', 'info')
  } catch (e) {
    ui.toast(e?.message || 'No se pudo eliminar el cliente', 'error')
  }
  clienteAEliminar.value = null
}

const TIPOS_DOCUMENTO_VALIDOS = ['V', 'E', 'J', 'G', 'P']

const CLIENTES_COLUMNS = [
  { key: 'cedula', header: 'Cédula/RIF', width: 16 },
  { key: 'tipo_documento', header: 'Tipo', width: 8 },
  { key: 'nombre', header: 'Nombre', width: 28 },
  { key: 'direccion', header: 'Dirección', width: 30 },
  { key: 'telefono', header: 'Teléfono', width: 16 },
  { key: 'movil', header: 'Móvil', width: 16 },
  { key: 'correo', header: 'Correo', width: 24 }
]

async function exportClientes() {
  if (clientesVisibles.value.length === 0) {
    ui.toast('No hay clientes para exportar', 'error')
    return
  }
  await exportToExcel({
    filename: `clientes_${new Date().toISOString().slice(0, 10)}.xlsx`,
    sheetName: 'Clientes',
    columns: CLIENTES_COLUMNS,
    rows: clientesVisibles.value
  })
  ui.toast('Clientes exportados', 'info')
}

async function importClientes() {
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
    const cedula = String(fila['Cédula/RIF'] ?? '').trim()
    const tipoDocumento = String(fila['Tipo'] ?? '').trim().toUpperCase()
    const nombre = String(fila['Nombre'] ?? '').trim()
    const direccion = String(fila['Dirección'] ?? '').trim()
    const telefono = String(fila['Teléfono'] ?? '').trim()
    const movil = String(fila['Móvil'] ?? '').trim()
    const correo = String(fila['Correo'] ?? '').trim()

    if (!cedula || !nombre) {
      errores.push(`Fila con cédula "${cedula || '(vacío)'}": faltan datos obligatorios`)
      continue
    }
    if (!TIPOS_DOCUMENTO_VALIDOS.includes(tipoDocumento)) {
      errores.push(`Cédula ${cedula}: el tipo de documento "${tipoDocumento || '(vacío)'}" no es válido`)
      continue
    }

    try {
      const existente = clientesVisibles.value.find((c) => c.cedula === cedula)
      if (existente) {
        await clientes.update(existente.id, { nombre, direccion, telefono, movil, correo, tipoDocumento })
        actualizados++
      } else {
        await clientes.create({ cedula, tipoDocumento, nombre, direccion, telefono, movil, correo })
        creados++
      }
    } catch (e) {
      errores.push(`Cédula ${cedula}: ${e?.message || 'error al guardar'}`)
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
      <h2 class="vt-title">Clientes</h2>
      <div class="vt-actions">
        <BaseButton variant="ghost" size="sm" @click="exportClientes">
          <AppIcon name="excel" :size="15" />
          Exportar
        </BaseButton>
        <BaseButton variant="ghost" size="sm" @click="importClientes">
          <AppIcon name="excel" :size="15" />
          Importar
        </BaseButton>
        <BaseButton variant="primary" size="sm" @click="openCreate">
          <AppIcon name="plus" :size="14" />
          Nuevo cliente
        </BaseButton>
      </div>
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Cédula / RIF</th>
            <th>Dirección</th>
            <th>Teléfono</th>
            <th>Móvil</th>
            <th>Correo</th>
            <th></th>
          </tr>
        </thead>
        <tbody v-if="clientesVisibles.length">
          <tr v-for="c in clientesVisibles" :key="c.id">
            <td><b>{{ c.nombre }}</b></td>
            <td class="num">{{ c.tipo_documento }}-{{ c.cedula }}</td>
            <td>{{ c.direccion || '—' }}</td>
            <td>{{ c.telefono || '—' }}</td>
            <td>{{ c.movil || '—' }}</td>
            <td>{{ c.correo || '—' }}</td>
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
            <td colspan="7">
              <EmptyState icon="user" title="Sin clientes" subtitle="Crea el primer cliente" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ClienteModal v-model="modalOpen" :cliente="clienteEditando" />
    <ConfirmModal
      v-model="confirmOpen"
      :title="clienteAEliminar ? `¿Eliminar &quot;${clienteAEliminar.nombre}&quot;?` : '¿Eliminar cliente?'"
      text="Esta acción eliminará el cliente de forma permanente y no se puede deshacer."
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
  min-width: 860px;
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
