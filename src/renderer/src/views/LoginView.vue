<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@renderer/stores/auth'
import { useCajaStore } from '@renderer/stores/caja'
import logoUrl from '@renderer/assets/images/logo.png'

const router = useRouter()
const auth = useAuthStore()
const caja = useCajaStore()

const user = ref('')
const pass = ref('')
const error = ref('')
const loading = ref(false)

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(user.value, pass.value)
    // El estado de Pinia no sobrevive un reinicio de la app: hay que
    // consultar la BD para saber si ya quedó una sesión de caja abierta
    // (la caja ya no se cierra al cerrar sesión).
    await caja.fetchActual()
    router.push(caja.abierta ? { name: 'venta' } : { name: 'caja' })
  } catch (e) {
    error.value = e?.message || 'No se pudo iniciar sesión'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="login-screen">
    <div class="login-card">
      <img class="brand-logo" :src="logoUrl" alt="Afivas Store" />
      <h1>Afivas Ventas</h1>
      <p class="sub">Sistema de punto de venta</p>
      <form @submit.prevent="onSubmit">
        <div class="field">
          <label>Usuario</label>
          <input v-model="user" type="text" placeholder="Usuario" autocomplete="off" required />
        </div>
        <div class="field">
          <label>Contraseña</label>
          <input v-model="pass" type="password" placeholder="••••••••" required />
        </div>
        <p v-if="error" class="error-msg">{{ error }}</p>
        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          {{ loading ? 'Ingresando...' : 'Iniciar sesión' }}
        </button>
      </form>
    </div>
  </section>
</template>

<style scoped>
.login-screen {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 20% 20%, #8a70f0, transparent 55%),
    radial-gradient(circle at 80% 0%, #b9a6ff, transparent 45%),
    linear-gradient(135deg, #5d3fd3, #4a2fb0 60%, #1a0066);
  position: relative;
}
.login-screen::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px);
  background-size: 26px 26px;
}
.login-card {
  position: relative;
  z-index: 1;
  width: min(380px, 90vw);
  background: var(--surface);
  border-radius: 24px;
  padding: 38px 32px 30px;
  box-shadow: var(--shadow-lg);
  text-align: center;
  animation: pop 0.45s cubic-bezier(0.2, 0.9, 0.3, 1.2);
}
.brand-logo {
  display: block;
  width: 84px;
  height: 84px;
  object-fit: contain;
  margin: 0 auto 16px;
  filter: drop-shadow(0 10px 20px rgba(93, 63, 211, 0.35));
}
.login-card h1 {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 2px;
}
.login-card p.sub {
  color: var(--text-muted);
  font-size: 13px;
  margin-bottom: 26px;
}
.field {
  text-align: left;
  margin-bottom: 14px;
}
.field label {
  display: block;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 6px;
}
.field input {
  width: 100%;
  padding: 11px 13px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  background: var(--surface-alt);
  transition: 0.15s;
  color: var(--text);
}
.field input:focus {
  outline: none;
  border-color: var(--primary);
  background: #fff;
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
.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.error-msg {
  color: var(--danger);
  font-size: 12.5px;
  font-weight: 600;
  margin: -4px 0 14px;
}
</style>
