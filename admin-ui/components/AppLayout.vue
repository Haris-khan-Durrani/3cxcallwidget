<template>
  <div class="layout" :class="{ 'sidebar-collapsed': collapsed }">
    <aside class="sidebar">
      <div class="sidebar-top">
        <div class="logo">
          <div class="logo-icon">📞</div>
          <span v-if="!collapsed" class="logo-text">3CX Widgets</span>
        </div>
        <button class="collapse-btn btn btn-icon btn-ghost" @click="collapsed = !collapsed" :title="collapsed ? 'Expand' : 'Collapse'">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path v-if="!collapsed" d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z"/>
            <path v-else d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/>
          </svg>
        </button>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-label" v-if="!collapsed">MENU</div>
        <router-link to="/widgets" class="nav-link" active-class="active">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
          <span v-if="!collapsed">Widgets</span>
        </router-link>
        <router-link to="/reports" class="nav-link" active-class="active">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zM16.2 13h2.8v6h-2.8v-6z"/></svg>
          <span v-if="!collapsed">Reports</span>
        </router-link>
      </nav>

      <div class="sidebar-bottom">
        <div class="user-row" v-if="!collapsed" style="display: flex; align-items: center; gap: 10px; width: 100%;">
          <div class="user-avatar">A</div>
          <span class="user-name">Admin</span>
          <button class="btn btn-icon btn-ghost theme-toggle" @click="toggleTheme" title="Toggle Theme" style="margin-left: auto; width: 28px; height: 28px; padding: 0; font-size: 14px;">
            {{ isLight ? '🌙' : '☀️' }}
          </button>
        </div>
        <button v-else class="btn btn-icon btn-ghost btn-block" @click="toggleTheme" title="Toggle Theme" style="margin-bottom: 8px; width: 100%; height: 36px; padding: 0; font-size: 14px;">
          {{ isLight ? '🌙' : '☀️' }}
        </button>
        <button class="btn btn-danger btn-sm btn-block" @click="logout" style="margin-top:8px;">
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
          <span v-if="!collapsed">Sign out</span>
        </button>
      </div>
    </aside>

    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores'

const router = useRouter()
const auth = useAuthStore()
const collapsed = ref(false)

const isLight = ref(localStorage.getItem('cx-dashboard-theme') === 'light')

onMounted(() => {
  if (isLight.value) {
    document.documentElement.classList.add('light-theme')
  } else {
    document.documentElement.classList.remove('light-theme')
  }
})

function toggleTheme() {
  isLight.value = !isLight.value
  if (isLight.value) {
    document.documentElement.classList.add('light-theme')
    localStorage.setItem('cx-dashboard-theme', 'light')
  } else {
    document.documentElement.classList.remove('light-theme')
    localStorage.setItem('cx-dashboard-theme', 'dark')
  }
}

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout { display: flex; height: 100vh; overflow: hidden; }
.sidebar { width: 220px; background: var(--bg2); border-right: 1px solid var(--border); display: flex; flex-direction: column; transition: width .25s ease; flex-shrink: 0; overflow: hidden; }
.layout.sidebar-collapsed .sidebar { width: 60px; }
.sidebar-top { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid var(--border); }
.logo { display: flex; align-items: center; gap: 10px; overflow: hidden; }
.logo-icon { width: 32px; height: 32px; background: linear-gradient(135deg, #1f6feb, #8b949e); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
.logo-text { font-weight: 700; font-size: 15px; white-space: nowrap; }
.collapse-btn { flex-shrink: 0; }
.sidebar-nav { flex: 1; padding: 12px 8px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }
.nav-section-label { font-size: 10px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 1px; padding: 8px 8px 4px; }
.nav-link { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 8px; color: var(--text2); text-decoration: none; font-weight: 500; font-size: 13px; transition: var(--transition); white-space: nowrap; overflow: hidden; }
.nav-link:hover { background: var(--bg3); color: var(--text); }
.nav-link.active { background: rgba(31,111,235,.18); color: var(--accent); }
.sidebar-bottom { padding: 12px; border-top: 1px solid var(--border); }
.user-row { display: flex; align-items: center; gap: 10px; padding: 6px 0; }
.user-avatar { width: 28px; height: 28px; background: linear-gradient(135deg, #238636, #2ea043); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
.user-name { font-size: 13px; font-weight: 600; white-space: nowrap; }
.main-content { flex: 1; overflow-y: auto; background: var(--bg); }
</style>
