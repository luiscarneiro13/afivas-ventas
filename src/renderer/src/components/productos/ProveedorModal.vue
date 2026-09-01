<script setup>
import { computed, reactive, ref, watch } from 'vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import BaseField from '@renderer/components/ui/BaseField.vue'
import BaseButton from '@renderer/components/ui/BaseButton.vue'
import { useProveedoresStore } from '@renderer/stores/proveedores'
import { useUiStore } from '@renderer/stores/ui'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  proveedor: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue'])

const proveedores = useProveedoresStore()
const ui = useUiStore()

const isEdit = computed(() => !!props.proveedor)
const title = computed(() => (isEdit.value ? 'Editar proveedor' : 'Nuevo proveedor'))

const form = reactive({
  nombre: '',
  rif: '',
  telefono: '',
  contacto: ''
})

function resetForm() {
  if (props.proveedor) {
    form.nombre = props.proveedor.nombre
    form.rif = props.proveedor.rif || ''
    form.telefono = props.proveedor.telefono || ''
    form.contacto = props.proveedor.contacto || ''
  } else {
    form.nombre = ''
    form.rif = ''
    form.telefono = ''
    form.contacto = ''
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
  const nombre = form.nombre.trim()
  if (!nombre) {
    ui.toast('Ingresa el nombre del proveedor', 'error')
    return
  }

  const payload = {
    nombre,
    rif: form.rif.trim(),
    telefono: form.telefono.trim(),
    contacto: form.contacto.trim()
  }

  saving.value = true
  try {
    if (!isEdit.value) {
      await proveedores.create(payload)
      ui.toast(`Proveedor "${nombre}" creado`, 'success')
    } else {
      await proveedores.update(props.proveedor.id, payload)
      ui.toast(`Proveedor "${nombre}" actualizado`, 'success')
    }
    close()
  } catch (e) {
    ui.toast(e?.message || 'No se pudo guardar el proveedor', 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <BaseModal :model-value="modelValue" :title="title" @update:model-value="$emit('update:modelValue', $event)">
    <BaseField label="Nombre">
      <input v-model="form.nombre" type="text" placeholder="Ej. Distribuidora Central" />
    </BaseField>
    <BaseField label="RIF (opcional)">
      <input v-model="form.rif" type="text" placeholder="Ej. J-12345678-9" />
    </BaseField>
    <BaseField label="Teléfono (opcional)">
      <input v-model="form.telefono" type="text" placeholder="Ej. 0412-1234567" />
    </BaseField>
    <BaseField label="Contacto (opcional)">
      <input v-model="form.contacto" type="text" placeholder="Ej. María Pérez" />
    </BaseField>
    <BaseButton variant="primary" block :disabled="saving" @click="guardar">
      {{ saving ? 'Guardando...' : 'Guardar proveedor' }}
    </BaseButton>
  </BaseModal>
</template>
