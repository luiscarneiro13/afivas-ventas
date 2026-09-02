<script setup>
import { onMounted, ref } from 'vue'
import { useUsuariosStore } from '@renderer/stores/usuarios'
import { useUiStore } from '@renderer/stores/ui'
import AppIcon from '@renderer/components/ui/AppIcon.vue'
import BaseButton from '@renderer/components/ui/BaseButton.vue'
import BaseBadge from '@renderer/components/ui/BaseBadge.vue'
import EmptyState from '@renderer/components/ui/EmptyState.vue'
import ConfirmModal from '@renderer/components/ui/ConfirmModal.vue'
import UsuarioModal from '@renderer/components/productos/UsuarioModal.vue'

const usuarios = useUsuariosStore()
const ui = useUiStore()

onMounted(() => usuarios.fetchAll())

const ROL_LABEL = { administrador: 'Administrador', vendedor: 'Vendedor' }

const modalOpen = ref(false)
const usuarioEditando = ref(null)

function openCreate() {
  usuarioEditando.value = null
  modalOpen.value = true
}
function openEdit(u) {
  usuarioEditando.value = u
  modalOpen.value = true
}

const confirmOpen = ref(false)
const usuarioAEliminar = ref(null)

function askDelete(u) {
  usuarioAEliminar.value = u
  confirmOpen.value = true
}
async function confirmDelete() {
  if (!usuarioAEliminar.value) return
  try {
    await usuarios.desactivar(usuarioAEliminar.value.id)
    ui.toast('Usuario desactivado', 'info')
  } catch (e) {
    ui.toast(e?.message || 'No se pudo desactivar el usuario', 'error')
  }
  usuarioAEliminar.value = null
}
</script>

<template>
  <div class="view-content">
    <router-link :to="{ name: 'configuracion' }" class="back-link">
      <AppIcon name="chevron" :size="14" />
      Volver a Configuración
    </router-link>

    <div class="view-toolbar">
      <h2 class="vt-title">Usuarios</h2>
      <BaseButton variant="primary" size="sm" @click="openCreate">
        <AppIcon name="plus" :size="14" />
        Nuevo usuario
      </BaseButton>
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Nombre completo</th>
            <th>Rol</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody v-if="usuarios.items.length">
          <tr v-for="u in usuarios.items" :key="u.id">
            <td class="num">{{ u.usuario }}</td>
            <td><b>{{ u.nombreCompleto }}</b></td>
            <td>{{ ROL_LABEL[u.rol] || u.rol }}</td>
            <td>
              <BaseBadge :variant="u.activo ? 'ok' : 'out'">{{ u.activo ? 'Activo' : 'Inactivo' }}</BaseBadge>
            </td>
            <td>
              <div class="table-actions">
                <button class="icon-btn" title="Editar" @click="openEdit(u)"><AppIcon name="edit" :size="15" /></button>
                <button
                  v-if="u.activo && u.usuario !== 'admin'"
                  class="icon-btn danger"
                  title="Desactivar"
                  @click="askDelete(u)"
                >
                  <AppIcon name="trash" :size="15" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="5">
              <EmptyState icon="lock" title="Sin usuarios" subtitle="Crea el primer usuario del sistema" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UsuarioModal v-model="modalOpen" :usuario="usuarioEditando" />
    <ConfirmModal
      v-model="confirmOpen"
      :title="usuarioAEliminar ? `¿Desactivar &quot;${usuarioAEliminar.nombreCompleto}&quot;?` : '¿Desactivar usuario?'"
      text="El usuario no podrá seguir usándose en el sistema, pero su historial se conserva."
      icon="trash"
      confirm-label="Desactivar"
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
  min-width: 520px;
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
