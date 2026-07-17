<template>
  <div class="reset-page">
    <div class="login-bg">
      <div class="bg-glow bg-glow-1"></div>
      <div class="bg-glow bg-glow-2"></div>
    </div>
    <div class="login-card card">
      <div class="login-header">
        <div class="login-logo">
          <div class="logo-box">🔒</div>
        </div>
        <h1>Create New Password</h1>
        <p>Enter a secure new password for your account</p>
      </div>

      <!-- Success State -->
      <div v-if="success" class="success-state">
        <div class="success-icon">✅</div>
        <h3>Password Reset Complete</h3>
        <p>Your password has been successfully updated. You can now sign in with your new credentials.</p>
        <button class="btn btn-accent btn-lg btn-block" style="margin-top: 16px;" @click="goToLogin">
          Go to Sign In
        </button>
      </div>

      <!-- Form State -->
      <form v-else @submit.prevent="submit" class="login-form">
        <div class="form-group">
          <label class="form-label">New Password</label>
          <input v-model="form.password" type="password" class="input" placeholder="••••••••" autocomplete="new-password" required />
        </div>
        <div class="form-group">
          <label class="form-label">Confirm Password</label>
          <input v-model="form.confirmPassword" type="password" class="input" placeholder="••••••••" autocomplete="new-password" required />
        </div>

        <transition name="slide-up">
          <div v-if="error" class="login-error">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
            {{ error }}
          </div>
        </transition>

        <button type="submit" class="btn btn-accent btn-lg btn-block" :disabled="loading || !form.password || !form.confirmPassword">
          <span v-if="loading">Updating Password...</span>
          <span v-else>Reset Password →</span>
        </button>

        <a href="javascript:void(0)" class="back-link" @click="goToLogin">
          ← Cancel and Return to Login
        </a>
      </form>

      <p class="login-footer">3CX Call Connect Platform</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const route = useRoute()

const form = reactive({ password: '', confirmPassword: '' })
const loading = ref(false)
const error = ref('')
const success = ref(false)
const token = ref('')

onMounted(() => {
  // Grab token from URL query params: ?token=xyz
  token.value = route.query.token || ''
  if (!token.value) {
    error.value = 'Password reset token is missing. Please request a new password reset link.'
  }
})

async function submit() {
  if (form.password !== form.confirmPassword) {
    error.value = 'Passwords do not match'
    return
  }
  if (form.password.length < 6) {
    error.value = 'Password must be at least 6 characters long'
    return
  }

  loading.value = true
  error.value = ''
  try {
    await axios.post('/api/admin/reset-password', {
      token: token.value,
      password: form.password
    })
    success.value = true
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to reset password. The link may have expired.'
  } finally {
    loading.value = false
  }
}

function goToLogin() {
  router.push('/login')
}
</script>

<style scoped>
.reset-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; background: var(--bg); }
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
.login-error { display: flex; align-items: center; gap: 7px; background: rgba(248,81,73,.1); border: 1px solid rgba(248,81,73,.25); color: var(--red); padding: 10px 14px; border-radius: var(--radius); font-size: 13px; }
.back-link { font-size: 12px; color: var(--text2); text-decoration: none; text-align: center; margin-top: 8px; display: block; font-weight: 500; }
.back-link:hover { color: var(--text); }
.login-footer { text-align: center; color: var(--text3); font-size: 12px; margin-top: 24px; }

.success-state {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.success-icon {
  font-size: 44px;
}
.success-state h3 {
  font-size: 16px;
  font-weight: 700;
}
.success-state p {
  font-size: 13px;
  color: var(--text2);
}
</style>
