<script setup>
import { computed, reactive, ref, watch } from 'vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import BaseField from '@renderer/components/ui/BaseField.vue'
import BaseButton from '@renderer/components/ui/BaseButton.vue'
import { useUsuariosStore } from '@renderer/stores/usuarios'
import { useUiStore } from '@renderer/stores/ui'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  usuario: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue'])

const usuarios = useUsuariosStore()
const ui = useUiStore()

const isEdit = computed(() => !!props.usuario)
const title = computed(() => (isEdit.value ? 'Editar usuario' : 'Nuevo usuario'))

const form = reactive({
  usuario: '',
  nombreCompleto: '',
  rol: 'vendedor',
  password: ''
})

function resetForm() {
  if (props.usuario) {
    form.usuario = props.usuario.usuario
    form.nombreCompleto = props.usuario.nombreCompleto
    form.rol = props.usuario.rol
    form.password = ''
  } else {
    form.usuario = ''
    form.nombreCompleto = ''
    form.rol = 'vendedor'
    form.password = ''
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) resetForm()
  }
)

function close() {
  emit('update:modelValue', false)
}

const saving = ref(false)

async function guardar() {
  const usuario = form.usuario.trim()
  const nombreCompleto = form.nombreCompleto.trim()
  const rol = form.rol
  const password = form.password

  if (!usuario || !nombreCompleto || !rol) {
    ui.toast('Completa todos los campos correctamente', 'error')
    return
  }
  if (!isEdit.value && !password) {
    ui.toast('La contraseña es obligatoria para un usuario nuevo', 'error')
    return
  }

  saving.value = true
  try {
    if (!isEdit.value) {
      await usuarios.create({ usuario, nombreCompleto, rol, password })
      ui.toast(`Usuario "${nombreCompleto}" creado`, 'success')
    } else {
      const payload = { nombreCompleto, rol }
      if (password) payload.password = password
      await usuarios.update(props.usuario.id, payload)
      ui.toast(`Usuario "${nombreCompleto}" actualizado`, 'success')
    }
    close()
  } catch (e) {
    ui.toast(e?.message || 'No se pudo guardar el usuario', 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <BaseModal :model-value="modelValue" :title="title" @update:model-value="$emit('update:modelValue', $event)">
    <BaseField label="Usuario">
      <input v-model="form.usuario" type="text" placeholder="Ej. jperez" :disabled="isEdit" />
    </BaseField>
    <BaseField label="Nombre completo">
      <input v-model="form.nombreCompleto" type="text" placeholder="Ej. Juan Pérez" />
    </BaseField>
    <BaseField label="Rol">
      <select v-model="form.rol">
        <option value="administrador">Administrador</option>
        <option value="vendedor">Vendedor</option>
      </select>
    </BaseField>
    <BaseField :label="isEdit ? 'Nueva contraseña (dejar en blanco para no cambiar)' : 'Contraseña'">
      <input v-model="form.password" type="password" placeholder="••••••••" autocomplete="new-password" />
    </BaseField>
    <BaseButton variant="primary" block :disabled="saving" @click="guardar">
      {{ saving ? 'Guardando...' : 'Guardar usuario' }}
    </BaseButton>
  </BaseModal>
</template>
