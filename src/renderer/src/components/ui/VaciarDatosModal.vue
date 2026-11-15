<script setup>
// Modal de operación destructiva: vacía las tablas de productos y ventas.
//
// El modal NO se puede cerrar con la "X", con la tecla ESC ni haciendo click
// fuera: la única forma de salir es el botón "Cancelar" (que está al lado
// del de "Ejecutar"). Para ejecutarlo hay que escribir la contraseña del
// usuario conectado.
import { ref, watch, nextTick } from 'vue'
import { useAuthStore } from '@renderer/stores/auth'
import { useUiStore } from '@renderer/stores/ui'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import BaseButton from '@renderer/components/ui/BaseButton.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue', 'vacio'])

const auth = useAuthStore()
const ui = useUiStore()

const password = ref('')
const error = ref('')
const ejecutando = ref(false)
const inputRef = ref(null)

watch(
  () => props.modelValue,
  async (abierto) => {
    if (abierto) {
      password.value = ''
      error.value = ''
      await nextTick()
      inputRef.value?.focus?.()
    }
  }
)

// Única salida del modal.
function cancelar() {
  if (ejecutando.value) return
  emit('update:modelValue', false)
}

async function ejecutar() {
  if (!password.value) {
    error.value = 'Escribe la contraseña para continuar'
    return
  }
  ejecutando.value = true
  error.value = ''
  try {
    const res = await window.api.operacionesVaciarProductosYVentas({
      usuarioId: auth.usuarioId,
      password: password.value
    })
    if (!res?.ok) {
      error.value = res?.message || 'No se pudo ejecutar la operación'
      return
    }
    ui.toast(
      `Base de datos vaciada: ${res.productos} producto(s) y ${res.ventas} venta(s) eliminados`,
      'success'
    )
    emit('vacio')
    emit('update:modelValue', false)
  } catch (e) {
    error.value = e?.message || 'No se pudo ejecutar la operación'
  } finally {
    ejecutando.value = false
  }
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title="Vaciar productos y ventas"
    :show-close="false"
    :close-on-overlay="false"
    width="440px"
  >
    <p class="aviso">
      Esta acción borra <b>todos los productos</b> y <b>todas las ventas</b> registradas.
      El resto de la base de datos (usuarios, categorías, clientes, configuración) no se toca.
    </p>

    <label class="campo">
      <span>Contraseña del usuario</span>
      <input
        ref="inputRef"
        v-model="password"
        type="password"
        placeholder="Escribe tu contraseña"
        autocomplete="current-password"
        @keyup.enter="ejecutar"
      />
    </label>

    <p v-if="error" class="error-msg">{{ error }}</p>

    <template #footer>
      <div class="acciones">
        <BaseButton variant="danger" :disabled="ejecutando" @click="ejecutar">
          {{ ejecutando ? 'Ejecutando...' : 'Ejecutar' }}
        </BaseButton>
        <BaseButton variant="ghost" :disabled="ejecutando" @click="cancelar">Cancelar</BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
.aviso {
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--text);
  margin-bottom: 16px;
}
.campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.campo span {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-muted);
}
.campo input {
  width: 100%;
  padding: 11px 14px;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--border);
  background: var(--surface-alt);
  color: var(--text);
  font-size: 14px;
}
.campo input:focus {
  outline: none;
  border-color: var(--primary);
}
.error-msg {
  margin-top: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--danger);
}
.acciones {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  width: 100%;
}
</style>
