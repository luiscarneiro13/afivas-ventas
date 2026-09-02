<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useUiStore } from '@renderer/stores/ui'
import { useAuthStore } from '@renderer/stores/auth'
import { useCajaStore } from '@renderer/stores/caja'
import { useCartStore } from '@renderer/stores/cart'
import { NAV_ITEMS } from '@renderer/data/dummy'
import AppIcon from '@renderer/components/ui/AppIcon.vue'
import logoUrl from '@renderer/assets/images/logo.png'

const route = useRoute()
const router = useRouter()
const ui = useUiStore()
const auth = useAuthStore()
const caja = useCajaStore()
const cart = useCartStore()

function logout() {
  // La caja NO se cierra al cerrar sesión: solo se cierra desde
  // Fiscalización, tras imprimir el Reporte Z.
  cart.clear()
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <aside class="sidebar" :class="{ collapsed: ui.sidebarCollapsed }">
    <button
      class="sidebar-toggle"
      title="Expandir/contraer menú"
      @click="ui.toggleSidebar()"
    >
      <AppIcon name="chevron" :size="14" />
    </button>

    <div class="sidebar-brand">
      <img class="brand-mini" :src="logoUrl" alt="Afivas Store" />
    </div>

    <nav class="sidebar-nav">
      <router-link
        v-for="item in NAV_ITEMS"
        :key="item.id"
        :to="{ name: item.id }"
        class="nav-item"
        :class="{ active: route.name === item.id }"
        :title="item.label"
      >
        <AppIcon :name="item.icon" :size="17" />
        <span>{{ item.label }}</span>
      </router-link>
    </nav>

    <div class="sidebar-user">
      <div class="avatar" :title="auth.cajero">{{ auth.initials || '--' }}</div>
      <div class="info">
        <b>{{ auth.cajero || '—' }}</b>
        <span>Tasa: {{ caja.tasa.toLocaleString('es-VE', { minimumFractionDigits: 2 }) }} Bs/$</span>
      </div>
      <button title="Cerrar sesión" @click="logout"><AppIcon name="logout" :size="17" /></button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 236px;
  flex-shrink: 0;
  background: var(--sidebar-bg);
  display: flex;
  flex-direction: column;
  padding: 20px 14px;
  position: relative;
  transition: width 0.2s ease, padding 0.2s ease;
  border-right: 1px solid var(--sidebar-border);
  box-shadow: var(--shadow-sm);
  z-index: 20;
}
.sidebar-toggle {
  position: absolute;
  top: 26px;
  right: -13px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
  z-index: 6;
  transition: 0.15s;
}
.sidebar-toggle:hover {
  color: var(--primary);
  border-color: var(--primary);
}
.sidebar-toggle :deep(svg) {
  transition: transform 0.2s ease;
}
.sidebar.collapsed .sidebar-toggle :deep(svg) {
  transform: rotate(180deg);
}
.sidebar-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px 22px;
}
.sidebar-brand .brand-mini {
  width: 100%;
  max-width: 52px;
  height: auto;
  min-width: 0;
}
.sidebar.collapsed .sidebar-brand {
  padding-left: 0;
  padding-right: 0;
}
.sidebar:not(.collapsed) .sidebar-brand {
  /* Alto fijo = el mismo que ocupaba el logo pequeño, para que el nav no se
     desplace: el logo más grande se centra y desborda ese alto visualmente. */
  height: 80px;
  overflow: visible;
}
.sidebar:not(.collapsed) .sidebar-brand .brand-mini {
  max-width: 104px;
  padding: 10px;
  box-sizing: border-box;
}
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 13px;
  border-radius: 11px;
  color: var(--sidebar-text);
  font-size: 13.5px;
  font-weight: 500;
  transition: 0.15s;
  position: relative;
  text-align: left;
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
}
.nav-item :deep(svg) {
  flex-shrink: 0;
}
.nav-item:hover {
  background: var(--sidebar-hover-bg);
  color: var(--sidebar-hover-text);
}
.nav-item.active {
  background: var(--sidebar-active-bg);
  color: var(--sidebar-active-text);
  font-weight: 700;
}
.nav-item.active:hover {
  background: var(--sidebar-active-bg);
  color: var(--sidebar-active-text);
}
.sidebar-user {
  border-top: 1px solid var(--sidebar-border);
  padding-top: 14px;
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.sidebar-user .avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
}
.sidebar-user .info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
}
.sidebar-user .info b {
  color: var(--text);
  font-size: 12.5px;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sidebar-user .info span {
  color: var(--sidebar-text);
  font-size: 10.5px;
}
.sidebar-user button {
  color: var(--sidebar-text);
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}
.sidebar-user button:hover {
  background: var(--danger-light);
  color: var(--danger);
}

.sidebar.collapsed {
  width: 76px;
  padding-left: 14px;
  padding-right: 14px;
}
.sidebar.collapsed .nav-item span,
.sidebar.collapsed .sidebar-user .info {
  display: none;
}
.sidebar.collapsed .nav-item {
  justify-content: center;
  gap: 0;
}
.sidebar.collapsed .sidebar-user {
  flex-direction: column;
  gap: 8px;
}

@media (max-width: 980px) {
  .sidebar {
    width: 100%;
    flex-direction: row;
    align-items: center;
    padding: 12px 16px;
    gap: 16px;
    overflow-x: auto;
  }
  .sidebar-brand {
    padding: 0;
    flex-shrink: 0;
  }
  .sidebar-nav {
    flex-direction: row;
    flex: none;
  }
  .sidebar-user {
    border-top: none;
    margin-top: 0;
    padding-top: 0;
    flex-shrink: 0;
  }
}
</style>
