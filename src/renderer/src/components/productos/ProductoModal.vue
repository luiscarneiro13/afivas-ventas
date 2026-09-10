<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import BaseField from '@renderer/components/ui/BaseField.vue'
import BaseButton from '@renderer/components/ui/BaseButton.vue'
import { useCatalogStore } from '@renderer/stores/catalog'
import { useConfigEmpresaStore } from '@renderer/stores/configEmpresa'
import { useUiStore } from '@renderer/stores/ui'
import { digitsFromDecimal, maskDisplay } from '@renderer/utils/format'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  producto: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue'])

const catalog = useCatalogStore()
const configEmpresa = useConfigEmpresaStore()
const ui = useUiStore()

const isEdit = computed(() => !!props.producto)
const title = computed(() => (isEdit.value ? 'Editar producto' : 'Nuevo producto'))

const form = reactive({
  codigo: '',
  desc: '',
  cat: catalog.categoryNames[0] || '',
  existencia: 0,
  stockMinimo: 3
})

// Máscara de centavos (igual que la tasa de cambio del header, ver
// utils/format.js): precioConIvaDigits guarda solo los dígitos tipeados,
// interpretados como centavos — los últimos 2 siempre son la parte decimal.
// Así el precio con IVA siempre queda con exactamente 2 decimales, sin
// dejar tipear letras ni puntos/comas sueltos.
const precioConIvaDigits = ref('0')
const precioConIvaDisplay = computed(() => maskDisplay(precioConIvaDigits.value))

function onInputPrecio(e) {
  precioConIvaDigits.value = e.target.value.replace(/\D/g, '').slice(0, 10) || '0'
  nextTick(() => {
    const len = e.target.value.length
    e.target.setSelectionRange(len, len)
  })
}

function selectAllPrecio(e) {
  e.target.select()
}

// Solo informativo (deshabilitado): el backend recalcula y persiste este
// valor de forma autoritativa al guardar, con el % de IVA vigente en ese
// momento — acá se muestra en vivo para que el usuario vea qué precio sin
// IVA va a quedar antes de guardar.
const precioSinIvaPreview = computed(() => {
  const precioConIva = Number(precioConIvaDigits.value) / 100
  const precio = precioConIva / (1 + configEmpresa.porcentajeIva / 100)
  return precio.toFixed(2)
})

function resetForm() {
  if (props.producto) {
    form.codigo = props.producto.codigo
    form.desc = props.producto.desc
    form.cat = props.producto.cat
    form.existencia = props.producto.existencia
    form.stockMinimo = props.producto.stockMinimo ?? 3
    precioConIvaDigits.value = digitsFromDecimal(props.producto.precio)
  } else {
    form.codigo = ''
    form.desc = ''
    form.cat = catalog.categoryNames[0] || ''
    form.existencia = 0
    form.stockMinimo = 3
    precioConIvaDigits.value = '0'
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
  const codigo = form.codigo.trim().toUpperCase()
  const desc = form.desc.trim()
  const cat = form.cat
  const precioConIva = Number(precioConIvaDigits.value) / 100
  const existencia =
    form.existencia === '' || form.existencia === null ? 0 : parseInt(form.existencia, 10)
  const stockMinimo =
    form.stockMinimo === '' || form.stockMinimo === null ? 3 : parseInt(form.stockMinimo, 10)

  if (
    !codigo ||
    !desc ||
    !cat ||
    isNaN(precioConIva) ||
    precioConIva < 0 ||
    isNaN(existencia) ||
    existencia < 0 ||
    isNaN(stockMinimo) ||
    stockMinimo < 0
  ) {
    ui.toast('Completa todos los campos correctamente', 'error')
    return
  }

  if (!isEdit.value && catalog.exists(codigo)) {
    ui.toast('Ese código ya existe', 'error')
    return
  }

  saving.value = true
  try {
    if (!isEdit.value) {
      await catalog.create({ codigo, desc, cat, precioConIva, existencia, stockMinimo })
      ui.toast(`Producto "${desc}" creado`, 'success')
    } else {
      await catalog.update(props.producto.codigo, { desc, cat, precioConIva, existencia, stockMinimo })
      ui.toast(`Producto "${desc}" actualizado`, 'success')
    }
    close()
  } catch (e) {
    ui.toast(e?.message || 'No se pudo guardar el producto', 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <BaseModal :model-value="modelValue" :title="title" @update:model-value="$emit('update:modelValue', $event)">
    <BaseField label="Código">
      <input v-model="form.codigo" type="text" placeholder="Ej. AA0011" :disabled="isEdit" />
    </BaseField>
    <BaseField label="Descripción">
      <input v-model="form.desc" type="text" placeholder="Ej. Llavero de silicona" />
    </BaseField>
    <div class="field-row">
      <BaseField label="Categoría">
        <select v-model="form.cat">
          <option v-for="c in catalog.categoryNames" :key="c" :value="c">{{ c }}</option>
        </select>
      </BaseField>
      <BaseField label="Precio con IVA ($)">
        <input
          :value="precioConIvaDisplay"
          type="text"
          inputmode="numeric"
          @input="onInputPrecio"
          @click="selectAllPrecio"
        />
      </BaseField>
    </div>
    <div class="field-row">
      <BaseField label="Precio sin IVA ($)">
        <input :value="precioSinIvaPreview" type="text" disabled placeholder="0.00" />
      </BaseField>
      <BaseField label="Existencia (opcional)">
        <input v-model="form.existencia" type="number" min="0" step="1" placeholder="0" />
      </BaseField>
    </div>
    <div class="field-row">
      <BaseField label="Alerta de cantidad mínima (opcional)">
        <input v-model="form.stockMinimo" type="number" min="0" step="1" placeholder="3" />
      </BaseField>
    </div>
    <BaseButton variant="primary" block :disabled="saving" @click="guardar">
      {{ saving ? 'Guardando...' : 'Guardar producto' }}
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
</style>
