<script setup>
defineProps({
  variant: { type: String, default: 'ok' } // ok | low | out
})
</script>

<template>
  <span class="badge" :class="`badge-${variant}`"><slot /></span>
</template>

<style scoped>
.badge {
  font-size: 10px;
  font-weight: 700;
  padding: 3px 7px;
  border-radius: 999px;
  white-space: nowrap;
}
.badge-ok {
  background: var(--success-light);
  color: var(--success);
}
.badge-low {
  background: var(--warning-light);
  color: var(--warning);
}
.badge-out {
  background: var(--danger-light);
  color: var(--danger);
}
</style>
