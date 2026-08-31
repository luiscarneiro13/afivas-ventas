<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useCajaStore } from '@renderer/stores/caja'
import { fmtTime } from '@renderer/utils/format'

const route = useRoute()
const caja = useCajaStore()

const now = ref(new Date())
let timer = null
onMounted(() => {
  timer = setInterval(() => (now.value = new Date()), 1000)
})
onUnmounted(() => clearInterval(timer))

const clock = computed(() => fmtTime(now.value, { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
const title = computed(() => route.meta.title || '')
</script>

<template>
  <header class="content-header">
    <h1>{{ title }}</h1>
    <div class="ch-right">
      <div class="pill clock">{{ clock }}</div>
      <div class="pill">Caja: <b>{{ caja.abierta ? 'Abierta' : 'Cerrada' }}</b></div>
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
.pill b {
  color: var(--text);
}
.pill.clock {
  font-family: 'Roboto Mono', monospace;
}
</style>
