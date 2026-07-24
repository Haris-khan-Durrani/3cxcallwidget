<template>
  <AppLayout>
    <div class="wv-page">

      <!-- ── Header ── -->
      <div class="wv-header">
        <div class="wv-header-left">
          <div class="wv-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="22" height="22">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
          </div>
          <div>
            <div class="wv-title-row">
              <h1 class="wv-title">My Widgets</h1>
              <span class="wv-count-chip">{{ store.widgets.length }}</span>
            </div>
            <p class="wv-sub">Create, style, and embed interactive 3CX web call widgets</p>
          </div>
        </div>
        <button class="wv-btn-new" @click="showCreateModal = true">
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          New Widget
        </button>
      </div>

      <!-- ── Loading ── -->
      <div v-if="store.loading" class="wv-empty">
        <div class="wv-spinner"></div>
        <p class="wv-empty-sub">Loading widgets...</p>
      </div>

      <!-- ── Empty ── -->
      <div v-else-if="!store.widgets.length" class="wv-empty">
        <div class="wv-empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32">
            <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
          </svg>
        </div>
        <p class="wv-empty-title">No widgets yet</p>
        <p class="wv-empty-sub">Create your first widget and embed it on any website to start connecting customers to agents instantly.</p>
        <button class="wv-btn-new" style="margin-top:6px;" @click="showCreateModal = true">
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          Create First Widget
        </button>
      </div>

      <!-- ── Main Layout ── -->
      <div v-else class="wv-layout">

        <!-- Widgets Column -->
        <div class="wv-widgets-col">
          <WidgetCard
            v-for="w in store.widgets"
            :key="w.id"
            :widget="w"
            @deleted="store.fetch()"
            @agent-added="store.fetch()"
            @agent-deleted="store.fetch()"
          />
        </div>

        <!-- Sidebar -->
        <aside class="wv-sidebar">

          <!-- Summary Stats -->
          <div class="wv-side-card">
            <div class="wv-side-card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
              Quick Summary
            </div>
            <div class="wv-stats-grid">
              <div class="wv-stat">
                <div class="wv-stat-icon" style="background:rgba(88,166,255,.12);color:var(--accent);">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="2" y="3" width="20" height="14" rx="2"/></svg>
                </div>
                <div class="wv-stat-num" style="color:var(--accent);">{{ store.widgets.length }}</div>
                <div class="wv-stat-lbl">Active Widgets</div>
              </div>
              <div class="wv-stat">
                <div class="wv-stat-icon" style="background:rgba(63,185,80,.12);color:var(--green);">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>
                <div class="wv-stat-num" style="color:var(--green);">{{ totalAgents }}</div>
                <div class="wv-stat-lbl">Total Agents</div>
              </div>
              <div class="wv-stat">
                <div class="wv-stat-icon" style="background:rgba(240,136,62,.12);color:var(--orange);">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                </div>
                <div class="wv-stat-num" style="color:var(--orange);">{{ webhookCount }}</div>
                <div class="wv-stat-lbl">Webhooks</div>
              </div>
            </div>
          </div>

          <!-- Embed Guide -->
          <div class="wv-side-card">
            <div class="wv-side-card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
              Quick Embed Guide
            </div>
            <p class="wv-guide-desc">Paste the script tag just before the closing <code>&lt;/body&gt;</code> tag of your website.</p>
            <div class="wv-tab-row">
              <button v-for="t in ['HTML','WordPress','React']" :key="t"
                class="wv-tab-btn" :class="{ active: activeGuideTab === t }"
                @click="activeGuideTab = t">{{ t }}</button>
            </div>
            <div class="wv-code-box">
              <pre v-if="activeGuideTab === 'HTML'"><code>&lt;!-- Paste before &lt;/body&gt; --&gt;
&lt;script src="https://your-domain.com/widget.js?id=WIDGET_ID"&gt;&lt;/script&gt;</code></pre>
              <pre v-else-if="activeGuideTab === 'WordPress'"><code>1. Go to WP Admin → Plugins
2. Install "Header Footer Code Manager"
3. Paste in Footer section:
&lt;script src="https://your-domain.com/widget.js?id=WIDGET_ID"&gt;&lt;/script&gt;</code></pre>
              <pre v-else-if="activeGuideTab === 'React'"><code>// In your component:
useEffect(() => {
  const s = document.createElement('script');
  s.src = "https://your-domain.com/widget.js?id=WIDGET_ID";
  s.async = true;
  document.body.appendChild(s);
  return () => document.body.removeChild(s);
}, []);</code></pre>
            </div>
          </div>

          <!-- Docs link -->
          <div class="wv-side-card wv-docs-card">
            <div class="wv-side-card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path stroke-linecap="round" stroke-linejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Need Help?
            </div>
            <p class="wv-guide-desc">Read our setup guide to configure FQDN, Client Credentials, or Webhooks for 3CX.</p>
            <a href="https://www.3cx.com/docs/" target="_blank" class="wv-doc-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
              3CX Integration Docs
            </a>
          </div>

        </aside>
      </div>
    </div>

    <!-- ── Create Widget Modal ── -->
    <teleport to="body">
      <transition name="wv-fade">
        <div v-if="showCreateModal" class="wv-modal-backdrop" @click.self="showCreateModal = false">
          <transition name="wv-slide-up">
            <div class="wv-modal" @click.stop>
              <div class="wv-modal-hd">
                <div class="wv-modal-title-row">
                  <div class="wv-modal-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                  </div>
                  <h3 class="wv-modal-title">Create New Widget</h3>
                </div>
                <button class="wv-modal-close" @click="showCreateModal = false">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div class="wv-modal-body">
                <div class="wv-form-section">
                  <div class="wv-form-section-label">Basic Info</div>
                  <div class="wv-form-row">
                    <div class="form-group">
                      <label class="form-label">Widget Name *</label>
                      <input v-model="form.name" type="text" class="input" placeholder="e.g. Main Website"/>
                    </div>
                    <div class="form-group">
                      <label class="form-label">3CX Server URL (FQDN) *</label>
                      <input v-model="form.fqdn_3cx" type="text" class="input" placeholder="ebmsdxb.3cx.ae:3081"
                        @blur="form.fqdn_3cx = form.fqdn_3cx.replace(/^https?:\/\//i,'').replace(/\/$/,'')"/>
                    </div>
                  </div>
                </div>
                <div class="wv-form-section">
                  <div class="wv-form-section-label">Authentication</div>
                  <div class="wv-form-row">
                    <div class="form-group">
                      <label class="form-label">Client ID *</label>
                      <input v-model="form.client_id_3cx" type="text" class="input" placeholder="your-client-id"/>
                    </div>
                    <div class="form-group" style="position:relative">
                      <label class="form-label">Client Secret *</label>
                      <input v-model="form.client_secret_3cx" :type="showNewSecret ? 'text' : 'password'" class="input" placeholder="••••••••••••" style="padding-right:38px"/>
                      <button type="button" @click="showNewSecret=!showNewSecret" class="wv-eye-btn">
                        <svg v-if="showNewSecret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
                <div class="wv-form-section">
                  <div class="wv-form-section-label">Optional Settings</div>
                  <div class="wv-form-row">
                    <div class="form-group">
                      <label class="form-label">Location ID <span class="wv-optional">(optional)</span></label>
                      <input v-model="form.location_id" type="text" class="input" placeholder="e.g. loc_abc12345"/>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Fallback Extension <span class="wv-optional">(optional)</span></label>
                      <input v-model="form.agent_extension_3cx" type="text" class="input" placeholder="800"/>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">n8n / GoHighLevel Webhook URL <span class="wv-optional">(optional)</span></label>
                    <input v-model="form.webhook_url_n8n" type="url" class="input" placeholder="https://your-n8n.com/webhook/..."/>
                  </div>
                </div>
              </div>
              <div class="wv-modal-ft">
                <button class="wv-btn-ghost" @click="showCreateModal = false">Cancel</button>
                <button class="wv-btn-new" :disabled="creating" @click="create">
                  <svg v-if="!creating" viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                  <div v-else class="wv-btn-spinner"></div>
                  {{ creating ? 'Creating...' : 'Create Widget' }}
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
import { ref, reactive, computed, onMounted, inject } from 'vue'
import AppLayout from '../components/AppLayout.vue'
import WidgetCard from '../components/WidgetCard.vue'
import { useWidgetStore } from '../stores'

const store = useWidgetStore()
const toast = inject('toast')
const showCreateModal = ref(false)
const creating = ref(false)
const activeGuideTab = ref('HTML')
const showNewSecret = ref(false)

const totalAgents = computed(() => store.widgets.reduce((a, w) => a + (w.Agents||[]).length, 0))
const webhookCount = computed(() => store.widgets.filter(w => w.webhook_url_n8n).length)

const form = reactive({
  name: '', fqdn_3cx: '', client_id_3cx: '', client_secret_3cx: '',
  location_id: '', agent_extension_3cx: '', webhook_url_n8n: ''
})

onMounted(() => store.fetch())

async function create() {
  if (!form.name || !form.fqdn_3cx || !form.client_id_3cx || !form.client_secret_3cx)
    return toast('Name, FQDN, Client ID, and Client Secret are required', 'error')
  creating.value = true
  try {
    await store.create({ ...form })
    showCreateModal.value = false
    Object.assign(form, { name:'', fqdn_3cx:'', client_id_3cx:'', client_secret_3cx:'', location_id:'', agent_extension_3cx:'', webhook_url_n8n:'' })
    toast('Widget created!')
  } catch { toast('Failed to create widget', 'error') }
  finally { creating.value = false }
}
</script>

<style scoped>
/* ─── Page ─── */
.wv-page { padding: 24px 28px; display: flex; flex-direction: column; gap: 22px; min-height: 100%; }

/* ─── Header ─── */
.wv-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.wv-header-left { display: flex; align-items: center; gap: 14px; }
.wv-header-icon {
  width: 46px; height: 46px; flex-shrink: 0;
  background: linear-gradient(135deg, rgba(88,166,255,.18), rgba(188,140,255,.12));
  border: 1px solid rgba(88,166,255,.22); border-radius: 14px;
  display: flex; align-items: center; justify-content: center; color: var(--accent);
}
.wv-title-row { display: flex; align-items: center; gap: 10px; }
.wv-title { font-size: 21px; font-weight: 800; color: var(--text); line-height: 1.1; }
.wv-count-chip {
  background: linear-gradient(135deg, rgba(88,166,255,.15), rgba(188,140,255,.1));
  border: 1px solid rgba(88,166,255,.25); color: var(--accent);
  font-size: 11px; font-weight: 700; padding: 2px 9px; border-radius: 20px;
}
.wv-sub { font-size: 12.5px; color: var(--text2); margin-top: 3px; }

.wv-btn-new {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 9px 20px;
  background: linear-gradient(135deg, #238636, #2ea043);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 10px; color: #fff; font-size: 13px; font-weight: 700;
  cursor: pointer; transition: all .2s cubic-bezier(0.175,0.885,0.32,1.275);
  box-shadow: 0 4px 16px rgba(46,160,67,.3);
}
.wv-btn-new:hover { box-shadow: 0 6px 24px rgba(46,160,67,.5); transform: translateY(-1px); background: linear-gradient(135deg,#2ea043,#34d058); }
.wv-btn-new:active { transform: translateY(0) scale(.98); }
.wv-btn-new:disabled { opacity: .5; cursor: not-allowed; transform: none; }

/* ─── Empty ─── */
.wv-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 80px 20px; text-align: center; }
.wv-empty-icon { width: 68px; height: 68px; background: var(--bg2); border: 1px solid var(--border); border-radius: 18px; display: flex; align-items: center; justify-content: center; color: var(--text3); }
.wv-empty-title { font-size: 15px; font-weight: 700; color: var(--text); }
.wv-empty-sub { font-size: 12.5px; color: var(--text2); max-width: 340px; }
.wv-spinner { width: 30px; height: 30px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: wv-spin .65s linear infinite; }
@keyframes wv-spin { to { transform: rotate(360deg); } }

/* ─── Layout ─── */
.wv-layout { display: flex; gap: 24px; align-items: flex-start; }
.wv-widgets-col { flex: 1; display: flex; flex-direction: column; gap: 18px; min-width: 0; }
.wv-sidebar { width: 320px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; position: sticky; top: 24px; }
@media (max-width: 1100px) { .wv-layout { flex-direction: column; } .wv-sidebar { width: 100%; position: static; } }

/* ─── Sidebar Cards ─── */
.wv-side-card {
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: 14px; padding: 18px 20px;
  display: flex; flex-direction: column; gap: 12px;
}
.wv-side-card-title {
  display: flex; align-items: center; gap: 7px;
  font-size: 10px; font-weight: 700; color: var(--text3);
  text-transform: uppercase; letter-spacing: .8px;
  border-bottom: 1px solid var(--border); padding-bottom: 10px;
}

/* Stats grid */
.wv-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.wv-stat {
  background: var(--bg3); border: 1px solid var(--border);
  border-radius: 11px; padding: 13px 12px;
  display: flex; flex-direction: column; gap: 6px;
  align-items: center; text-align: center;
  transition: border-color .2s, transform .2s;
}
.wv-stat:hover { border-color: var(--bg4); transform: translateY(-1px); }
.wv-stat-icon { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.wv-stat-num { font-size: 22px; font-weight: 800; font-variant-numeric: tabular-nums; line-height: 1; }
.wv-stat-lbl { font-size: 9.5px; font-weight: 600; color: var(--text3); text-transform: uppercase; letter-spacing: .5px; }

/* Embed Guide */
.wv-guide-desc { font-size: 11.5px; color: var(--text2); line-height: 1.55; }
.wv-guide-desc code { background: var(--bg4); padding: 1px 5px; border-radius: 4px; font-size: 10.5px; color: var(--accent); }
.wv-tab-row { display: flex; gap: 3px; background: var(--bg3); border: 1px solid var(--border); padding: 3px; border-radius: 9px; }
.wv-tab-btn {
  flex: 1; background: transparent; border: none; color: var(--text3);
  font-size: 11px; font-weight: 700; padding: 6px 0;
  border-radius: 6px; cursor: pointer; transition: all .15s;
}
.wv-tab-btn:hover { color: var(--text2); }
.wv-tab-btn.active { background: var(--bg2); color: var(--text); box-shadow: 0 2px 6px rgba(0,0,0,.15); }
.wv-code-box {
  background: var(--bg); border: 1px solid var(--border);
  border-radius: 9px; padding: 12px 14px; overflow-x: auto;
}
.wv-code-box pre { margin: 0; }
.wv-code-box code { font-size: 10.5px; font-family: monospace; color: var(--accent); line-height: 1.6; white-space: pre-wrap; }

/* Docs card */
.wv-docs-card { border-color: rgba(88,166,255,.15); }
.wv-doc-link {
  display: inline-flex; align-items: center; justify-content: center; gap: 7px;
  background: rgba(88,166,255,.08); border: 1px solid rgba(88,166,255,.2);
  color: var(--accent); text-decoration: none; font-size: 12px; font-weight: 700;
  padding: 9px 16px; border-radius: 9px; transition: all .18s;
}
.wv-doc-link:hover { background: var(--accent); color: #fff; box-shadow: 0 4px 14px rgba(88,166,255,.35); }

/* ─── Modal ─── */
.wv-modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(10,12,16,.65);
  backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
  z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px;
}
.wv-modal {
  width: 100%; max-width: 580px;
  background: linear-gradient(145deg, var(--bg2), var(--bg3));
  border: 1px solid rgba(128,128,128,.2);
  box-shadow: 0 28px 80px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.04);
  border-radius: 18px; overflow: hidden;
}
.wv-modal-hd {
  display: flex; align-items: center; justify-content: space-between;
  padding: 22px 24px 18px;
  border-bottom: 1px solid rgba(128,128,128,.12);
}
.wv-modal-title-row { display: flex; align-items: center; gap: 12px; }
.wv-modal-icon {
  width: 36px; height: 36px; background: rgba(88,166,255,.12);
  border: 1px solid rgba(88,166,255,.2); border-radius: 10px;
  display: flex; align-items: center; justify-content: center; color: var(--accent);
}
.wv-modal-title { font-size: 17px; font-weight: 800; color: var(--text); }
.wv-modal-close {
  width: 30px; height: 30px; background: var(--bg3); border: 1px solid var(--border);
  border-radius: 8px; cursor: pointer; color: var(--text2);
  display: flex; align-items: center; justify-content: center; transition: all .15s;
}
.wv-modal-close:hover { background: var(--bg4); color: var(--text); }

.wv-modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 20px; max-height: 60vh; overflow-y: auto; }
.wv-modal-body::-webkit-scrollbar { width: 4px; }
.wv-modal-body::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

.wv-form-section { display: flex; flex-direction: column; gap: 12px; }
.wv-form-section-label {
  font-size: 10px; font-weight: 700; color: var(--text3);
  text-transform: uppercase; letter-spacing: .8px;
  display: flex; align-items: center; gap: 8px;
}
.wv-form-section-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }
.wv-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
@media (max-width:500px) { .wv-form-row { grid-template-columns: 1fr; } }
.wv-optional { color: var(--text3); font-weight: 400; }

.wv-eye-btn {
  position: absolute; right: 10px; bottom: 10px;
  background: none; border: none; cursor: pointer; color: var(--text3);
  display: flex; align-items: center; transition: color .15s; padding: 2px;
}
.wv-eye-btn:hover { color: var(--text); }

.wv-modal-ft {
  display: flex; justify-content: flex-end; align-items: center; gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid rgba(128,128,128,.1);
}
.wv-btn-ghost {
  padding: 8px 18px; background: var(--bg3); border: 1px solid var(--border);
  border-radius: 9px; color: var(--text2); font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all .15s;
}
.wv-btn-ghost:hover { color: var(--text); border-color: var(--text2); }
.wv-btn-spinner {
  width: 13px; height: 13px; border: 2px solid rgba(255,255,255,.3);
  border-top-color: #fff; border-radius: 50%; animation: wv-spin .6s linear infinite;
}

/* Transitions */
.wv-fade-enter-active, .wv-fade-leave-active { transition: opacity .22s ease; }
.wv-fade-enter-from, .wv-fade-leave-to { opacity: 0; }
.wv-slide-up-enter-active, .wv-slide-up-leave-active { transition: all .28s cubic-bezier(0.34,1.56,0.64,1); }
.wv-slide-up-enter-from { transform: translateY(28px) scale(.96); opacity: 0; }
.wv-slide-up-leave-to  { transform: translateY(16px) scale(.98); opacity: 0; }
</style>
