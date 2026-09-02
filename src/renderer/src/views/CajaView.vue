<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCajaStore } from '@renderer/stores/caja'
import { useAuthStore } from '@renderer/stores/auth'
import { useUiStore } from '@renderer/stores/ui'
import logoUrl from '@renderer/assets/images/logo.png'

const router = useRouter()
const caja = useCajaStore()
const auth = useAuthStore()
const ui = useUiStore()

const tasa = ref('189.35')
const aperturando = ref(false)

async function aperturar() {
  aperturando.value = true
  try {
    await caja.aperturar(tasa.value, auth.usuarioId)
    ui.toast('Caja aperturada correctamente', 'success')
    router.push({ name: 'venta' })
  } catch (e) {
    ui.toast(e?.message || 'No se pudo aperturar la caja', 'error')
  } finally {
    aperturando.value = false
  }
}
</script>

<template>
  <section class="caja-screen">
    <div class="caja-card">
      <img class="caja-icon" :src="logoUrl" alt="Afivas Store" />
      <h1>Apertura de caja</h1>
      <p class="sub">Confirma la tasa de cambio para comenzar a vender</p>
      <div class="rate-row">
        <label>Tasa de cambio (Bs/$)</label>
        <input v-model="tasa" type="text" inputmode="decimal" placeholder="Ej. 189.35" />
      </div>
      <button
        class="btn btn-primary btn-block"
        style="margin-top: 20px"
        :disabled="aperturando"
        @click="aperturar"
      >
        {{ aperturando ? 'Aperturando...' : 'Aperturar caja' }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.caja-screen {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
}
.caja-card {
  width: min(420px, 90vw);
  background: var(--surface);
  border-radius: 24px;
  padding: 36px 32px;
  box-shadow: var(--shadow-md);
  text-align: center;
  animation: pop 0.4s ease;
}
.caja-icon {
  display: block;
  width: 72px;
  height: 72px;
  object-fit: contain;
  margin: 0 auto 14px;
}
.caja-card h1 {
  font-size: 19px;
  margin-bottom: 4px;
}
.caja-card p.sub {
  color: var(--text-muted);
  font-size: 13px;
  margin-bottom: 22px;
}
.rate-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--surface-alt);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  margin-top: 12px;
  border: 1px solid var(--border);
}
.rate-row label {
  font-size: 12.5px;
  color: var(--text-muted);
  font-weight: 600;
}
.rate-row input {
  width: 120px;
  text-align: right;
  border: 1.5px solid var(--border);
  background: var(--surface);
  border-radius: 8px;
  padding: 8px 10px;
  font-weight: 700;
  font-size: 14px;
  color: var(--text);
  transition: 0.15s;
}
.rate-row input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-light);
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 18px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 14px;
  transition: 0.15s;
}
.btn-primary {
  background: var(--primary);
  color: #fff;
  box-shadow: 0 6px 16px rgba(93, 63, 211, 0.3);
}
.btn-primary:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}
.btn-block {
  width: 100%;
}
</style>
