<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  label: { type: String, required: true },
  value: { type: String, required: true },
  sub: { type: String, default: '' },
  icon: { type: String, required: true },
  iconBg: { type: String, default: 'var(--primary-light)' },
  iconColor: { type: String, default: 'var(--primary)' }
})
</script>

<template>
  <div class="stat-card">
    <div class="sc-top">
      <span class="sc-label">{{ label }}</span>
      <div class="sc-icon" :style="{ background: iconBg, color: iconColor }">
        <AppIcon :name="icon" :size="18" />
      </div>
    </div>
    <div class="sc-value num">{{ value }}</div>
    <div class="sc-sub">{{ sub }}</div>
  </div>
</template>

<style scoped>
.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: var(--shadow-sm);
}
.sc-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sc-icon {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sc-label {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 600;
}
.sc-value {
  font-size: 23px;
  font-weight: 800;
}
.sc-sub {
  font-size: 11px;
  color: var(--text-muted);
}
</style>
