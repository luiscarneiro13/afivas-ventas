<script setup>
defineProps({
  label: { type: String, required: true },
  color: { type: String, required: true }
})
</script>

<template>
  <span class="cat-chip" :style="{ background: color }">{{ label }}</span>
</template>

<style scoped>
.cat-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
}
</style>
