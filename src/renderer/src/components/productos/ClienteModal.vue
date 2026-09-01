<script setup>
import { computed, reactive, ref, watch } from 'vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import BaseField from '@renderer/components/ui/BaseField.vue'
import BaseButton from '@renderer/components/ui/BaseButton.vue'
import { useClientesStore } from '@renderer/stores/clientes'
import { useUiStore } from '@renderer/stores/ui'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  cliente: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue'])

const clientes = useClientesStore()
const ui = useUiStore()

const TIPOS_DOCUMENTO = ['V', 'E', 'J', 'G', 'P']

const isEdit = computed(() => !!props.cliente)
const title = computed(() => (isEdit.value ? 'Editar cliente' : 'Nuevo cliente'))

const form = reactive({
  tipoDocumento: 'V',
  cedula: '',
  nombre: '',
  telefono: ''
})

function resetForm() {
  if (props.cliente) {
    form.tipoDocumento = props.cliente.tipo_documento || 'V'
    form.cedula = props.cliente.cedula
    form.nombre = props.cliente.nombre
    form.telefono = props.cliente.telefono || ''
  } else {
    form.tipoDocumento = 'V'
    form.cedula = ''
    form.nombre = ''
    form.telefono = ''
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
  const cedula = form.cedula.trim()
  const nombre = form.nombre.trim()
  if (!cedula || !nombre) {
    ui.toast('Completa la cédula/RIF y el nombre', 'error')
    return
  }

  saving.value = true
  try {
    if (!isEdit.value) {
      await clientes.create({ cedula, tipoDocumento: form.tipoDocumento, nombre, telefono: form.telefono.trim() })
      ui.toast(`Cliente "${nombre}" creado`, 'success')
    } else {
      await clientes.update(props.cliente.id, {
        nombre,
        telefono: form.telefono.trim(),
        tipoDocumento: form.tipoDocumento
      })
      ui.toast(`Cliente "${nombre}" actualizado`, 'success')
    }
    close()
  } catch (e) {
    ui.toast(e?.message || 'No se pudo guardar el cliente', 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <BaseModal :model-value="modelValue" :title="title" @update:model-value="$emit('update:modelValue', $event)">
    <div class="field-row">
      <BaseField label="Tipo">
        <select v-model="form.tipoDocumento" :disabled="isEdit">
          <option v-for="t in TIPOS_DOCUMENTO" :key="t" :value="t">{{ t }}</option>
        </select>
      </BaseField>
      <BaseField label="Cédula / RIF">
        <input v-model="form.cedula" type="text" placeholder="Ej. 31179420" :disabled="isEdit" />
      </BaseField>
    </div>
    <BaseField label="Nombre">
      <input v-model="form.nombre" type="text" placeholder="Ej. Mariana Carneiro" />
    </BaseField>
    <BaseField label="Teléfono (opcional)">
      <input v-model="form.telefono" type="text" placeholder="Ej. 0414-1234567" />
    </BaseField>
    <BaseButton variant="primary" block :disabled="saving" @click="guardar">
      {{ saving ? 'Guardando...' : 'Guardar cliente' }}
    </BaseButton>
  </BaseModal>
</template>

<style scoped>
.field-row {
  display: flex;
  gap: 12px;
}
.field-row > * {
  flex: 1;
  min-width: 0;
}
.field-row :deep(select) {
  height: 42px;
}
</style>
