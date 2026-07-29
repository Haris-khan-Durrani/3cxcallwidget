<template>
  <AppLayout>
    <div class="page animate-fade-in">
      <div class="page-header">
        <div class="title-row">
          <h2>Native AI Agents</h2>
          <span class="count-badge" v-if="!loading">{{ agents.length }}</span>
        </div>
        <button class="btn btn-primary new-widget-btn" @click="openCreate">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Create AI Agent
        </button>
      </div>

      <div v-if="loading" style="display:flex; justify-content:center; padding: 40px;">
        <div class="spinner"></div>
      </div>

      <div v-else-if="agents.length === 0" class="empty card animate-fade-in">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
        </svg>
        <h3>No AI Agents Configured</h3>
        <p>Map your 3CX Native AI Agents to manage runtime settings and API access.</p>
        <button class="btn btn-primary" @click="openCreate">Create AI Agent</button>
      </div>

      <div v-else class="widgets-grid animate-fade-in">
        <div v-for="agent in agents" :key="agent.id" class="card dialer-card">
          <div class="dialer-header">
            <div>
              <h3>{{ agent.name }}</h3>
              <div class="meta-row">
                <span class="badge badge-green">FQDN: {{ agent.fqdn_3cx }}</span>
                <span class="badge badge-blue">Ext: {{ agent.threecx_extension }}</span>
                <span :class="['badge', agent.status === 'active' ? 'badge-green' : 'badge-orange']">
                  {{ agent.status.toUpperCase() }}
                </span>
              </div>
            </div>
            <div class="dialer-actions">
              <button class="btn btn-accent btn-sm" @click="testCallPrompt(agent)" style="margin-right: 8px;">Test Call</button>
              <button class="btn btn-ghost btn-sm" @click="openEdit(agent)" style="margin-right: 8px;">Edit</button>
              <button class="btn btn-danger btn-sm" @click="confirmDelete(agent.id)">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Agent Modal -->
    <teleport to="body">
      <transition name="fade">
        <div class="modal-backdrop" v-if="showModal" @click.self="showModal = false">
          <transition name="slide-up">
            <div class="modal-box" v-if="showModal">
              <div class="modal-header">
                <h3>{{ editMode ? 'Edit AI Agent' : 'Create AI Agent' }}</h3>
                <button class="btn btn-icon btn-ghost" @click="showModal = false">✕</button>
              </div>
              <div class="modal-body">
                <div class="form-group">
                  <label class="form-label">Agent Name</label>
                  <input v-model="form.name" type="text" class="input" placeholder="e.g. Main Support AI" />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Company ID</label>
                  <input v-model.number="form.company_id" type="number" class="input" placeholder="e.g. 1" />
                </div>

                <div class="form-group">
                  <label class="form-label">3CX PBX FQDN</label>
                  <input v-model="form.fqdn_3cx" type="text" class="input" placeholder="e.g. company.3cx.us" />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Client ID</label>
                  <input v-model="form.client_id_3cx" type="text" class="input" placeholder="3CX System Owner Client ID" />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Client Secret</label>
                  <input v-model="form.client_secret_3cx" type="password" class="input" placeholder="3CX System Owner Client Secret" />
                </div>

                <div class="form-group">
                  <label class="form-label">3CX Extension Number</label>
                  <input v-model="form.threecx_extension" type="text" class="input" placeholder="e.g. 700" />
                </div>

                <!-- Test 3CX Connection Button & Result -->
                <div style="margin-top: 16px;">
                  <button 
                    type="button" 
                    class="btn btn-ghost" 
                    :disabled="testingConn || !editMode" 
                    @click="testConnection(form.id)"
                    style="width: 100%; justify-content: center; height: 38px; font-weight: 600;"
                  >
                    <span v-if="testingConn">⏳ Verifying Agent...</span>
                    <span v-else>🔌 Verify Agent on 3CX</span>
                  </button>
                  <p v-if="!editMode" class="help-text" style="text-align: center; margin-top: 4px;">Save the agent first to enable verification.</p>

                  <div v-if="testResult" :class="['conn-result', testResult.ok ? 'ok' : 'err']" style="margin-top: 10px;">
                    <span>{{ testResult.ok ? '✅' : '❌' }} {{ testResult.message }}</span>
                  </div>
                </div>
              </div>
              
              <div class="modal-footer">
                <button class="btn btn-ghost" @click="showModal = false">Cancel</button>
                <button class="btn btn-primary" :disabled="saving" @click="save">
                  {{ saving ? 'Saving...' : (editMode ? 'Save Changes' : 'Create Agent') }}
                </button>
              </div>
            </div>
          </transition>
        </div>
      </transition>
    </teleport>

    <!-- Test Call Modal -->
    <teleport to="body">
      <transition name="fade">
        <div class="modal-backdrop" v-if="showTestCallModal" @click.self="showTestCallModal = false">
          <transition name="slide-up">
            <div class="modal-box" v-if="showTestCallModal">
              <div class="modal-header">
                <h3>Test AI Call</h3>
                <button class="btn btn-icon btn-ghost" @click="showTestCallModal = false">✕</button>
              </div>
              <div class="modal-body">
                <p class="help-text">Initiate an outbound call from the AI agent to this phone number.</p>
                <div class="form-group">
                  <label class="form-label">Destination Phone Number</label>
                  <input v-model="testPhone" type="text" class="input" placeholder="e.g. +1234567890" />
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn btn-ghost" @click="showTestCallModal = false">Cancel</button>
                <button class="btn btn-primary" :disabled="initiatingCall || !testPhone" @click="executeTestCall">
                  {{ initiatingCall ? 'Calling...' : 'Call Now' }}
                </button>
              </div>
            </div>
          </transition>
        </div>
      </transition>
    </teleport>

  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import AppLayout from '../components/AppLayout.vue'

const agents = ref([])
const loading = ref(true)
const showModal = ref(false)
const showTestCallModal = ref(false)
const editMode = ref(false)
const saving = ref(false)
const testingConn = ref(false)
const initiatingCall = ref(false)
const testResult = ref(null)
const testPhone = ref('')
const activeAgent = ref(null)

const form = ref({
  id: null,
  company_id: null,
  name: '',
  fqdn_3cx: '',
  client_id_3cx: '',
  client_secret_3cx: '',
  threecx_extension: ''
})

const fetchAgents = async () => {
  try {
    loading.value = true
    const res = await axios.get('/api/v1/native-ai/agents')
    agents.value = res.data
  } catch (err) {
    console.error('Failed to load agents:', err)
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  editMode.value = false
  form.value = {
    id: null,
    company_id: null,
    name: '',
    fqdn_3cx: '',
    client_id_3cx: '',
    client_secret_3cx: '',
    threecx_extension: ''
  }
  testResult.value = null
  showModal.value = true
}

const openEdit = (agent) => {
  editMode.value = true
  form.value = { ...agent }
  testResult.value = null
  showModal.value = true
}

const save = async () => {
  try {
    saving.value = true
    if (editMode.value) {
      await axios.patch(`/api/v1/native-ai/agents/${form.value.id}`, form.value)
    } else {
      await axios.post('/api/v1/native-ai/agents', form.value)
    }
    showModal.value = false
    await fetchAgents()
  } catch (err) {
    alert('Failed to save agent: ' + (err.response?.data?.error || err.message))
  } finally {
    saving.value = false
  }
}

const confirmDelete = async (id) => {
  if (!confirm('Are you sure you want to delete this AI Agent mapping?')) return
  try {
    await axios.delete(`/api/v1/native-ai/agents/${id}`)
    await fetchAgents()
  } catch (err) {
    alert('Failed to delete agent')
  }
}

const testConnection = async (id) => {
  if (!id) return
  testingConn.value = true
  testResult.value = null
  try {
    const res = await axios.post(`/api/v1/native-ai/agents/${id}/verify`)
    testResult.value = { ok: true, message: res.data.message }
    // Reload agents to update status in UI
    fetchAgents()
  } catch (err) {
    testResult.value = { ok: false, message: err.response?.data?.error || err.message }
  } finally {
    testingConn.value = false
  }
}

const testCallPrompt = (agent) => {
  activeAgent.value = agent
  testPhone.value = ''
  showTestCallModal.value = true
}

const executeTestCall = async () => {
  if (!activeAgent.value || !testPhone.value) return
  initiatingCall.value = true
  try {
    await axios.post(`/api/v1/native-ai/agents/${activeAgent.value.id}/test-call`, {
      client_phone: testPhone.value
    })
    alert('Test call initiated successfully!')
    showTestCallModal.value = false
  } catch (err) {
    alert('Test call failed: ' + (err.response?.data?.error || err.message))
  } finally {
    initiatingCall.value = false
  }
}

onMounted(() => {
  fetchAgents()
})
</script>

<style scoped>
/* Inherits global dashboard styles from style.css */
</style>
