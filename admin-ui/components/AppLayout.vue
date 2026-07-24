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
        <router-link to="/dialers" class="nav-link" active-class="active">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
          <span v-if="!collapsed">Dialer Widgets</span>
        </router-link>
        <router-link to="/reports" class="nav-link" active-class="active">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zM16.2 13h2.8v6h-2.8v-6z"/></svg>
          <span v-if="!collapsed">Widget Reports</span>
        </router-link>
        <router-link to="/dialer-reports" class="nav-link" active-class="active">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
          <span v-if="!collapsed">Dialer Reports</span>
        </router-link>
        <router-link to="/ai-credentials" class="nav-link" active-class="active">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
          <span v-if="!collapsed">AI Credentials</span>
        </router-link>
        <router-link to="/ai-campaigns" class="nav-link" active-class="active">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm4.24 16L12 15.45 7.77 18l1.12-4.81-3.73-3.23 4.92-.42L12 5l1.92 4.53 4.92.42-3.73 3.23L16.23 18z"/></svg>
          <span v-if="!collapsed">AI Campaigns</span>
        </router-link>
        <router-link to="/ai-history" class="nav-link" active-class="active">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
          <span v-if="!collapsed">AI Call History</span>
        </router-link>
        <router-link to="/docs" class="nav-link" active-class="active">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
          <span v-if="!collapsed">Developer Docs</span>
        </router-link>
        <router-link to="/users" class="nav-link" active-class="active">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          <span v-if="!collapsed">System Users</span>
        </router-link>
        <router-link to="/settings" class="nav-link" active-class="active">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
          <span v-if="!collapsed">Settings</span>
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
