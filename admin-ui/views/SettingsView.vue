<template>
  <AppLayout>
    <div class="page animate-fade-in">
      <div class="page-header">
        <div>
          <div class="title-row">
            <h2>System Settings</h2>
          </div>
          <p class="page-sub">Configure global settings, SMTP email servers, and password reset preferences.</p>
        </div>
      </div>

      <div class="settings-grid">
        <!-- SMTP Config Card -->
        <div class="card settings-card animate-fade-in-right">
          <div class="card-header">
            <span class="card-icon">✉️</span>
            <div>
              <h3>SMTP Email Configuration</h3>
              <p class="card-desc">Required to send password reset links and platform notifications.</p>
            </div>
          </div>

          <div class="divider"></div>

          <div class="card-body">
            <div class="form-row form-row-2">
              <div class="form-group">
                <label class="form-label">SMTP Host</label>
                <input type="text" v-model="smtp.smtp_host" class="input" placeholder="e.g. smtp.gmail.com" />
              </div>
              <div class="form-row form-row-2">
                <div class="form-group">
                  <label class="form-label">SMTP Port</label>
                  <input type="text" v-model="smtp.smtp_port" class="input" placeholder="e.g. 587" />
                </div>
                <div class="form-group">
                  <label class="form-label">Connection Security</label>
                  <select v-model="smtp.smtp_secure" class="input">
                    <option value="false">STARTTLS / TLS (Port 587)</option>
                    <option value="true">SSL (Port 465)</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="form-row form-row-2" style="margin-top: 16px;">
              <div class="form-group">
                <label class="form-label">SMTP Username</label>
                <input type="text" v-model="smtp.smtp_user" class="input" placeholder="e.g. user@domain.com" />
              </div>
              <div class="form-group">
                <label class="form-label">SMTP Password</label>
                <input type="password" v-model="smtp.smtp_pass" class="input" placeholder="••••••••" />
              </div>
            </div>

            <div class="form-group" style="margin-top: 16px;">
              <label class="form-label">Sender Email (From Address)</label>
              <input type="email" v-model="smtp.smtp_from" class="input" placeholder="e.g. noreply@yourdomain.com" />
            </div>

            <div class="action-row" style="margin-top: 24px;">
              <button class="btn btn-primary" :disabled="saving" @click="saveSmtp">
                <span v-if="saving" class="btn-spinner"></span>
                Save SMTP Settings
              </button>
            </div>
          </div>
        </div>

        <!-- SMTP Test Card -->
        <div class="card settings-card animate-fade-in-right" style="animation-delay: 0.1s;">
          <div class="card-header">
            <span class="card-icon">🧪</span>
            <div>
              <h3>Test SMTP Settings</h3>
              <p class="card-desc">Send a verification email to verify your mail server credentials work correctly.</p>
            </div>
          </div>

          <div class="divider"></div>

          <div class="card-body">
            <div class="form-group">
              <label class="form-label">Destination Email Address</label>
              <input type="email" v-model="testEmail" class="input" placeholder="e.g. admin@domain.com" />
            </div>

            <div class="action-row" style="margin-top: 24px;">
              <button class="btn btn-ghost" :disabled="testing || !testEmail" @click="testSmtp">
                <span v-if="testing" class="btn-spinner"></span>
                Send Test Email
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, onMounted, inject } from 'vue'
import axios from 'axios'
import AppLayout from '../components/AppLayout.vue'

const toast = inject('toast')
const saving = ref(false)
const testing = ref(false)

const smtp = reactive({
  smtp_host: '',
  smtp_port: '587',
  smtp_user: '',
  smtp_pass: '',
  smtp_from: 'noreply@yourdomain.com',
  smtp_secure: 'false',
  smtp_pass_configured: false
})

const testEmail = ref('')

onMounted(() => {
  fetchSmtpSettings()
})

async function fetchSmtpSettings() {
  try {
    const res = await axios.get('/api/admin/settings/smtp')
    Object.assign(smtp, res.data)
    if (res.data.smtp_pass_configured) {
      smtp.smtp_pass = '••••••••'
    }
  } catch (err) {
    toast('Failed to load SMTP settings', 'error')
  }
}

async function saveSmtp() {
  saving.value = true
  try {
    await axios.put('/api/admin/settings/smtp', smtp)
    toast('SMTP settings saved successfully', 'success')
    fetchSmtpSettings()
  } catch (err) {
    toast(err.response?.data?.error || 'Failed to save SMTP settings', 'error')
  } finally {
    saving.value = false
  }
}

async function testSmtp() {
  testing.value = true
  try {
    const payload = { ...smtp, test_email: testEmail.value }
    const res = await axios.post('/api/admin/settings/smtp/test', payload)
    toast(res.data.message || 'Test email sent successfully!', 'success')
  } catch (err) {
    toast(err.response?.data?.error || 'SMTP Test failed', 'error')
  } finally {
    testing.value = false
  }
}
</script>

<style scoped>
.page {
  padding: 30px;
}
.page-header {
  margin-bottom: 28px;
}
.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.page-sub {
  font-size: 13px;
  color: var(--text2);
  margin-top: 4px;
}
.settings-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  max-width: 800px;
}
.settings-card {
  padding: 24px;
}
.card-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}
.card-icon {
  font-size: 24px;
  background: var(--bg3);
  padding: 8px;
  border-radius: 10px;
  line-height: 1;
}
.card-desc {
  font-size: 12px;
  color: var(--text2);
  margin-top: 2px;
}
.divider {
  height: 1px;
  background: var(--border);
  margin: 16px 0;
}
.action-row {
  display: flex;
  justify-content: flex-end;
}
.btn-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
  margin-right: 6px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
