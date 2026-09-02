<script setup>
import { computed, onMounted, ref } from 'vue'
import { useClientesStore } from '@renderer/stores/clientes'
import { useUiStore } from '@renderer/stores/ui'
import AppIcon from '@renderer/components/ui/AppIcon.vue'
import BaseButton from '@renderer/components/ui/BaseButton.vue'
import EmptyState from '@renderer/components/ui/EmptyState.vue'
import ConfirmModal from '@renderer/components/ui/ConfirmModal.vue'
import ClienteModal from '@renderer/components/productos/ClienteModal.vue'

const clientes = useClientesStore()
const ui = useUiStore()

onMounted(() => clientes.fetchAll())

// El "Cliente Eventual" es un registro del sistema (ventas sin cliente
// registrado), no se administra desde este CRUD.
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
            <th>Teléfono</th>
            <th></th>
          </tr>
        </thead>
        <tbody v-if="clientesVisibles.length">
          <tr v-for="c in clientesVisibles" :key="c.id">
            <td><b>{{ c.nombre }}</b></td>
            <td class="num">{{ c.tipo_documento }}-{{ c.cedula }}</td>
            <td>{{ c.telefono || '—' }}</td>
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
            <td colspan="4">
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
      text="El cliente se desactivará y dejará de estar disponible para nuevas ventas."
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
  min-width: 480px;
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
