import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import axios from 'axios'
import App from './App.vue'
import LoginView from './views/LoginView.vue'
import WidgetsView from './views/WidgetsView.vue'
import BuilderView from './views/BuilderView.vue'
import ReportsView from './views/ReportsView.vue'
import DocsView from './views/DocsView.vue'
import DialersView from './views/DialersView.vue'
import DialerReportsView from './views/DialerReportsView.vue'
import './style.css'

// Restore auth header after page refresh (interceptor approach — works even with cached JS)
const _savedToken = localStorage.getItem('admin_token')
if (_savedToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${_savedToken}`
}
// Belt-and-suspenders: interceptor always injects fresh token on every request
axios.interceptors.request.use(config => {
  const t = localStorage.getItem('admin_token')
  if (t) config.headers['Authorization'] = `Bearer ${t}`
  return config
})

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/login', component: LoginView },
    { path: '/', redirect: '/widgets' },
    { path: '/widgets', component: WidgetsView, meta: { requiresAuth: true } },
    { path: '/builder/:id', component: BuilderView, meta: { requiresAuth: true } },
    { path: '/dialers', component: DialersView, meta: { requiresAuth: true } },
    { path: '/reports', component: ReportsView, meta: { requiresAuth: true } },
    { path: '/dialer-reports', component: DialerReportsView, meta: { requiresAuth: true } },
    { path: '/docs', component: DocsView, meta: { requiresAuth: true } }
  ]
})

router.beforeEach((to) => {
  const token = localStorage.getItem('admin_token')
  if (to.meta.requiresAuth && !token) return '/login'
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
