<script setup>
import Sidebar from './Sidebar.vue'
import ContentHeader from './ContentHeader.vue'
</script>

<template>
  <div class="app-shell">
    <Sidebar />
    <div class="content">
      <ContentHeader />
      <div class="view">
        <router-view />
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}
.view {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

@media (max-width: 980px) {
  .app-shell {
    flex-direction: column;
    height: auto;
    min-height: 100vh;
  }
}
</style>
