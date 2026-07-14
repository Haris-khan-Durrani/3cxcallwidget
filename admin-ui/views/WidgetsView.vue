<template>
  <AppLayout>
    <div class="page">
      <div class="page-header animate-fade-in">
        <div>
          <div class="title-row">
            <h2>My Widgets</h2>
            <span class="count-badge">{{ store.widgets.length }}</span>
          </div>
          <p class="page-sub">Create, style, and embed interactive 3CX web call widgets.</p>
        </div>
        <button class="btn btn-primary new-widget-btn" @click="showCreateModal = true">
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          New Widget
        </button>
      </div>

      <!-- Loading -->
      <div v-if="store.loading" class="empty">
        <div class="spinner"></div>
        <p>Loading widgets...</p>
      </div>

      <!-- Empty -->
      <div v-else-if="!store.widgets.length" class="empty">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-9 3h2v2h-2V7zm0 4h2v6h-2v-6zm-4-4h2v2H7V7zm0 4h2v6H7v-6zm10 6h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
        <h3>No widgets yet</h3>
        <p>Create your first widget and embed it on any website to start connecting customers to agents instantly.</p>
        <button class="btn btn-accent" style="margin-top:8px" @click="showCreateModal = true">Create first widget</button>
      </div>

      <!-- Widget Cards & Dashboard Sidebar layout -->
      <div v-else class="dashboard-layout">
        <div class="widgets-grid">
          <WidgetCard
            v-for="w in store.widgets"
            :key="w.id"
            :widget="w"
            @deleted="store.fetch()"
            @agent-added="store.fetch()"
            @agent-deleted="store.fetch()"
          />
        </div>

        <aside class="dashboard-sidebar animate-fade-in-right">
          <!-- Stats Summary Card -->
          <div class="sidebar-card card">
            <h4 class="sidebar-card-title">Quick Summary</h4>
            <div class="sidebar-stats">
              <div class="sidebar-stat">
                <span class="lbl">Active Widgets</span>
                <span class="val highlight-blue">{{ store.widgets.length }}</span>
              </div>
              <div class="sidebar-stat">
                <span class="lbl">Total Agents</span>
                <span class="val highlight-green">{{ totalAgents }}</span>
              </div>
            </div>
          </div>

          <!-- Embed Guide Card -->
          <div class="sidebar-card card">
            <h4 class="sidebar-card-title">Quick Embed Guide</h4>
            <p class="guide-desc">Paste the script tag just before the closing <code>&lt;/body&gt;</code> tag of your website.</p>
            
            <div class="tab-selectors">
              <button 
                v-for="t in ['HTML', 'WordPress', 'React']" 
                :key="t" 
                class="tab-btn" 
                :class="{ active: activeGuideTab === t }"
                @click="activeGuideTab = t"
              >
                {{ t }}
              </button>
            </div>

            <div class="guide-code-box">
              <pre v-if="activeGuideTab === 'HTML'"><code>&lt;!-- Include widget.js in body --&gt;
&lt;script src="http://localhost:3000/widget.js?id=WIDGET_ID"&gt;&lt;/script&gt;</code></pre>
              <pre v-else-if="activeGuideTab === 'WordPress'"><code>1. Go to WP Admin
2. Install "Header and Footer Post Injection"
3. Add script tag to Footer:
&lt;script src="http://localhost:3000/widget.js?id=WIDGET_ID"&gt;&lt;/script&gt;</code></pre>
              <pre v-else-if="activeGuideTab === 'React'"><code>// Add to public/index.html or use useEffect:
useEffect(() => {
  const s = document.createElement('script');
  s.src = "http://localhost:3000/widget.js?id=WIDGET_ID";
  s.async = true;
  document.body.appendChild(s);
  return () => document.body.removeChild(s);
}, []);</code></pre>
            </div>
          </div>

          <!-- Documentation Quick Links -->
          <div class="sidebar-card card doc-card">
            <h4 class="sidebar-card-title">Need Help?</h4>
            <p class="guide-desc">Read our setup guide to configure FQDN, Client Credentials, or Webhooks for 3CX.</p>
            <a href="https://www.3cx.com/docs/" target="_blank" class="doc-link">
              3CX Integration Docs ↗
            </a>
          </div>
        </aside>
      </div>
    </div>

    <!-- Create Widget Modal -->
    <teleport to="body">
      <transition name="fade">
        <div v-if="showCreateModal" class="modal-backdrop" @click.self="showCreateModal = false">
          <transition name="slide-up">
            <div class="modal-box card" @click.stop>
              <div class="modal-header">
                <h3>Create New Widget</h3>
                <button class="btn btn-icon btn-ghost" @click="showCreateModal = false">✕</button>
              </div>
              <div class="modal-body">
                <div class="form-row form-row-2">
                  <div class="form-group">
                    <label class="form-label">Widget Name *</label>
                    <input v-model="form.name" type="text" class="input" placeholder="e.g. Main Website" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">3CX Server URL (FQDN) *</label>
                    <input
                      v-model="form.fqdn_3cx"
                      type="text"
                      class="input"
                      placeholder="ebmsdxb.3cx.ae:3081"
                      @blur="form.fqdn_3cx = form.fqdn_3cx.replace(/^https?:\/\//i,'').replace(/\/$/,'')"
                    />
                  </div>
                </div>
                <div class="form-row form-row-2">
                  <div class="form-group">
                    <label class="form-label">Client ID *</label>
                    <input v-model="form.client_id_3cx" type="text" class="input" placeholder="your-client-id" />
                  </div>
                  <div class="form-group" style="position:relative">
                    <label class="form-label">Client Secret *</label>
                    <input
                      v-model="form.client_secret_3cx"
                      :type="showNewSecret ? 'text' : 'password'"
                      class="input"
                      placeholder="••••••••••••"
                      style="padding-right:36px"
                    />
                    <button
                      type="button"
                      @click="showNewSecret=!showNewSecret"
                      style="position:absolute;right:10px;bottom:10px;background:none;border:none;cursor:pointer;color:var(--text3);font-size:14px;padding:0"
                    >{{ showNewSecret ? '🙈' : '👁️' }}</button>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Fallback Extension / Queue <span style="color:var(--text3)">(optional)</span></label>
                  <input v-model="form.agent_extension_3cx" type="text" class="input" placeholder="800" />
                </div>
                <div class="form-group">
                  <label class="form-label">n8n / GoHighLevel Webhook URL <span style="color:var(--text3)">(optional)</span></label>
                  <input v-model="form.webhook_url_n8n" type="url" class="input" placeholder="https://your-n8n.com/webhook/..." />
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn btn-ghost" @click="showCreateModal = false">Cancel</button>
                <button class="btn btn-primary" :disabled="creating" @click="create">
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

const totalAgents = computed(() => {
  return store.widgets.reduce((acc, w) => acc + (w.Agents || []).length, 0)
})

const showNewSecret = ref(false)

const form = reactive({
  name: '', fqdn_3cx: '', client_id_3cx: '', client_secret_3cx: '',
  agent_extension_3cx: '', webhook_url_n8n: ''
})

onMounted(() => store.fetch())

async function create() {
  if (!form.name || !form.fqdn_3cx || !form.client_id_3cx || !form.client_secret_3cx) {
    return toast('Widget Name, FQDN, Client ID and Client Secret are required', 'error')
  }
  creating.value = true
  try {
    await store.create({ ...form })
    showCreateModal.value = false
    Object.assign(form, { name: '', fqdn_3cx: '', client_id_3cx: '', client_secret_3cx: '', agent_extension_3cx: '', webhook_url_n8n: '' })
    toast('Widget created successfully!')
  } catch { toast('Failed to create widget', 'error') }
  finally { creating.value = false }
}
</script>

<style scoped>
.page { padding: 32px 40px; width: 100%; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; }
.title-row { display: flex; align-items: center; gap: 12px; }
.count-badge { display: inline-flex; align-items: center; justify-content: center; background: linear-gradient(135deg, rgba(31,111,235,0.15), rgba(63,185,80,0.15)); border: 1px solid rgba(88,166,255,0.25); color: var(--accent); font-size: 12px; font-weight: 700; padding: 2px 10px; border-radius: 20px; }
.page-sub { color: var(--text2); font-size: 13px; margin-top: 6px; }

.new-widget-btn {
  background: linear-gradient(135deg, #238636, #2ea043);
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 4px 14px rgba(46,160,67,0.3);
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s ease, background 0.2s ease;
}
.new-widget-btn:hover {
  transform: scale(1.04);
  box-shadow: 0 6px 20px rgba(46,160,67,0.5);
  background: linear-gradient(135deg, #2ea043, #34d058);
}
.new-widget-btn:active {
  transform: scale(0.98);
}

.widgets-grid { display: flex; flex-direction: column; gap: 20px; }
.spinner { width: 28px; height: 28px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Modal Backdrop & Glassmorphism Box */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(10, 12, 16, 0.6);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.modal-box {
  width: 100%;
  max-width: 560px;
  background: linear-gradient(135deg, var(--bg2), var(--bg3));
  border: 1px solid rgba(128,128,128,0.2);
  box-shadow: 0 24px 60px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 24px 24px 8px; }
.modal-header h3 { font-size: 18px; font-weight: 700; letter-spacing: -0.3px; }
.modal-body { padding: 16px 24px 24px; display: flex; flex-direction: column; gap: 18px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 0 24px 24px; border-top: 1px solid rgba(128,128,128,0.1); padding-top: 16px; }

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.slide-up-enter-from { transform: translateY(24px) scale(0.96); opacity: 0; }
.slide-up-leave-to { transform: translateY(16px) scale(0.98); opacity: 0; }

/* Animation helper */
.animate-fade-in {
  animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Dashboard layout 2-column flex */
.dashboard-layout {
  display: flex;
  gap: 28px;
  align-items: flex-start;
  width: 100%;
}
.widgets-grid {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}
.dashboard-sidebar {
  width: 360px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

@media (max-width: 1024px) {
  .dashboard-layout {
    flex-direction: column;
    align-items: stretch;
  }
  .dashboard-sidebar {
    width: 100%;
  }
}

.sidebar-card {
  padding: 20px 24px;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.sidebar-card-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text3);
  letter-spacing: 0.6px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 8px;
  margin: 0;
}
.sidebar-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 4px;
}
.sidebar-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--bg);
  border: 1px solid var(--border);
  padding: 10px 12px;
  border-radius: var(--radius);
}
.sidebar-stat .lbl {
  font-size: 10px;
  color: var(--text3);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.2px;
}
.sidebar-stat .val {
  font-size: 20px;
  font-weight: 700;
  font-family: monospace;
}
.highlight-blue { color: var(--accent); }
.highlight-green { color: var(--green); }

.guide-desc {
  font-size: 12px;
  color: var(--text2);
  line-height: 1.5;
}
.tab-selectors {
  display: flex;
  gap: 4px;
  background: var(--bg);
  border: 1px solid var(--border);
  padding: 3px;
  border-radius: 8px;
}
.tab-btn {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text3);
  font-size: 11px;
  font-weight: 700;
  padding: 6px 0;
  border-radius: 6px;
  cursor: pointer;
  transition: var(--transition);
}
.tab-btn:hover {
  color: var(--text2);
}
.tab-btn.active {
  background: var(--bg3);
  color: var(--text);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.guide-code-box {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px;
  overflow-x: auto;
}
.guide-code-box pre {
  margin: 0;
}
.guide-code-box code {
  font-size: 11px;
  font-family: monospace;
  color: #1f6feb;
  line-height: 1.4;
}

.doc-card {
  background: var(--bg);
  border-color: rgba(88, 166, 255, 0.15);
}
.doc-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(88, 166, 255, 0.08);
  border: 1px solid rgba(88, 166, 255, 0.2);
  color: var(--accent);
  text-decoration: none;
  font-size: 12px;
  font-weight: 700;
  padding: 8px 16px;
  border-radius: var(--radius);
  transition: var(--transition);
  text-align: center;
  margin-top: 4px;
}
.doc-link:hover {
  background: var(--accent);
  color: #fff;
  box-shadow: 0 4px 12px rgba(88, 166, 255, 0.3);
}

/* Sidebar sliding animation */
.animate-fade-in-right {
  animation: fadeInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes fadeInRight {
  from { opacity: 0; transform: translateX(16px); }
  to { opacity: 1; transform: translateX(0); }
}
</style>
