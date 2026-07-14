<template>
  <router-view />
  <Teleport to="body">
    <transition name="fade">
      <div v-if="toast.show" class="toast" :class="`toast-${toast.type}`">
        <span>{{ toast.type === 'success' ? '✅' : '❌' }}</span>
        {{ toast.message }}
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { reactive, provide, onMounted } from 'vue'
import axios from 'axios'
import { useAuthStore } from './stores'

const auth = useAuthStore()
if (auth.token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`
}

const toast = reactive({ show: false, message: '', type: 'success' })
let toastTimer = null

function showToast(message, type = 'success') {
  toast.message = message
  toast.type = type
  toast.show = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.show = false }, 3200)
}

provide('toast', showToast)
</script>

<style>
.toast {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 8px 32px rgba(0,0,0,.5);
  background: var(--bg3);
  border: 1px solid var(--border);
  max-width: 340px;
}
.toast-success { border-left: 3px solid var(--green); }
.toast-error { border-left: 3px solid var(--red); }
.toast-info { border-left: 3px solid var(--accent); }
</style>
