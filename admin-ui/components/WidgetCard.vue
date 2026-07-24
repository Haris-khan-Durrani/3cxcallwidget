<template>
  <div class="wc-card">

    <!-- Top accent bar based on primary color -->
    <div class="wc-accent-bar" :style="`background:${widget.color_primary || '#1f6feb'}`"></div>

    <!-- ── Card Header ── -->
    <div class="wc-header">
      <div class="wc-header-left">
        <!-- Status dot -->
        <div class="wc-live-dot"></div>
        <div class="wc-name-block">
          <h3 class="wc-name">{{ widget.name }}</h3>
          <span class="wc-fqdn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" stroke-linejoin="round" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
            {{ widget.fqdn_3cx }}
          </span>
        </div>
      </div>
      <div class="wc-badges">
        <span class="wc-badge wc-badge-green">
          <span class="wc-badge-dot wc-dot-green"></span>Live
        </span>
        <span v-if="widget.webhook_url_n8n" class="wc-badge wc-badge-blue">
          <span class="wc-badge-dot wc-dot-blue"></span>Webhook
        </span>
      </div>
    </div>

    <!-- ── Action Buttons ── -->
    <div class="wc-actions-bar">
      <router-link :to="`/builder/${widget.id}`" class="wc-btn wc-btn-design">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12.5" r="2.5"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 20l7-7-3-3-7 7 3 3z"/></svg>
        Design
      </router-link>
      <button class="wc-btn wc-btn-ghost" @click="openEditWidget">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
        Edit
      </button>
      <a :href="`/preview/${widget.id}`" target="_blank" class="wc-btn wc-btn-ghost">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
        Preview
      </a>
      <button class="wc-btn wc-btn-ghost" :disabled="cloning" @click="doClone">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
        Clone
      </button>
      <button class="wc-btn wc-btn-danger" @click="del">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        Delete
      </button>
    </div>

    <!-- ── Body ── -->
    <div class="wc-body">

      <!-- Meta Chips Row -->
      <div class="wc-meta-row">
        <div class="wc-meta-chip">
          <span class="wc-meta-chip-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
          </span>
          <span class="wc-meta-chip-lbl">Fallback</span>
          <code class="wc-meta-chip-val">{{ widget.agent_extension_3cx || '—' }}</code>
        </div>
        <div class="wc-meta-chip">
          <span class="wc-meta-chip-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </span>
          <span class="wc-meta-chip-lbl">Agents</span>
          <code class="wc-meta-chip-val">{{ (widget.Agents||[]).length }} configured</code>
        </div>
        <div class="wc-meta-chip">
          <span class="wc-meta-chip-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
          </span>
          <span class="wc-meta-chip-lbl">Color</span>
          <span class="wc-color-dot" :style="`background:${widget.color_primary||'#0b4526'}`"></span>
          <code class="wc-meta-chip-val">{{ widget.color_primary || '#0b4526' }}</code>
        </div>
      </div>

      <!-- Embed Code -->
      <div class="wc-embed-section">
        <div class="wc-section-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
          Embed Code
        </div>
        <div class="wc-embed-block">
          <div class="wc-embed-code-wrap">
            <code class="wc-embed-code">&lt;script src="{{ embedSrc }}"&gt;&lt;/script&gt;</code>
          </div>
          <button class="wc-copy-btn" @click="copy" :class="{ copied }">
            <svg v-if="!copied" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            {{ copied ? 'Copied!' : 'Copy' }}
          </button>
        </div>
      </div>

      <!-- Agents -->
      <div class="wc-agents-section">
        <div class="wc-agents-hd">
          <div class="wc-section-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            Agents (Round-Robin)
            <span class="wc-agent-count">{{ (widget.Agents||[]).length }}</span>
          </div>
          <button class="wc-add-agent-btn" @click="openAddAgent">
            <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            Add Agent
          </button>
        </div>

        <div v-if="!widget.Agents || !widget.Agents.length" class="wc-agents-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          <span>No agents — calls route to fallback <code>{{ widget.agent_extension_3cx }}</code></span>
        </div>

        <div v-else class="wc-agents-list">
          <div v-for="(agent, idx) in widget.Agents" :key="agent.id" class="wc-agent-row" :style="`animation-delay:${idx * 50}ms`">
            <div class="wc-agent-num">{{ idx + 1 }}</div>
            <img class="wc-agent-av"
              :src="agent.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.first_name)}&background=1f6feb&color=fff&size=64`"
              :alt="agent.first_name"
              @error="handleImgError"
            />
            <div class="wc-agent-info">
              <strong class="wc-agent-name">{{ agent.first_name }} {{ agent.last_name || '' }}</strong>
              <span class="wc-agent-ext">Ext: {{ agent.extension }}</span>
            </div>
            <div class="wc-agent-status">
              <span class="wc-agent-dot"></span>Available
            </div>
            <div class="wc-agent-btns">
              <button class="wc-agent-btn" @click="editAgent(agent)" title="Edit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              </button>
              <button class="wc-agent-btn wc-agent-btn-del" @click="delAgent(agent.id)" title="Remove">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Add / Edit Agent Modal ── -->
    <teleport to="body">
      <transition name="wc-fade">
        <div v-if="showAddAgent" class="wc-modal-backdrop" @click.self="showAddAgent = false">
          <div class="wc-modal" @click.stop>
            <div class="wc-modal-hd">
              <div class="wc-modal-title-row">
                <div class="wc-modal-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                </div>
                <h3 class="wc-modal-title">{{ editingAgentId ? 'Edit Agent' : 'Add Agent' }}</h3>
              </div>
              <button class="wc-modal-close" @click="showAddAgent = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div class="wc-modal-body">
              <div v-if="agentForm.first_name || agentForm.avatar_url" class="wc-agent-preview">
                <img class="wc-ap-av"
                  :src="agentForm.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(agentForm.first_name||'A')}&background=1f6feb&color=fff&size=64`"/>
                <div>
                  <div class="wc-ap-name">{{ [agentForm.first_name, agentForm.last_name].filter(Boolean).join(' ') || 'New Agent' }}</div>
                  <div class="wc-ap-ext">{{ agentForm.extension ? `Ext: ${agentForm.extension}` : 'Extension not set' }}</div>
                </div>
              </div>
              <div class="wc-form-row">
                <div class="form-group">
                  <label class="form-label">First Name *</label>
                  <input v-model="agentForm.first_name" type="text" class="input" placeholder="John"/>
                </div>
                <div class="form-group">
                  <label class="form-label">Last Name</label>
                  <input v-model="agentForm.last_name" type="text" class="input" placeholder="Doe"/>
                </div>
              </div>
              <div class="wc-form-row">
                <div class="form-group">
                  <label class="form-label">3CX Extension *</label>
                  <input v-model="agentForm.extension" type="text" class="input" placeholder="e.g. 101"/>
                </div>
                <div class="form-group">
                  <label class="form-label">Agent ID (CRM) *</label>
                  <input v-model="agentForm.crm_agent_id" type="text" class="input" placeholder="e.g. user_123"/>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Agent Email *</label>
                <input v-model="agentForm.email" type="email" class="input" placeholder="john@company.com"/>
              </div>
              <div class="form-group">
                <label class="form-label">Avatar URL <span style="color:var(--text3);font-weight:400">(optional)</span></label>
                <input v-model="agentForm.avatar_url" type="url" class="input" placeholder="https://…"/>
              </div>
            </div>
            <div class="wc-modal-ft">
              <button class="wc-btn-ghost" @click="showAddAgent = false">Cancel</button>
              <button class="wc-btn-primary" :disabled="addingAgent" @click="addAgent">
                {{ addingAgent ? 'Saving...' : (editingAgentId ? 'Save Changes' : 'Add Agent') }}
              </button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>

    <!-- ── Edit Widget Modal ── -->
    <teleport to="body">
      <transition name="wc-fade">
        <div v-if="showEditWidgetModal" class="wc-modal-backdrop" @click.self="showEditWidgetModal = false">
          <div class="wc-modal" @click.stop>
            <div class="wc-modal-hd">
              <div class="wc-modal-title-row">
                <div class="wc-modal-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>
                <h3 class="wc-modal-title">Edit Widget Settings</h3>
              </div>
              <button class="wc-modal-close" @click="showEditWidgetModal = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div class="wc-modal-body">
              <div class="wc-form-row">
                <div class="form-group">
                  <label class="form-label">Widget Name *</label>
                  <input v-model="editWidgetForm.name" type="text" class="input" placeholder="e.g. Main Website"/>
                </div>
                <div class="form-group">
                  <label class="form-label">Location ID</label>
                  <input v-model="editWidgetForm.location_id" type="text" class="input" placeholder="e.g. loc_abc12345"/>
                </div>
              </div>
              <div class="wc-form-row">
                <div class="form-group">
                  <label class="form-label">3CX Server URL (FQDN)</label>
                  <input v-model="editWidgetForm.fqdn_3cx" type="text" class="input" placeholder="ebmsdxb.3cx.ae:3081"/>
                </div>
                <div class="form-group">
                  <label class="form-label">Client ID</label>
                  <input v-model="editWidgetForm.client_id_3cx" type="text" class="input" placeholder="your-client-id"/>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Client Secret</label>
                <input v-model="editWidgetForm.client_secret_3cx" type="password" class="input" placeholder="••••••••••••"/>
              </div>
              <div class="wc-form-row">
                <div class="form-group">
                  <label class="form-label">Fallback Extension</label>
                  <input v-model="editWidgetForm.agent_extension_3cx" type="text" class="input" placeholder="800"/>
                </div>
                <div class="form-group">
                  <label class="form-label">Webhook URL</label>
                  <input v-model="editWidgetForm.webhook_url_n8n" type="url" class="input" placeholder="https://…"/>
                </div>
              </div>
            </div>
            <div class="wc-modal-ft">
              <button class="wc-btn-ghost" @click="showEditWidgetModal = false">Cancel</button>
              <button class="wc-btn-primary" :disabled="savingWidget" @click="saveWidgetSettings">
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
const editingAgentId = ref(null)

const showEditWidgetModal = ref(false)
const savingWidget = ref(false)
const editWidgetForm = reactive({ name:'', location_id:'', fqdn_3cx:'', client_id_3cx:'', client_secret_3cx:'', agent_extension_3cx:'', webhook_url_n8n:'' })
const agentForm = reactive({ first_name:'', last_name:'', extension:'', crm_agent_id:'', email:'', avatar_url:'' })

const embedSrc = computed(() => `${window.location.origin}/widget.js?id=${props.widget.id}`)

function openEditWidget() {
  Object.assign(editWidgetForm, {
    name: props.widget.name||'', location_id: props.widget.location_id||'',
    fqdn_3cx: props.widget.fqdn_3cx||'', client_id_3cx: props.widget.client_id_3cx||'',
    client_secret_3cx: props.widget.client_secret_3cx||'',
    agent_extension_3cx: props.widget.agent_extension_3cx||'',
    webhook_url_n8n: props.widget.webhook_url_n8n||''
  })
  showEditWidgetModal.value = true
}

async function saveWidgetSettings() {
  if (!editWidgetForm.name) return toast('Widget name is required', 'error')
  savingWidget.value = true
  try {
    await store.update(props.widget.id, { ...editWidgetForm })
    toast('Widget updated successfully!')
    showEditWidgetModal.value = false
    emit('agent-added')
  } catch { toast('Failed to save widget settings', 'error') }
  finally { savingWidget.value = false }
}

async function copy() {
  try {
    await navigator.clipboard.writeText(`<script src="${embedSrc.value}"><\/script>`)
    copied.value = true
    setTimeout(() => copied.value = false, 2200)
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
  Object.assign(agentForm, { first_name:'', last_name:'', extension:'', crm_agent_id:'', email:'', avatar_url:'' })
  showAddAgent.value = true
}

async function addAgent() {
  if (!agentForm.first_name || !agentForm.extension || !agentForm.crm_agent_id || !agentForm.email)
    return toast('First name, extension, Agent ID, and email are required', 'error')
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
    Object.assign(agentForm, { first_name:'', last_name:'', extension:'', crm_agent_id:'', email:'', avatar_url:'' })
    emit('agent-added')
  } catch { toast('Failed to save agent', 'error') }
  finally { addingAgent.value = false }
}

function editAgent(agent) {
  editingAgentId.value = agent.id
  Object.assign(agentForm, {
    first_name: agent.first_name, last_name: agent.last_name||'',
    extension: agent.extension, crm_agent_id: agent.crm_agent_id||'',
    email: agent.email||'', avatar_url: agent.avatar_url||''
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
/* ─── Card ─── */
.wc-card {
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: 16px; overflow: hidden;
  transition: border-color .25s, box-shadow .25s, transform .25s;
  animation: wc-fadein .45s cubic-bezier(0.16,1,0.3,1) both;
}
.wc-card:hover { border-color: rgba(88,166,255,.3); box-shadow: 0 12px 40px rgba(0,0,0,.18), 0 0 20px rgba(88,166,255,.06); transform: translateY(-2px); }
@keyframes wc-fadein { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; } }

/* Accent bar */
.wc-accent-bar { height: 3px; width: 100%; transition: background .3s; }

/* ─── Header ─── */
.wc-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 22px 14px; gap: 14px; flex-wrap: wrap;
  background: var(--bg3); border-bottom: 1px solid var(--border);
}
.wc-header-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
.wc-live-dot {
  width: 9px; height: 9px; border-radius: 50%;
  background: var(--green); flex-shrink: 0;
  animation: wc-pulse 2s ease-in-out infinite;
  box-shadow: 0 0 0 0 rgba(63,185,80,.5);
}
@keyframes wc-pulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(63,185,80,.4); }
  50% { box-shadow: 0 0 0 5px rgba(63,185,80,0); }
}
.wc-name-block { min-width: 0; }
.wc-name { font-size: 15px; font-weight: 800; color: var(--text); letter-spacing: -.2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wc-fqdn { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--text3); font-family: monospace; margin-top: 2px; }

.wc-badges { display: flex; gap: 6px; align-items: center; }
.wc-badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 9px; border-radius: 20px; font-size: 10.5px; font-weight: 700;
}
.wc-badge-dot { width: 5px; height: 5px; border-radius: 50%; }
.wc-badge-green { background: rgba(63,185,80,.1); border: 1px solid rgba(63,185,80,.22); color: var(--green); }
.wc-dot-green { background: var(--green); box-shadow: 0 0 0 2px rgba(63,185,80,.25); animation: wc-pulse 2s infinite; }
.wc-badge-blue  { background: rgba(88,166,255,.1); border: 1px solid rgba(88,166,255,.22); color: var(--accent); }
.wc-dot-blue  { background: var(--accent); }

/* ─── Action Buttons ─── */
.wc-actions-bar {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  padding: 12px 22px; border-bottom: 1px solid var(--border);
  background: var(--bg3);
}
.wc-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 6px 13px; border-radius: 8px; font-size: 11.5px; font-weight: 600;
  cursor: pointer; transition: all .18s; text-decoration: none; border: 1px solid transparent;
}
.wc-btn-design {
  background: linear-gradient(135deg,#1f6feb,#388bfd);
  color: #fff; border-color: rgba(255,255,255,.1);
  box-shadow: 0 3px 10px rgba(56,139,253,.28);
}
.wc-btn-design:hover { box-shadow: 0 5px 18px rgba(56,139,253,.45); transform: translateY(-1px); }
.wc-btn-ghost {
  background: var(--bg2); border-color: var(--border); color: var(--text2);
}
.wc-btn-ghost:hover { color: var(--text); border-color: var(--text3); background: var(--bg4); }
.wc-btn-ghost:disabled { opacity: .4; cursor: not-allowed; }
.wc-btn-danger {
  background: rgba(248,81,73,.07); border-color: rgba(248,81,73,.22); color: var(--red);
  margin-left: auto;
}
.wc-btn-danger:hover { background: var(--red); color: #fff; border-color: var(--red); box-shadow: 0 3px 12px rgba(248,81,73,.3); }

/* ─── Body ─── */
.wc-body { padding: 20px 22px; display: flex; flex-direction: column; gap: 18px; }

/* Meta chips */
.wc-meta-row { display: flex; gap: 8px; flex-wrap: wrap; }
.wc-meta-chip {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--bg3); border: 1px solid var(--border);
  border-radius: 8px; padding: 6px 11px; font-size: 11.5px;
  transition: border-color .15s;
}
.wc-meta-chip:hover { border-color: var(--bg4); }
.wc-meta-chip-icon { color: var(--text3); flex-shrink: 0; }
.wc-meta-chip-lbl { font-size: 10px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: .5px; }
.wc-meta-chip-val { font-family: monospace; font-size: 11.5px; font-weight: 700; color: var(--accent); }
.wc-color-dot { width: 12px; height: 12px; border-radius: 4px; border: 1px solid rgba(128,128,128,.2); flex-shrink: 0; }

/* Section label */
.wc-section-label {
  display: flex; align-items: center; gap: 6px;
  font-size: 10px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: .7px;
}

/* Embed */
.wc-embed-section { display: flex; flex-direction: column; gap: 8px; }
.wc-embed-block {
  display: flex; align-items: center; gap: 10px;
  background: var(--bg); border: 1.5px solid var(--border);
  border-radius: 10px; padding: 9px 14px;
  transition: border-color .18s;
}
.wc-embed-block:hover { border-color: rgba(88,166,255,.3); }
.wc-embed-code-wrap { flex: 1; overflow: hidden; }
.wc-embed-code { font-size: 11.5px; color: var(--accent); font-family: monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
.wc-copy-btn {
  flex-shrink: 0; display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 12px; background: var(--bg2); border: 1px solid var(--border);
  border-radius: 7px; font-size: 11.5px; font-weight: 600; color: var(--text2);
  cursor: pointer; transition: all .18s cubic-bezier(0.175,0.885,0.32,1.275);
  white-space: nowrap;
}
.wc-copy-btn:hover { color: var(--text); border-color: var(--text2); transform: scale(1.03); }
.wc-copy-btn.copied { background: var(--green); border-color: var(--green); color: #fff; box-shadow: 0 0 12px rgba(63,185,80,.3); }

/* Agents */
.wc-agents-section { display: flex; flex-direction: column; gap: 10px; }
.wc-agents-hd { display: flex; align-items: center; justify-content: space-between; }
.wc-agent-count {
  background: var(--bg3); border: 1px solid var(--border);
  font-size: 9.5px; font-weight: 700; padding: 1px 6px; border-radius: 10px; color: var(--text3);
}
.wc-add-agent-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 12px; background: transparent;
  border: 1px dashed var(--border); border-radius: 8px;
  font-size: 11.5px; font-weight: 600; color: var(--text2); cursor: pointer; transition: all .15s;
}
.wc-add-agent-btn:hover { border-color: var(--accent); color: var(--accent); background: rgba(88,166,255,.06); }

.wc-agents-empty {
  display: flex; align-items: center; gap: 10px; justify-content: center;
  padding: 16px; background: var(--bg); border: 1px dashed var(--border);
  border-radius: 10px; font-size: 12.5px; color: var(--text2);
}
.wc-agents-empty code { background: var(--bg3); padding: 1px 6px; border-radius: 4px; font-size: 11px; color: var(--accent); }

.wc-agents-list { display: flex; flex-direction: column; gap: 6px; }
.wc-agent-row {
  display: flex; align-items: center; gap: 11px;
  padding: 10px 14px; background: var(--bg);
  border: 1px solid var(--border); border-radius: 11px;
  border-left: 3px solid transparent; transition: all .2s;
  animation: wc-fadein .35s both;
}
.wc-agent-row:hover { background: var(--bg2); border-left-color: var(--accent); transform: translateX(3px); }
.wc-agent-num {
  width: 20px; height: 20px; border-radius: 6px; flex-shrink: 0;
  background: var(--bg3); border: 1px solid var(--border);
  font-size: 10px; font-weight: 700; color: var(--text3);
  display: flex; align-items: center; justify-content: center;
}
.wc-agent-av { width: 36px; height: 36px; border-radius: 10px; object-fit: cover; border: 1.5px solid var(--border); flex-shrink: 0; }
.wc-agent-info { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.wc-agent-name { font-size: 12.5px; font-weight: 700; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wc-agent-ext { font-size: 10.5px; color: var(--text3); font-family: monospace; }
.wc-agent-status {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 10.5px; color: var(--green); font-weight: 600; flex-shrink: 0;
}
.wc-agent-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--green); animation: wc-pulse 2s infinite; }
.wc-agent-btns { display: flex; gap: 5px; }
.wc-agent-btn {
  width: 28px; height: 28px; border-radius: 8px;
  background: var(--bg2); border: 1px solid var(--border);
  color: var(--text2); cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: all .15s;
}
.wc-agent-btn:hover { background: var(--bg3); color: var(--text); border-color: var(--text3); }
.wc-agent-btn-del:hover { background: rgba(248,81,73,.1); border-color: rgba(248,81,73,.25); color: var(--red); }

/* ─── Modals ─── */
.wc-modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(10,12,16,.65);
  backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
  z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px;
}
.wc-modal {
  width: 100%; max-width: 520px;
  background: linear-gradient(145deg, var(--bg2), var(--bg3));
  border: 1px solid rgba(128,128,128,.2);
  box-shadow: 0 28px 80px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.04);
  border-radius: 18px; overflow: hidden;
  animation: wc-slideup .28s cubic-bezier(0.34,1.56,0.64,1) both;
}
@keyframes wc-slideup { from { transform:translateY(28px) scale(.96); opacity:0; } to { transform:none; opacity:1; } }

.wc-modal-hd {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 22px 16px; border-bottom: 1px solid rgba(128,128,128,.12);
}
.wc-modal-title-row { display: flex; align-items: center; gap: 12px; }
.wc-modal-icon {
  width: 34px; height: 34px; background: rgba(88,166,255,.12);
  border: 1px solid rgba(88,166,255,.2); border-radius: 10px;
  display: flex; align-items: center; justify-content: center; color: var(--accent);
}
.wc-modal-title { font-size: 16px; font-weight: 800; color: var(--text); }
.wc-modal-close {
  width: 28px; height: 28px; background: var(--bg3); border: 1px solid var(--border);
  border-radius: 8px; cursor: pointer; color: var(--text2);
  display: flex; align-items: center; justify-content: center; transition: all .15s;
}
.wc-modal-close:hover { background: var(--bg4); color: var(--text); }

.wc-modal-body { padding: 18px 22px; display: flex; flex-direction: column; gap: 14px; max-height: 55vh; overflow-y: auto; }
.wc-modal-body::-webkit-scrollbar { width: 4px; }
.wc-modal-body::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

.wc-modal-ft {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 14px 22px; border-top: 1px solid rgba(128,128,128,.1);
}
.wc-btn-ghost {
  padding: 8px 18px; background: var(--bg3); border: 1px solid var(--border);
  border-radius: 9px; color: var(--text2); font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all .15s;
}
.wc-btn-ghost:hover { color: var(--text); border-color: var(--text2); }
.wc-btn-primary {
  padding: 8px 18px; background: linear-gradient(135deg,#1f6feb,#388bfd);
  border: none; border-radius: 9px; color: #fff;
  font-size: 13px; font-weight: 700; cursor: pointer; transition: all .18s;
  box-shadow: 0 3px 12px rgba(56,139,253,.3);
}
.wc-btn-primary:hover:not(:disabled) { box-shadow: 0 5px 20px rgba(56,139,253,.45); transform: translateY(-1px); }
.wc-btn-primary:disabled { opacity: .5; cursor: not-allowed; }

/* Agent preview in modal */
.wc-agent-preview {
  display: flex; align-items: center; gap: 12px;
  background: var(--bg); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px;
}
.wc-ap-av { width: 40px; height: 40px; border-radius: 10px; border: 1.5px solid var(--border); }
.wc-ap-name { font-size: 13px; font-weight: 700; color: var(--text); }
.wc-ap-ext { font-size: 11px; color: var(--text3); font-family: monospace; margin-top: 2px; }

/* 2-col form row */
.wc-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width:480px) { .wc-form-row { grid-template-columns: 1fr; } }

/* Fade transition */
.wc-fade-enter-active, .wc-fade-leave-active { transition: opacity .2s ease; }
.wc-fade-enter-from, .wc-fade-leave-to { opacity: 0; }
</style>
