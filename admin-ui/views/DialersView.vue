<template>
  <AppLayout>
    <div class="page animate-fade-in">
      <div class="page-header">
        <div class="title-row">
          <h2>Dialer Widgets</h2>
          <span class="count-badge" v-if="!store.loading">{{ store.dialers.length }}</span>
        </div>
        <button class="btn btn-primary new-widget-btn" @click="openCreate">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Create Dialer
        </button>
      </div>

      <div v-if="store.loading" style="display:flex; justify-content:center; padding: 40px;">
        <div class="spinner"></div>
      </div>

      <div v-else-if="store.dialers.length === 0" class="empty card animate-fade-in">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
        </svg>
        <h3>No Dialer Widgets Yet</h3>
        <p>Create a dialer widget to embed a keypad inside GoHighLevel.</p>
        <button class="btn btn-primary" @click="openCreate">Create Dialer</button>
      </div>

      <div v-else class="widgets-grid animate-fade-in">
        <div v-for="dialer in store.dialers" :key="dialer.id" class="card dialer-card">
          <div class="dialer-header">
            <div>
              <h3>{{ dialer.name }}</h3>
              <div class="meta-row">
                <span class="badge badge-green">FQDN: {{ dialer.fqdn_3cx }}</span>
              </div>
            </div>
            <div class="dialer-actions">
              <button class="btn btn-accent btn-sm" @click="openAgents(dialer)" style="margin-right: 8px;">Agents Mapping</button>
              <button class="btn btn-ghost btn-sm" @click="openEdit(dialer)" style="margin-right: 8px;">Edit</button>
              <button class="btn btn-danger btn-sm" @click="confirmDelete(dialer.id)">Delete</button>
            </div>
          </div>
            <div class="dialer-body">
              <div class="embed-section">
                <div class="embed-tabs">
                  <button class="embed-tab" :class="{ active: embedTab[dialer.id] !== 'script' }" @click="setEmbedTab(dialer.id, 'url')">🔗 Embed URL</button>
                  <button class="embed-tab" :class="{ active: embedTab[dialer.id] === 'script' }" @click="setEmbedTab(dialer.id, 'script')">📋 Embed Script</button>
                </div>

                <!-- URL Tab -->
                <div v-if="embedTab[dialer.id] !== 'script'">
                  <p class="help-text">Use this URL in your GoHighLevel <strong>Custom Menu Link</strong>. Pass CRM merge tags to auto-fill the keypad.</p>
                  <div class="code-box">
                    <input type="text" readonly :value="getEmbedUrl(dialer)" class="embed-input" />
                    <button class="btn btn-accent btn-sm" @click="copy(getEmbedUrl(dialer))">Copy</button>
                  </div>
                </div>

                <!-- Script Tab -->
                <div v-if="embedTab[dialer.id] === 'script'">
                  <p class="help-text">Paste this <strong>&lt;script&gt;</strong> tag into any webpage or CRM custom HTML block. Replace the merge tags with your CRM variables.</p>
                  <div class="code-box code-box--script">
                    <textarea readonly class="embed-script" rows="4" :value="getEmbedScript(dialer)" />
                    <button class="btn btn-accent btn-sm" style="align-self:flex-start;" @click="copy(getEmbedScript(dialer))">Copy</button>
                  </div>
                  <p class="help-text" style="margin-top:8px;color:#94a3b8;">💡 Replace <code>&#123;&#123;user.id&#125;&#125;</code>, <code>&#123;&#123;user.extension&#125;&#125;</code> and <code>&#123;&#123;contact.phone&#125;&#125;</code> with your CRM's actual merge tags (e.g. GoHighLevel, HubSpot, etc.)</p>
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>

    <!-- Edit Dialer Modal -->
    <teleport to="body">
      <transition name="fade">
        <div class="modal-backdrop" v-if="showModal" @click.self="showModal = false">
          <transition name="slide-up">
            <div class="modal-box" v-if="showModal">
              <div class="modal-header">
                <h3>{{ editMode ? 'Edit Dialer Widget' : 'Create Dialer Widget' }}</h3>
                <button class="btn btn-icon btn-ghost" @click="showModal = false">✕</button>
              </div>
              <div class="modal-body">
                <div class="form-group">
                  <label class="form-label">Dialer Name</label>
                  <input v-model="form.name" type="text" class="input" placeholder="e.g. GHL Main Dialer" />
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
                  <label class="form-label">Location ID (GHL / CRM Location ID)</label>
                  <input v-model="form.location_id" type="text" class="input" placeholder="e.g. loc_abc12345" />
                  <p class="help-text" style="margin-top: 4px; font-size: 11px;">Location ID included in all dialer event webhooks.</p>
                </div>
                
                <div class="divider" style="margin: 16px 0; border-top: 1px solid rgba(128,128,128,0.2);"></div>
                <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600;">Webhook Event Notifications (Optional)</h4>
                <p class="help-text" style="margin-bottom: 16px; font-size: 12px; color: var(--text3);">Hit external URLs automatically when dialer events occur.</p>
                
                <!-- Webhook Tab Switcher -->
                <div class="webhook-tabs">
                  <button type="button" class="webhook-tab" :class="{ active: activeWebhookTab === 'initiated' }" @click="activeWebhookTab = 'initiated'">Initiated</button>
                  <button type="button" class="webhook-tab" :class="{ active: activeWebhookTab === 'connected' }" @click="activeWebhookTab = 'connected'">Connected</button>
                  <button type="button" class="webhook-tab" :class="{ active: activeWebhookTab === 'completed' }" @click="activeWebhookTab = 'completed'">Completed</button>
                  <button type="button" class="webhook-tab" :class="{ active: activeWebhookTab === 'failed' }" @click="activeWebhookTab = 'failed'">Failed</button>
                </div>

                <!-- Webhook Tab Contents -->
                <div v-if="activeWebhookTab === 'initiated'" class="form-group animate-fade-in">
                  <label class="form-label">Call Initiated Webhook URL</label>
                  <input v-model="form.webhook_initiated" type="text" class="input" placeholder="e.g. https://webhook.site/..." />
                  <p class="help-text" style="margin-top: 4px; font-size: 11px;">Fires immediately when the call is requested / placed.</p>
                </div>
                
                <div v-if="activeWebhookTab === 'connected'" class="form-group animate-fade-in">
                  <label class="form-label">Call Connected Webhook URL</label>
                  <input v-model="form.webhook_connected" type="text" class="input" placeholder="e.g. https://webhook.site/..." />
                  <p class="help-text" style="margin-top: 4px; font-size: 11px;">Fires when the customer answers and connection is established.</p>
                </div>
                
                <div v-if="activeWebhookTab === 'completed'" class="form-group animate-fade-in">
                  <label class="form-label">Call Completed Webhook URL (with Recording)</label>
                  <input v-model="form.webhook_completed" type="text" class="input" placeholder="e.g. https://webhook.site/..." />
                  <p class="help-text" style="margin-top: 4px; font-size: 11px;">Fires when the call completes. Includes duration and secure proxy recording download link.</p>
                </div>
                
                <div v-if="activeWebhookTab === 'failed'" class="form-group animate-fade-in">
                  <label class="form-label">Call Failed/Missed Webhook URL</label>
                  <input v-model="form.webhook_failed" type="text" class="input" placeholder="e.g. https://webhook.site/..." />
                  <p class="help-text" style="margin-top: 4px; font-size: 11px;">Fires if the call is missed, rejected, busy, or fails to connect.</p>
                </div>

                <!-- Custom Webhook Headers -->
                <div class="form-group" style="margin-top: 14px;">
                  <label class="form-label" style="display:flex; justify-content:space-between; align-items:center;">
                    <span>Custom HTTP Headers <span style="color:var(--text3)">(optional)</span></span>
                    <button type="button" class="btn btn-ghost btn-sm" @click="addDialerHeaderRow" style="padding:2px 8px; font-size:11px;">+ Add Header</button>
                  </label>
                  <p class="help-text" style="margin-bottom:8px;">Send custom HTTP headers (e.g. <code>x-api-key</code>, <code>Authorization</code>) with dialer webhooks.</p>
                  <div v-if="!dialerHeadersList.length" style="color:var(--text3); font-size:12px; font-style:italic;">No custom headers configured.</div>
                  <div v-else style="display:flex; flex-direction:column; gap:8px;">
                    <div v-for="(h, idx) in dialerHeadersList" :key="idx" style="display:flex; gap:8px; align-items:center;">
                      <input v-model="h.key" class="input" style="flex:1;" placeholder="Header Name (e.g. x-api-key)" />
                      <input v-model="h.value" class="input" style="flex:1;" placeholder="Header Value (e.g. secret123)" />
                      <button type="button" class="btn btn-danger btn-sm" @click="removeDialerHeaderRow(idx)" style="padding:4px 8px;">✕</button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn btn-ghost" @click="showModal = false">Cancel</button>
                <button class="btn btn-primary" :disabled="saving" @click="save">
                  {{ saving ? 'Saving...' : (editMode ? 'Save Changes' : 'Create Dialer') }}
                </button>
              </div>
            </div>
          </transition>
        </div>
      </transition>
    </teleport>

    <!-- Agents Mapping Modal -->
    <teleport to="body">
      <transition name="fade">
        <div class="modal-backdrop" v-if="showAgentsModal" @click.self="showAgentsModal = false">
          <transition name="slide-up">
            <div class="modal-box modal-box-lg" v-if="showAgentsModal">
              <div class="modal-header">
                <div>
                  <h3>Agent Mappings</h3>
                  <p class="help-text" style="margin: 4px 0 0 0;">Map CRM User IDs to 3CX Extensions for this dialer.</p>
                </div>
                <button class="btn btn-icon btn-ghost" @click="showAgentsModal = false">✕</button>
              </div>
              <div class="modal-body">
                <!-- Add Agent Form -->
                <form class="agent-form" @submit.prevent="addAgent" style="display:flex; flex-direction:column; gap:12px;">
                  <div style="display:flex; gap:12px;">
                    <div class="form-group" style="flex: 1;">
                      <label class="form-label">First Name</label>
                      <input v-model="newAgent.first_name" type="text" class="input" placeholder="e.g. Haris" />
                    </div>
                    <div class="form-group" style="flex: 1;">
                      <label class="form-label">Last Name</label>
                      <input v-model="newAgent.last_name" type="text" class="input" placeholder="e.g. Khan" />
                    </div>
                  </div>
                  <div style="display:flex; gap:12px;">
                    <div class="form-group" style="flex: 1;">
                      <label class="form-label">Agent ID (CRM User ID) *</label>
                      <input v-model="newAgent.crm_user_id" type="text" class="input" placeholder="e.g. user_abc123" required />
                    </div>
                    <div class="form-group" style="flex: 1;">
                      <label class="form-label">Agent Email *</label>
                      <input v-model="newAgent.email" type="email" class="input" placeholder="e.g. haris@company.com" required />
                    </div>
                    <div class="form-group" style="flex: 1;">
                      <label class="form-label">3CX Extension *</label>
                      <input v-model="newAgent.extension" type="text" class="input" placeholder="e.g. 750" required />
                    </div>
                  </div>
                  <div style="align-self: flex-end;">
                    <button type="submit" class="btn btn-primary" :disabled="addingAgent" style="height: 38px;">
                      {{ addingAgent ? 'Adding...' : 'Add Mapping' }}
                    </button>
                  </div>
                </form>

                <div class="divider"></div>

                <!-- Agents List -->
                <div v-if="loadingAgents" style="text-align:center; padding: 20px;">
                  <div class="spinner"></div>
                </div>
                <div v-else-if="agents.length === 0" class="empty-state">
                  <p>No agent mappings found for this dialer.</p>
                </div>
                <div v-else class="table-wrap">
                  <table class="table">
                    <thead>
                      <tr>
                        <th>Agent Name</th>
                        <th>Agent ID</th>
                        <th>Email</th>
                        <th>3CX Extension</th>
                        <th style="width: 80px; text-align: right;">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="a in agents" :key="a.id">
                        <td><strong>{{ a.first_name }} {{ a.last_name || '' }}</strong></td>
                        <td><code>{{ a.crm_user_id }}</code></td>
                        <td>{{ a.email || '-' }}</td>
                        <td><span class="badge badge-green">{{ a.extension }}</span></td>
                        <td style="text-align: right;">
                          <button class="btn btn-danger btn-sm" @click="deleteAgent(a.id)" title="Delete">✕</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </transition>
    </teleport>

  </AppLayout>
</template>

<script setup>
import { ref, reactive, onMounted, inject } from 'vue'
import axios from 'axios'
import AppLayout from '../components/AppLayout.vue'
import { useDialerStore } from '../stores'

const store = useDialerStore()
const toast = inject('toast')

// Dialer Modal state
const showModal = ref(false)
const saving = ref(false)
const editMode = ref(false)
const editingId = ref(null)
const activeWebhookTab = ref('initiated')

const form = reactive({
  name: '', fqdn_3cx: '', client_id_3cx: '', client_secret_3cx: '', location_id: '',
  webhook_initiated: '', webhook_connected: '', webhook_completed: '', webhook_failed: ''
})

// Agents Modal state
const showAgentsModal = ref(false)
const currentDialerId = ref(null)
const agents = ref([])
const loadingAgents = ref(false)
const addingAgent = ref(false)
const newAgent = reactive({ crm_user_id: '', extension: '', email: '', first_name: '', last_name: '' })

// Embed tab state per dialer — use ref + spread so Vue always detects the change
const embedTab = ref({})
function setEmbedTab(id, tab) { embedTab.value = { ...embedTab.value, [id]: tab } }

onMounted(() => store.fetch())

const dialerHeadersList = ref([])
function addDialerHeaderRow() { dialerHeadersList.value.push({ key: '', value: '' }) }
function removeDialerHeaderRow(idx) { dialerHeadersList.value.splice(idx, 1) }

function openCreate() {
  editMode.value = false
  editingId.value = null
  activeWebhookTab.value = 'initiated'
  dialerHeadersList.value = []
  Object.assign(form, { 
    name: '', fqdn_3cx: '', client_id_3cx: '', client_secret_3cx: '', location_id: '',
    webhook_initiated: '', webhook_connected: '', webhook_completed: '', webhook_failed: ''
  })
  showModal.value = true
}

function openEdit(dialer) {
  editMode.value = true
  editingId.value = dialer.id
  activeWebhookTab.value = 'initiated'
  Object.assign(form, { 
    name: dialer.name, 
    fqdn_3cx: dialer.fqdn_3cx, 
    client_id_3cx: dialer.client_id_3cx, 
    client_secret_3cx: dialer.client_secret_3cx,
    location_id: dialer.location_id || '',
    webhook_initiated: dialer.webhook_initiated || '',
    webhook_connected: dialer.webhook_connected || '',
    webhook_completed: dialer.webhook_completed || '',
    webhook_failed: dialer.webhook_failed || ''
  })
  if (dialer.webhook_headers) {
    try {
      const data = typeof dialer.webhook_headers === 'string' ? JSON.parse(dialer.webhook_headers) : dialer.webhook_headers
      if (Array.isArray(data)) dialerHeadersList.value = data.map(i => ({ key: i.key || '', value: i.value || '' }))
      else if (typeof data === 'object') dialerHeadersList.value = Object.entries(data).map(([key, value]) => ({ key, value }))
    } catch { dialerHeadersList.value = [] }
  } else {
    dialerHeadersList.value = []
  }
  showModal.value = true
}

async function save() {
  if (!form.name || !form.fqdn_3cx || !form.client_id_3cx || !form.client_secret_3cx) {
    return toast('All fields are required', 'error')
  }
  saving.value = true
  try {
    const filtered = dialerHeadersList.value.filter(h => h.key && h.key.trim()).map(h => ({ key: h.key.trim(), value: h.value || '' }))
    const webhook_headers = JSON.stringify(filtered)
    if (editMode.value) {
      await store.update(editingId.value, { ...form, webhook_headers })
      toast('Dialer updated successfully!')
    } else {
      await store.create({ ...form, webhook_headers })
      toast('Dialer created successfully!')
    }
    showModal.value = false
  } catch (err) { 
    toast(editMode.value ? 'Failed to update dialer' : 'Failed to create dialer', 'error') 
  } finally { 
    saving.value = false 
  }
}

function confirmDelete(id) {
  if (confirm('Are you sure you want to delete this dialer?')) {
    store.delete(id).then(() => toast('Dialer deleted'))
  }
}

function getEmbedUrl(dialer) {
  const origin = window.location.origin
  return `${origin}/dialer.html?id=${dialer.id}&userid={{user.id}}&ext={{user.extension}}&phone={{contact.phone}}`
}

function getEmbedScript(dialer) {
  const origin = window.location.origin
  return `<script src="${origin}/dialer-embed.js?id=${dialer.id}&userid={{user.id}}&ext={{user.extension}}&phone={{contact.phone}}"></sc` + `ript>`
}

function copy(text) {
  navigator.clipboard.writeText(text)
  toast('Copied to clipboard!')
}

// -- Agents Mapping Logic -- //
async function openAgents(dialer) {
  currentDialerId.value = dialer.id
  showAgentsModal.value = true
  await fetchAgents()
}

async function fetchAgents() {
  loadingAgents.value = true
  try {
    const res = await axios.get(`/api/admin/dialer-widgets/${currentDialerId.value}/agents`)
    agents.value = res.data
  } catch (err) {
    toast('Failed to load agents', 'error')
  } finally {
    loadingAgents.value = false
  }
}

async function addAgent() {
  if (!newAgent.crm_user_id || !newAgent.extension || !newAgent.email) {
    return toast('CRM User ID, extension, and email are required', 'error')
  }
  addingAgent.value = true
  try {
    await axios.post(`/api/admin/dialer-widgets/${currentDialerId.value}/agents`, { ...newAgent })
    toast('Mapping added')
    Object.assign(newAgent, { crm_user_id: '', extension: '', email: '', first_name: '', last_name: '' })
    fetchAgents()
  } catch (err) {
    toast('Failed to add mapping', 'error')
  } finally {
    addingAgent.value = false
  }
}

async function deleteAgent(agentId) {
  if (!confirm('Remove this mapping?')) return
  try {
    await axios.delete(`/api/admin/dialer-widgets/${currentDialerId.value}/agents/${agentId}`)
    toast('Mapping removed')
    fetchAgents()
  } catch (err) {
    toast('Failed to remove mapping', 'error')
  }
}
</script>

<style scoped>
.page { padding: 32px 40px; width: 100%; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; }
.title-row { display: flex; align-items: center; gap: 12px; }
.count-badge { display: inline-flex; align-items: center; justify-content: center; background: linear-gradient(135deg, rgba(31,111,235,0.15), rgba(63,185,80,0.15)); border: 1px solid rgba(88,166,255,0.25); color: var(--accent); font-size: 12px; font-weight: 700; padding: 2px 10px; border-radius: 20px; }

.new-widget-btn { background: linear-gradient(135deg, #238636, #2ea043); border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 4px 14px rgba(46,160,67,0.3); transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s ease, background 0.2s ease; }
.new-widget-btn:hover { transform: scale(1.04); box-shadow: 0 6px 20px rgba(46,160,67,0.5); background: linear-gradient(135deg, #2ea043, #34d058); }
.new-widget-btn:active { transform: scale(0.98); }

.widgets-grid { display: flex; flex-direction: column; gap: 20px; }
.dialer-card { padding: 20px; }
.dialer-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.dialer-header h3 { margin: 0 0 8px 0; font-size: 18px; }
.meta-row { display: flex; gap: 8px; }

.embed-section { background: var(--bg); padding: 16px; border-radius: 8px; border: 1px solid var(--border); }
.help-text { font-size: 13px; color: var(--text2); margin-top: 4px; margin-bottom: 12px; line-height: 1.5; }
.code-box { display: flex; gap: 8px; }
.embed-input { flex: 1; background: #1e1e1e; color: #d4d4d4; font-family: monospace; padding: 10px 14px; border-radius: 6px; border: 1px solid #333; font-size: 13px; outline: none; }

/* Modal */
.modal-backdrop { position: fixed; inset: 0; background: rgba(10, 12, 16, 0.6); backdrop-filter: blur(12px) saturate(180%); -webkit-backdrop-filter: blur(12px) saturate(180%); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
.modal-box { width: 100%; max-width: 500px; max-height: 90vh; display: flex; flex-direction: column; background: linear-gradient(135deg, var(--bg2), var(--bg3)); border: 1px solid rgba(128,128,128,0.2); box-shadow: 0 24px 60px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04); border-radius: var(--radius-lg); }
.modal-box-lg { max-width: 600px; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 24px 24px 8px; flex-shrink: 0; }
.modal-header h3 { font-size: 18px; font-weight: 700; margin: 0; }
.modal-body { padding: 16px 24px 24px; display: flex; flex-direction: column; gap: 18px; overflow-y: auto; }
.modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px 24px; border-top: 1px solid rgba(128,128,128,0.1); }

.agent-form { display: flex; gap: 12px; align-items: flex-start; }
.table-wrap { border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
.table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
.table th { padding: 10px 14px; background: var(--bg); color: var(--text2); font-weight: 600; border-bottom: 1px solid var(--border); }
.table td { padding: 10px 14px; border-bottom: 1px solid var(--border); vertical-align: middle; }
.table tr:last-child td { border-bottom: none; }
.table tr:hover { background: var(--bg3); }
.empty-state { padding: 30px; text-align: center; color: var(--text3); font-style: italic; font-size: 13px; }

/* Embed Tabs */
.embed-tabs { display: flex; gap: 6px; margin-bottom: 12px; }
.embed-tab {
  padding: 5px 14px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text2);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s;
}
.embed-tab.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}
.code-box--script { align-items: flex-start; gap: 10px; }
.embed-script {
  flex: 1;
  width: 100%;
  background: #0f172a;
  color: #7dd3fc;
  border: none;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 11px;
  font-family: 'Fira Code', 'Courier New', monospace;
  resize: none;
  line-height: 1.6;
}

/* Webhook Tabs */
.webhook-tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid rgba(128,128,128,0.15); padding-bottom: 8px; flex-wrap: wrap; }
.webhook-tab {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text3);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.webhook-tab:hover {
  color: var(--text2);
  background: rgba(255,255,255,0.05);
}
.webhook-tab.active {
  color: var(--accent);
  border-color: rgba(31,111,235,0.2);
  background: rgba(31,111,235,0.1);
}
</style>
