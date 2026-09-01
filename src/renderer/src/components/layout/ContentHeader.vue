<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCajaStore } from '@renderer/stores/caja'
import { useCartStore } from '@renderer/stores/cart'
import BaseButton from '@renderer/components/ui/BaseButton.vue'
import ConfirmModal from '@renderer/components/ui/ConfirmModal.vue'

const route = useRoute()
const router = useRouter()
const caja = useCajaStore()
const cart = useCartStore()

const title = computed(() => route.meta.title || '')

const tasaText = ref(String(caja.tasa))

function commitTasa() {
  const parsed = parseFloat(String(tasaText.value).replace(',', '.'))
  if (parsed > 0) {
    caja.tasa = parsed
  }
  tasaText.value = String(caja.tasa)
}

const confirmCerrarCaja = ref(false)

function cerrarCaja() {
  cart.clear()
  caja.cerrar()
  router.push({ name: 'caja' })
}
</script>

<template>
  <header class="content-header">
    <h1>{{ title }}</h1>
    <div class="ch-right">
      <div class="pill tasa-pill">
        <span>Tasa:</span>
        <input
          v-model="tasaText"
          class="tasa-input"
          type="text"
          inputmode="decimal"
          @blur="commitTasa"
          @keyup.enter="commitTasa"
        />
        <span>Bs/$</span>
      </div>
      <div class="pill">Caja: <b>{{ caja.abierta ? 'Abierta' : 'Cerrada' }}</b></div>
      <BaseButton variant="danger" size="sm" @click="confirmCerrarCaja = true">Cerrar caja</BaseButton>
    </div>

    <ConfirmModal
      v-model="confirmCerrarCaja"
      title="¿Cerrar caja?"
      text="Se vaciará el carrito de venta actual y deberás capturar una nueva tasa para reabrir."
      icon="lock"
      confirm-label="Cerrar caja"
      @confirm="cerrarCaja"
    />
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
.pill b {
  color: var(--text);
}
.tasa-input {
  width: 52px;
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
