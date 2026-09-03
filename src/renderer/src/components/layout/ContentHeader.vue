<script setup>
import { ref, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCajaStore } from '@renderer/stores/caja'
import { useUiStore } from '@renderer/stores/ui'
import { digitsFromDecimal, maskDisplay, fmtDateTime } from '@renderer/utils/format'
import BaseButton from '@renderer/components/ui/BaseButton.vue'

const route = useRoute()
const router = useRouter()
const caja = useCajaStore()
const ui = useUiStore()

const title = computed(() => route.meta.title || '')

// Máscara de centavos (ver utils/format.js): tasaDigits guarda solo los
// dígitos tipeados, interpretados como centavos — los últimos 2 siempre son
// la parte decimal. Así se arma "1900,00", "800,00", "1000000,00" en vivo,
// sin dejar tipear letras ni puntos.
const tasaDigits = ref(digitsFromDecimal(caja.tasa))
const tasaDisplay = computed(() => maskDisplay(tasaDigits.value))

function onInput(e) {
  tasaDigits.value = e.target.value.replace(/\D/g, '').slice(0, 10) || '0'
  nextTick(() => {
    const len = e.target.value.length
    e.target.setSelectionRange(len, len)
  })
}

function selectAll(e) {
  e.target.select()
}

// El blur que dispara e.target.blur() dentro de onEnter también commitea,
// pero sin toast (el toast es solo para la confirmación explícita con
// Enter) — esta bandera evita commitear/formatear dos veces seguidas.
let commitPending = false

async function commitTasa({ showToast } = {}) {
  const parsed = Number(tasaDigits.value) / 100
  if (parsed > 0) {
    try {
      await caja.actualizarTasa(parsed)
      if (showToast) ui.toast('Tasa actualizada', 'success')
    } catch (e) {
      ui.toast(e?.message || 'No se pudo actualizar la tasa', 'error')
    }
  }
  tasaDigits.value = digitsFromDecimal(caja.tasa)
}

async function onEnter(e) {
  commitPending = true
  await commitTasa({ showToast: true })
  e.target.blur()
}

function onBlur() {
  if (commitPending) {
    commitPending = false
    return
  }
  commitTasa({ showToast: false })
}
</script>

<template>
  <header class="content-header">
    <h1>{{ title }}</h1>
    <div class="ch-right">
      <div class="pill tasa-pill">
        <span>Tasa:</span>
        <input
          :value="tasaDisplay"
          class="tasa-input"
          type="text"
          inputmode="numeric"
          @input="onInput"
          @click="selectAll"
          @blur="onBlur"
          @keydown.enter="onEnter"
        />
        <span>Bs/$</span>
      </div>
      <div class="caja-status">
        <div class="pill">Caja: <b>{{ caja.abierta ? 'Abierta' : 'Cerrada' }}</b></div>
        <span v-if="caja.abierta && caja.abiertaAt" class="caja-apertura">{{ fmtDateTime(caja.abiertaAt) }}</span>
      </div>
      <BaseButton variant="danger" size="sm" @click="router.push({ name: 'fiscalizacion' })">Fiscalización</BaseButton>
    </div>
  </header>
</template>

<style scoped>
.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 26px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.content-header h1 {
  font-size: 18.5px;
  font-weight: 700;
}
.ch-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pill {
  display: flex;
  align-items: center;
  gap: 7px;
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 7px 13px;
  font-size: 12.5px;
  color: var(--text-muted);
  font-weight: 500;
}
.caja-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.caja-apertura {
  font-size: 9.5px;
  color: var(--text-muted);
  line-height: 1;
}
.pill b {
  color: var(--text);
}
.tasa-input {
  width: 84px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: #fff;
  padding: 2px 5px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--text);
  text-align: right;
}
.tasa-input:focus {
  outline: none;
  border-color: var(--primary);
}
</style>
