<script setup>
import { computed, reactive, ref, watch } from 'vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import BaseField from '@renderer/components/ui/BaseField.vue'
import BaseButton from '@renderer/components/ui/BaseButton.vue'
import { useClientesStore } from '@renderer/stores/clientes'
import { useUiStore } from '@renderer/stores/ui'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  cliente: { type: Object, default: null },
  // Valores iniciales solo para el flujo de creación (ej. lo que el usuario
  // ya había escrito en un buscador antes de decidir registrar el cliente).
  prefill: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue', 'created'])

const clientes = useClientesStore()
const ui = useUiStore()

const isEdit = computed(() => !!props.cliente)
const title = computed(() => (isEdit.value ? 'Editar cliente' : 'Nuevo cliente'))

const form = reactive({
  tipoDocumento: '',
  cedula: '',
  nombre: '',
  direccion: '',
  telefono: '',
  movil: '',
  correo: ''
})

function resetForm() {
  if (props.cliente) {
    form.tipoDocumento = props.cliente.tipo_documento || ''
    form.cedula = props.cliente.cedula || ''
    form.nombre = props.cliente.nombre
    form.direccion = props.cliente.direccion || ''
    form.telefono = props.cliente.telefono || ''
    form.movil = props.cliente.movil || ''
    form.correo = props.cliente.correo || ''
  } else {
    form.tipoDocumento = props.prefill?.tipoDocumento || 'V'
    form.cedula = (props.prefill?.cedula || '').replace(/\D/g, '')
    form.nombre = props.prefill?.nombre || ''
    form.direccion = 'El Tigre'
    form.telefono = ''
    form.movil = ''
    form.correo = ''
  }
}

function seleccionarTipo(letra) {
  form.tipoDocumento = letra
}

function onCedulaInput(e) {
  form.cedula = e.target.value.replace(/\D/g, '')
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function guardar() {
  const cedula = form.cedula.trim()
  const nombre = form.nombre.trim()
  const direccion = form.direccion.trim()
  const telefono = form.telefono.trim()
  const movil = form.movil.trim()
  const correo = form.correo.trim()

  if (!form.tipoDocumento) {
    ui.toast('Selecciona el tipo de documento', 'error')
    return
  }
  if (!cedula || !nombre) {
    ui.toast('Completa la cédula/RIF y el nombre', 'error')
    return
  }
  if (correo && !EMAIL_RE.test(correo)) {
    ui.toast('El correo no tiene un formato válido', 'error')
    return
  }

  saving.value = true
  try {
    if (!isEdit.value) {
      const creado = await clientes.create({
        cedula,
        tipoDocumento: form.tipoDocumento,
        nombre,
        direccion,
        telefono,
        movil,
        correo
      })
      ui.toast(`Cliente "${nombre}" creado`, 'success')
      emit('created', creado)
    } else {
      await clientes.update(props.cliente.id, {
        nombre,
        direccion,
        telefono,
        movil,
        correo,
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
    <BaseField label="Tipo">
      <div class="tipo-toggle">
        <button
          type="button"
          class="tipo-btn"
          :class="{ active: form.tipoDocumento === 'V' }"
          :disabled="isEdit"
          @click="seleccionarTipo('V')"
        >
          Natural
        </button>
        <button
          type="button"
          class="tipo-btn"
          :class="{ active: form.tipoDocumento === 'J' }"
          :disabled="isEdit"
          @click="seleccionarTipo('J')"
        >
          Jurídico
        </button>
      </div>
    </BaseField>
    <div class="field-row">
      <BaseField class="field-cedula" label="Cédula / RIF">
        <input
          v-model="form.cedula"
          type="text"
          inputmode="numeric"
          maxlength="9"
          placeholder="Ej. 165729168"
          :disabled="isEdit"
          @input="onCedulaInput"
        />
      </BaseField>
      <BaseField label="Nombre">
        <input
          v-model="form.nombre"
          type="text"
          placeholder="Ej. Mariana Carneiro"
          @keydown.enter.prevent="guardar"
        />
      </BaseField>
    </div>
    <BaseField label="Dirección (opcional)">
      <input v-model="form.direccion" type="text" placeholder="Ej. Av. Principal, Caracas" />
    </BaseField>
    <div class="field-row">
      <BaseField label="Teléfono (opcional)">
        <input v-model="form.telefono" type="text" placeholder="Ej. 0212-1234567" />
      </BaseField>
      <BaseField label="Móvil (opcional)">
        <input v-model="form.movil" type="text" placeholder="Ej. 0414-1234567" />
      </BaseField>
    </div>
    <BaseField label="Correo (opcional)">
      <input v-model="form.correo" type="email" placeholder="Ej. cliente@correo.com" />
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
.field-row .field-cedula {
  flex: 0 0 140px;
}
.tipo-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.tipo-btn {
  height: 42px;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--border);
  background: var(--surface-alt);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  transition: 0.15s;
}
.tipo-btn:hover:not(:disabled) {
  border-color: var(--primary);
}
.tipo-btn.active {
  border-color: var(--primary);
  background: var(--primary-light);
  color: var(--primary);
}
.tipo-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
