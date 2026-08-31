<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  icon: { type: String, default: 'box' },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' }
})
</script>

<template>
  <div class="empty-state">
    <div class="ic"><AppIcon :name="icon" :size="22" /></div>
    <b>{{ title }}</b>
    <span v-if="subtitle">{{ subtitle }}</span>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 20px;
  color: var(--text-muted);
  text-align: center;
  gap: 10px;
  width: 100%;
}
.empty-state .ic {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: var(--surface-alt);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}
.empty-state b {
  color: var(--text);
  font-size: 14px;
}
.empty-state span {
  font-size: 12.5px;
}
</style>
