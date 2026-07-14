<template>
  <div class="login-page">
    <div class="login-bg">
      <div class="bg-glow bg-glow-1"></div>
      <div class="bg-glow bg-glow-2"></div>
    </div>
    <div class="login-card card">
      <div class="login-header">
        <div class="login-logo">
          <div class="logo-box">📞</div>
        </div>
        <h1>3CX Widget Admin</h1>
        <p>Sign in to manage your call widgets</p>
      </div>

      <form @submit.prevent="submit" class="login-form">
        <div class="form-group">
          <label class="form-label">Username</label>
          <input v-model="form.username" type="text" class="input" placeholder="admin" autocomplete="username" required />
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <div class="password-wrap">
            <input v-model="form.password" :type="showPass ? 'text' : 'password'" class="input" placeholder="••••••••" autocomplete="current-password" required />
            <button type="button" class="pass-toggle" @click="showPass = !showPass">
              {{ showPass ? '🙈' : '👁' }}
            </button>
          </div>
        </div>

        <transition name="slide-up">
          <div v-if="error" class="login-error">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
            {{ error }}
          </div>
        </transition>

        <button type="submit" class="btn btn-accent btn-lg btn-block" :disabled="loading">
          <span v-if="loading">Signing in...</span>
          <span v-else>Sign In →</span>
        </button>
      </form>

      <p class="login-footer">3CX Call Connect Platform</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores'

const router = useRouter()
const auth = useAuthStore()
const form = reactive({ username: '', password: '' })
const loading = ref(false)
const error = ref('')
const showPass = ref(false)

async function submit() {
  loading.value = true
  error.value = ''
  try {
    await auth.login(form.username, form.password)
    router.push('/widgets')
  } catch {
    error.value = 'Invalid username or password'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; background: var(--bg); }
.login-bg { position: absolute; inset: 0; pointer-events: none; }
.bg-glow { position: absolute; border-radius: 50%; filter: blur(100px); opacity: .12; }
.bg-glow-1 { width: 500px; height: 500px; background: #1f6feb; top: -100px; right: -100px; }
.bg-glow-2 { width: 400px; height: 400px; background: #238636; bottom: -100px; left: -80px; }
.login-card { padding: 40px; width: 100%; max-width: 420px; position: relative; }
.login-header { text-align: center; margin-bottom: 32px; }
.login-logo { margin-bottom: 16px; }
.logo-box { display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: linear-gradient(135deg, #1f6feb, #388bfd); border-radius: 16px; font-size: 26px; box-shadow: 0 8px 24px rgba(31,111,235,.4); }
.login-header h1 { font-size: 22px; font-weight: 800; margin-bottom: 6px; }
.login-header p { color: var(--text2); font-size: 13px; }
.login-form { display: flex; flex-direction: column; gap: 16px; }
.password-wrap { position: relative; }
.password-wrap .input { padding-right: 40px; }
.pass-toggle { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 15px; color: var(--text2); }
.login-error { display: flex; align-items: center; gap: 7px; background: rgba(248,81,73,.1); border: 1px solid rgba(248,81,73,.25); color: var(--red); padding: 10px 14px; border-radius: var(--radius); font-size: 13px; }
.login-footer { text-align: center; color: var(--text3); font-size: 12px; margin-top: 24px; }
</style>
