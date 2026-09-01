<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  icon: { type: String, required: true },
  label: { type: String, required: true },
  to: { type: [String, Object], default: null }
})
</script>

<template>
  <router-link v-if="to" :to="to" class="nav-card">
    <span class="nc-icon"><AppIcon :name="icon" :size="30" /></span>
    <span class="nc-label">{{ label }}</span>
  </router-link>
  <div v-else class="nav-card is-static">
    <span class="nc-icon"><AppIcon :name="icon" :size="30" /></span>
    <span class="nc-label">{{ label }}</span>
  </div>
</template>

<style scoped>
.nav-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  padding: 28px 20px 24px;
  color: var(--text);
  text-align: center;
  text-decoration: none;
  transition: 0.15s;
}
.nav-card:hover,
.nav-card:focus-visible {
  border-color: var(--primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.nav-card:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
.nav-card.is-static {
  cursor: default;
  opacity: 0.6;
}
.nav-card.is-static:hover {
  border-color: var(--border);
  box-shadow: var(--shadow-sm);
  transform: none;
}
.nc-icon {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background: var(--primary-light);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.nc-label {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 2.6em;
  font-size: 13.5px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--text);
}
</style>
