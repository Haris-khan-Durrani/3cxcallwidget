<template>
  <div class="widget-card card animate-card-fade-in">
    <!-- Header -->
    <div class="wc-header">
      <div class="wc-title-row">
        <div class="wc-dot"></div>
        <div>
          <h3 class="wc-name">{{ widget.name }}</h3>
          <span class="wc-fqdn">
            <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11" style="display:inline-block; vertical-align:text-bottom; margin-right:4px; opacity:0.6;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
            {{ widget.fqdn_3cx }}
          </span>
        </div>
        <div class="wc-badges">
          <span class="badge badge-green">
            <span class="badge-dot badge-dot-green"></span>
            Live
          </span>
          <span v-if="widget.webhook_url_n8n" class="badge badge-blue">
            <span class="badge-dot badge-dot-blue"></span>
            Webhook
          </span>
        </div>
      </div>
      <div class="wc-actions">
        <router-link :to="`/builder/${widget.id}`" class="btn btn-accent btn-sm btn-action-design">
          <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13" style="margin-right:3px; vertical-align:middle;"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
          Design
        </router-link>
        <button class="btn btn-ghost btn-sm btn-action-edit" @click="openEditWidget">
          <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13" style="margin-right:3px; vertical-align:middle;"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
          Edit
        </button>
        <a :href="`/preview/${widget.id}`" target="_blank" class="btn btn-ghost btn-sm btn-action-preview">
          <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13" style="margin-right:3px; vertical-align:middle;"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
          Preview
        </a>
        <button class="btn btn-ghost btn-sm btn-action-clone" :disabled="cloning" @click="doClone">
          <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13" style="margin-right:3px; vertical-align:middle;"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
          Clone
        </button>
        <button class="btn btn-danger btn-sm btn-action-delete" @click="del">
          <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13" style="margin-right:3px; vertical-align:middle;"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          Delete
        </button>
      </div>
    </div>

    <!-- Body -->
    <div class="wc-body">
      <!-- Meta row -->
      <div class="wc-meta">
        <div class="meta-item">
          <span class="meta-label">
            <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12" style="margin-right:4px; vertical-align:middle; opacity:0.8;"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-2.2 2.2c-2.83-1.44-5.15-3.75-6.59-6.59l2.2-2.21c.28-.26.36-.65.25-1C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.58c0-.56-.45-1.04-1-.99z"/></svg>
            Fallback Ext
          </span>
          <code class="meta-val highlight-val">{{ widget.agent_extension_3cx }}</code>
        </div>
        <div class="meta-item">
          <span class="meta-label">
            <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12" style="margin-right:4px; vertical-align:middle; opacity:0.8;"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
            Agents
          </span>
          <code class="meta-val highlight-val">{{ (widget.Agents || []).length }} configured</code>
        </div>
        <div class="meta-item">
          <span class="meta-label">
            <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12" style="margin-right:4px; vertical-align:middle; opacity:0.8;"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12z"/></svg>
            Primary Color
          </span>
          <div class="meta-color-row">
            <div class="meta-color-dot" :style="{ background: widget.color_primary || '#0b4526' }"></div>
            <code class="meta-val highlight-val">{{ widget.color_primary || '#0b4526' }}</code>
          </div>
        </div>
      </div>

      <!-- Embed Code -->
      <div class="embed-section">
        <span class="embed-label">Embed Code</span>
        <div class="embed-block">
          <div class="embed-tag-wrapper">
            <code class="embed-code">&lt;script src="{{ embedSrc }}"&gt;&lt;/script&gt;</code>
          </div>
          <button class="copy-btn" @click="copy" :class="{ copied }">
            <span v-if="copied">✓ Copied</span>
            <span v-else>
              <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11" style="margin-right:4px; vertical-align:middle;"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
              Copy
            </span>
          </button>
        </div>
      </div>

      <!-- Agents -->
      <div class="agents-section">
        <div class="agents-header">
          <h4>Agents (Round-Robin)</h4>
          <button class="btn btn-ghost btn-sm add-agent-trigger-btn" @click="openAddAgent">
            <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            Add Agent
          </button>
        </div>

        <div v-if="!widget.Agents || !widget.Agents.length" class="agents-empty">
          No agents added — calls go to fallback queue <code>{{ widget.agent_extension_3cx }}</code>
        </div>

        <div v-else class="agents-list">
          <div v-for="agent in widget.Agents" :key="agent.id" class="agent-row">
            <img class="agent-avatar"
              :src="agent.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.first_name)}&background=1f6feb&color=fff&size=64`"
              :alt="agent.first_name"
              @error="handleImgError"
            />
            <div class="agent-info">
              <strong>{{ agent.first_name }} {{ agent.last_name || '' }}</strong>
              <span>Ext: {{ agent.extension }}</span>
            </div>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-ghost btn-sm agent-edit-btn" @click="editAgent(agent)">Edit</button>
              <button class="btn btn-danger btn-sm agent-remove-btn" @click="delAgent(agent.id)">Remove</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Agent Modal -->
    <teleport to="body">
      <transition name="fade">
        <div v-if="showAddAgent" class="modal-backdrop" @click.self="showAddAgent = false">
          <div class="modal-box card" @click.stop>
            <div class="modal-header">
              <h3>{{ editingAgentId ? 'Edit Agent' : 'Add Agent' }}</h3>
              <button class="btn btn-icon btn-ghost" @click="showAddAgent = false">✕</button>
            </div>
            <div class="modal-body">
              <div class="form-row form-row-2">
                <div class="form-group">
                  <label class="form-label">First Name *</label>
                  <input v-model="agentForm.first_name" type="text" class="input" placeholder="John" />
                </div>
                <div class="form-group">
                  <label class="form-label">Last Name</label>
                  <input v-model="agentForm.last_name" type="text" class="input" placeholder="Doe" />
                </div>
              </div>
              <div class="form-row form-row-2">
                <div class="form-group">
                  <label class="form-label">3CX Extension *</label>
                  <input v-model="agentForm.extension" type="text" class="input" placeholder="e.g. 101" />
                </div>
                <div class="form-group">
                  <label class="form-label">Agent ID (CRM/GHL ID) *</label>
                  <input v-model="agentForm.crm_agent_id" type="text" class="input" placeholder="e.g. user_123" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Agent Email *</label>
                <input v-model="agentForm.email" type="email" class="input" placeholder="john@company.com" />
              </div>
              <div class="form-group">
                <label class="form-label">Avatar URL <span style="color:var(--text3)">(optional)</span></label>
                <input v-model="agentForm.avatar_url" type="url" class="input" placeholder="https://..." />
                <div v-if="agentForm.first_name" style="margin-top:8px; display:flex; align-items:center; gap:8px;">
                  <img :src="`https://ui-avatars.com/api/?name=${encodeURIComponent(agentForm.first_name)}&background=1f6feb&color=fff&size=64`" style="width:36px;height:36px;border-radius:50%;" />
                  <span style="color:var(--text2);font-size:12px;">Auto-generated avatar preview</span>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-ghost" @click="showAddAgent = false">Cancel</button>
              <button class="btn btn-primary" :disabled="addingAgent" @click="addAgent">
                {{ addingAgent ? 'Saving...' : (editingAgentId ? 'Save Changes' : 'Add Agent') }}
              </button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>

    <!-- Edit Widget Settings Modal -->
    <teleport to="body">
      <transition name="fade">
        <div v-if="showEditWidgetModal" class="modal-backdrop" @click.self="showEditWidgetModal = false">
          <div class="modal-box card" @click.stop>
            <div class="modal-header">
              <h3>Edit Widget Settings</h3>
              <button class="btn btn-icon btn-ghost" @click="showEditWidgetModal = false">✕</button>
            </div>
            <div class="modal-body">
              <div class="form-row form-row-2">
                <div class="form-group">
                  <label class="form-label">Widget Name *</label>
                  <input v-model="editWidgetForm.name" type="text" class="input" placeholder="e.g. Main Website" />
                </div>
                <div class="form-group">
                  <label class="form-label">Location ID (GHL / CRM Location ID)</label>
                  <input v-model="editWidgetForm.location_id" type="text" class="input" placeholder="e.g. loc_abc12345" />
                </div>
              </div>
              <div class="form-row form-row-2">
                <div class="form-group">
                  <label class="form-label">3CX Server URL (FQDN)</label>
                  <input v-model="editWidgetForm.fqdn_3cx" type="text" class="input" placeholder="ebmsdxb.3cx.ae:3081" />
                </div>
                <div class="form-group">
                  <label class="form-label">Client ID</label>
                  <input v-model="editWidgetForm.client_id_3cx" type="text" class="input" placeholder="your-client-id" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Client Secret</label>
                <input v-model="editWidgetForm.client_secret_3cx" type="password" class="input" placeholder="••••••••••••" />
              </div>
              <div class="form-group">
                <label class="form-label">Fallback Extension / Queue</label>
                <input v-model="editWidgetForm.agent_extension_3cx" type="text" class="input" placeholder="800" />
              </div>
              <div class="form-group">
                <label class="form-label">n8n / GHL Webhook URL (Global) <span style="color:var(--text3)">(optional)</span></label>
                <input v-model="editWidgetForm.webhook_url_n8n" type="url" class="input" placeholder="https://..." />
              </div>
              <div class="form-group">
                <label class="form-label">Call Dialing / Initiated Webhook <span style="color:var(--text3)">(optional)</span></label>
                <input v-model="editWidgetForm.webhook_initiated" type="url" class="input" placeholder="https://..." />
              </div>
              <div class="form-group">
                <label class="form-label">Call Answered Webhook <span style="color:var(--text3)">(optional)</span></label>
                <input v-model="editWidgetForm.webhook_answered" type="url" class="input" placeholder="https://..." />
              </div>
              <div class="form-group">
                <label class="form-label">Call Completed Webhook <span style="color:var(--text3)">(optional)</span></label>
                <input v-model="editWidgetForm.webhook_completed" type="url" class="input" placeholder="https://..." />
              </div>
              <div class="form-group">
                <label class="form-label">Call Failed / Busy Webhook <span style="color:var(--text3)">(optional)</span></label>
                <input v-model="editWidgetForm.webhook_failed" type="url" class="input" placeholder="https://..." />
              </div>
              <div class="form-group">
                <label class="form-label">Offline Lead Webhook <span style="color:var(--text3)">(optional)</span></label>
                <input v-model="editWidgetForm.webhook_lead" type="url" class="input" placeholder="https://..." />
              </div>
              <!-- Custom Webhook Headers -->
              <div class="form-group" style="margin-top: 14px;">
                <label class="form-label" style="display:flex; justify-content:space-between; align-items:center;">
                  <span>Custom HTTP Headers <span style="color:var(--text3)">(optional)</span></span>
                  <button type="button" class="btn btn-ghost btn-sm" @click="addHeaderRow" style="padding:2px 8px; font-size:11px;">+ Add Header</button>
                </label>
                <p class="help-text" style="margin-bottom:8px;">Send custom HTTP headers (e.g. <code>x-api-key</code>, <code>Authorization</code>) with webhook events.</p>
                <div v-if="!editHeadersList.length" style="color:var(--text3); font-size:12px; font-style:italic;">No custom headers configured.</div>
                <div v-else style="display:flex; flex-direction:column; gap:8px;">
                  <div v-for="(h, idx) in editHeadersList" :key="idx" style="display:flex; gap:8px; align-items:center;">
                    <input v-model="h.key" class="input" style="flex:1;" placeholder="Header Name (e.g. x-api-key)" />
                    <input v-model="h.value" class="input" style="flex:1;" placeholder="Header Value (e.g. secret123)" />
                    <button type="button" class="btn btn-danger btn-sm" @click="removeHeaderRow(idx)" style="padding:4px 8px;">✕</button>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-ghost" @click="showEditWidgetModal = false">Cancel</button>
              <button class="btn btn-primary" :disabled="savingWidget" @click="saveWidgetSettings">
                {{ savingWidget ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, inject } from 'vue'
import { useWidgetStore } from '../stores'

const props = defineProps({ widget: Object })
const emit = defineEmits(['deleted', 'agent-added', 'agent-deleted'])
const store = useWidgetStore()
const toast = inject('toast')

const showAddAgent = ref(false)
const addingAgent = ref(false)
const copied = ref(false)
const cloning = ref(false)

const showEditWidgetModal = ref(false)
const savingWidget = ref(false)
const editHeadersList = ref([])

function addHeaderRow() { editHeadersList.value.push({ key: '', value: '' }) }
function removeHeaderRow(idx) { editHeadersList.value.splice(idx, 1) }

const editWidgetForm = reactive({
  name: '',
  location_id: '',
  fqdn_3cx: '',
  client_id_3cx: '',
  client_secret_3cx: '',
  agent_extension_3cx: '',
  webhook_url_n8n: '',
  webhook_initiated: '',
  webhook_answered: '',
  webhook_completed: '',
  webhook_failed: '',
  webhook_lead: ''
})

function openEditWidget() {
  Object.assign(editWidgetForm, {
    name: props.widget.name || '',
    location_id: props.widget.location_id || '',
    fqdn_3cx: props.widget.fqdn_3cx || '',
    client_id_3cx: props.widget.client_id_3cx || '',
    client_secret_3cx: props.widget.client_secret_3cx || '',
    agent_extension_3cx: props.widget.agent_extension_3cx || '',
    webhook_url_n8n: props.widget.webhook_url_n8n || '',
    webhook_initiated: props.widget.webhook_initiated || '',
    webhook_answered: props.widget.webhook_answered || '',
    webhook_completed: props.widget.webhook_completed || '',
    webhook_failed: props.widget.webhook_failed || '',
    webhook_lead: props.widget.webhook_lead || ''
  })
  if (props.widget.webhook_headers) {
    try {
      const data = typeof props.widget.webhook_headers === 'string' ? JSON.parse(props.widget.webhook_headers) : props.widget.webhook_headers
      if (Array.isArray(data)) editHeadersList.value = data.map(i => ({ key: i.key || '', value: i.value || '' }))
      else if (typeof data === 'object') editHeadersList.value = Object.entries(data).map(([key, value]) => ({ key, value }))
    } catch { editHeadersList.value = [] }
  } else {
    editHeadersList.value = []
  }
  showEditWidgetModal.value = true
}

async function saveWidgetSettings() {
  if (!editWidgetForm.name) return toast('Widget name is required', 'error')
  savingWidget.value = true
  try {
    const filtered = editHeadersList.value.filter(h => h.key && h.key.trim()).map(h => ({ key: h.key.trim(), value: h.value || '' }))
    const webhook_headers = JSON.stringify(filtered)
    await store.update(props.widget.id, { ...editWidgetForm, webhook_headers })
    toast('Widget updated successfully!')
    showEditWidgetModal.value = false
    emit('agent-added')
  } catch {
    toast('Failed to save widget settings', 'error')
  } finally {
    savingWidget.value = false
  }
}

const editingAgentId = ref(null)
const agentForm = reactive({ first_name: '', last_name: '', extension: '', crm_agent_id: '', email: '', avatar_url: '' })

const embedSrc = computed(() => `${window.location.origin}/widget.js?id=${props.widget.id}`)

async function copy() {
  try {
    await navigator.clipboard.writeText(`<script src="${embedSrc.value}"><\/script>`)
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
    toast('Embed code copied!')
  } catch { toast('Copy failed', 'error') }
}

async function del() {
  if (!confirm(`Delete widget "${props.widget.name}"? This is permanent.`)) return
  try {
    await store.delete(props.widget.id)
    emit('deleted')
    toast('Widget deleted')
  } catch { toast('Failed to delete', 'error') }
}

async function doClone() {
  cloning.value = true
  try {
    await store.clone(props.widget.id)
    toast('Widget cloned successfully!')
  } catch { toast('Failed to clone widget', 'error') }
  finally { cloning.value = false }
}

function openAddAgent() {
  editingAgentId.value = null
  Object.assign(agentForm, { first_name: '', last_name: '', extension: '', crm_agent_id: '', email: '', avatar_url: '' })
  showAddAgent.value = true
}

async function addAgent() {
  if (!agentForm.first_name || !agentForm.extension || !agentForm.crm_agent_id || !agentForm.email) {
    return toast('First name, extension, Agent ID, and email are required', 'error')
  }
  addingAgent.value = true
  try {
    if (editingAgentId.value) {
      await store.updateAgent(editingAgentId.value, { ...agentForm })
      toast('Agent updated!')
    } else {
      await store.addAgent(props.widget.id, { ...agentForm })
      toast('Agent added!')
    }
    showAddAgent.value = false
    editingAgentId.value = null
    Object.assign(agentForm, { first_name: '', last_name: '', extension: '', crm_agent_id: '', email: '', avatar_url: '' })
    emit('agent-added')
  } catch { toast('Failed to save agent', 'error') }
  finally { addingAgent.value = false }
}

function editAgent(agent) {
  editingAgentId.value = agent.id
  Object.assign(agentForm, {
    first_name: agent.first_name,
    last_name: agent.last_name || '',
    extension: agent.extension,
    crm_agent_id: agent.crm_agent_id || '',
    email: agent.email || '',
    avatar_url: agent.avatar_url || ''
  })
  showAddAgent.value = true
}

async function delAgent(agentId) {
  if (!confirm('Remove this agent?')) return
  try {
    await store.deleteAgent(agentId)
    emit('agent-deleted')
    toast('Agent removed')
  } catch { toast('Failed', 'error') }
}

function handleImgError(e) {
  e.target.src = `https://ui-avatars.com/api/?name=A&background=1f6feb&color=fff&size=64`
}
</script>

<style scoped>
.widget-card {
  background: var(--bg2);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease, border-color 0.3s ease;
}
.widget-card:hover {
  transform: translateY(-4px);
  border-color: rgba(88, 166, 255, 0.3);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.15), 0 0 24px rgba(88, 166, 255, 0.08);
}
.wc-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid var(--border); gap: 16px; flex-wrap: wrap; background: var(--bg3); }
.wc-title-row { display: flex; align-items: center; gap: 14px; flex: 1; }
.wc-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--green);
  animation: pulse-green 2s infinite;
  flex-shrink: 0;
}
.wc-name { font-size: 16px; font-weight: 700; margin-bottom: 3px; letter-spacing: -0.2px; }
.wc-fqdn { font-size: 12px; color: var(--text2); font-family: monospace; }
.wc-badges { display: flex; gap: 8px; align-items: center; }
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid transparent;
}
.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}
.badge-dot-green { background: var(--green); box-shadow: 0 0 6px var(--green); }
.badge-dot-blue { background: var(--accent); box-shadow: 0 0 6px var(--accent); }

.wc-actions { display: flex; gap: 8px; flex-wrap: wrap; }

/* Custom Action Button Interactions */
.btn-action-design {
  background: linear-gradient(135deg, #1f6feb, #388bfd);
  border: 1px solid rgba(255,255,255,0.1);
  color: white;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.btn-action-design:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(56, 139, 253, 0.4);
}
.btn-action-design:active { transform: translateY(0); }

.btn-action-preview:hover, .btn-action-clone:hover {
  transform: translateY(-1px);
  border-color: var(--text2);
}
.btn-action-preview:active, .btn-action-clone:active { transform: translateY(0); }

.btn-action-delete {
  background: rgba(248,81,73,0.06);
  border: 1px solid rgba(248,81,73,0.2);
  color: var(--red);
  transition: all 0.2s ease;
}
.btn-action-delete:hover {
  background: var(--red);
  color: #fff;
  border-color: var(--red);
  box-shadow: 0 4px 12px rgba(248, 81, 73, 0.3);
}

.wc-body { padding: 24px; display: flex; flex-direction: column; gap: 24px; }
.wc-meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px; }
.meta-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--bg);
  border: 1px solid var(--border);
  padding: 12px 16px;
  border-radius: var(--radius);
}
.meta-label { font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.6px; display: flex; align-items: center; gap: 4px; }
.meta-val { font-size: 13px; font-family: monospace; color: var(--text); }
.highlight-val { color: var(--accent); font-weight: 700; }
.meta-color-row { display: flex; align-items: center; gap: 8px; }
.meta-color-dot { width: 16px; height: 16px; border-radius: 4px; border: 1px solid rgba(128,128,128,0.15); box-shadow: 0 2px 4px rgba(0,0,0,0.1); }

/* Embed section code block */
.embed-section { display: flex; flex-direction: column; gap: 8px; }
.embed-label { font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.6px; }
.embed-block {
  display: flex;
  align-items: center;
  background: var(--bg);
  border: 1.5px solid var(--border);
  border-radius: var(--radius);
  padding: 8px 14px;
  gap: 12px;
  overflow: hidden;
  transition: border-color 0.2s ease;
}
.embed-block:focus-within {
  border-color: var(--accent);
}
.embed-tag-wrapper { flex: 1; overflow: hidden; display: flex; }
.embed-code { font-size: 12px; color: #1f6feb; font-family: monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.copy-btn {
  flex-shrink: 0;
  background: var(--bg2);
  border: 1px solid var(--border);
  color: var(--text2);
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.copy-btn:hover { color: var(--text); border-color: var(--text2); transform: scale(1.03); }
.copy-btn:active { transform: scale(0.97); }
.copy-btn.copied { color: #fff; border-color: var(--green); background: var(--green); box-shadow: 0 0 10px rgba(63,185,80,0.3); }

/* Agents Section */
.agents-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.agents-header h4 { font-size: 13px; font-weight: 700; color: var(--text2); letter-spacing: 0.5px; }
.add-agent-trigger-btn { display: inline-flex; align-items: center; gap: 4px; border: 1px dashed var(--border); }
.add-agent-trigger-btn:hover { border-color: var(--accent); color: var(--accent); background: rgba(88,166,255,0.06); }

.agents-empty { font-size: 13px; color: var(--text2); padding: 14px; background: var(--bg); border: 1px dashed var(--border); border-radius: var(--radius); text-align: center; }

.agents-list { display: flex; flex-direction: column; gap: 8px; }
.agent-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}
.agent-row:hover {
  background: var(--bg2);
  border-color: var(--border);
  border-left-color: var(--accent);
  transform: translateX(4px);
}
.agent-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border); }
.agent-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.agent-info strong { font-size: 13px; font-weight: 600; color: var(--text); }
.agent-info span { font-size: 11px; color: var(--text2); font-family: monospace; }
.agent-remove-btn {
  background: transparent;
  border: 1px solid transparent;
  color: var(--text3);
  transition: all 0.2s ease;
}
.agent-remove-btn:hover {
  background: rgba(248,81,73,0.1);
  border-color: rgba(248,81,73,0.2);
  color: var(--red);
}

/* Modals */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(10, 12, 16, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.modal-box {
  width: 100%;
  max-width: 500px;
  background: linear-gradient(135deg, var(--bg2), var(--bg3));
  border: 1px solid rgba(128,128,128,0.2);
  box-shadow: 0 24px 60px rgba(0,0,0,0.2);
  border-radius: var(--radius-lg);
}
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 24px 24px 8px; }
.modal-body { padding: 16px 24px 24px; display: flex; flex-direction: column; gap: 16px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 0 24px 24px; border-top: 1px solid rgba(128,128,128,0.1); padding-top: 16px; }

/* Micro-animations */
.animate-card-fade-in {
  animation: cardFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes cardFadeIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
