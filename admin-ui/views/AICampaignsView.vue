<template>
  <AppLayout>
    <div class="page">
      <div class="page-header animate-fade-in">
        <div>
          <div class="title-row">
            <h2>AI Campaigns</h2>
            <span class="count-badge">{{ campaigns.length }}</span>
          </div>
          <p class="page-sub">Design intelligent outbound AI campaigns with custom system prompts.</p>
        </div>
        <button class="btn btn-primary" @click="openCreateModal()">
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          New Campaign
        </button>
      </div>

      <div v-if="loading" class="empty">
        <div class="spinner"></div>
        <p>Loading campaigns...</p>
      </div>

      <div v-else-if="!campaigns.length" class="empty animate-fade-in-up">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
        <h3>No AI Campaigns yet</h3>
        <p>Create your first campaign to define how your AI voice agent should interact with customers.</p>
      </div>

      <div v-else class="table-container animate-fade-in-up">
        <table class="data-table">
          <thead>
            <tr>
              <th>Campaign Name</th>
              <th>Language</th>
              <th>LLM Model</th>
              <th>System Prompt</th>
              <th>Knowledge Base</th>
              <th>Created</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in campaigns" :key="c.id">
              <td class="font-bold">{{ c.name }}</td>
              <td><span class="badge badge-outline">{{ c.language }}</span></td>
              <td><span class="badge badge-outline highlight-blue">{{ c.llm_model }}</span></td>
              <td class="text-muted"><div class="truncate-text">{{ c.system_prompt }}</div></td>
              <td>
                <span v-if="c.knowledge_base_status === 'Pending'" class="badge badge-outline highlight-blue">Indexing...</span>
                <span v-else-if="c.knowledge_base_status === 'Indexed'" class="badge badge-outline highlight-green">Indexed ({{ c.knowledge_base_file }})</span>
                <span v-else-if="c.knowledge_base_status === 'Failed'" class="badge badge-outline text-red">Failed</span>
                <span v-else class="text-muted">None</span>
              </td>
              <td class="text-muted">{{ new Date(c.createdAt).toLocaleDateString() }}</td>
              <td class="text-right">
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                  <button class="btn btn-sm btn-ghost" @click="editCampaign(c)">Edit</button>
                  <button class="btn btn-sm btn-ghost text-red" @click="deleteCampaign(c.id)">Delete</button>
                  <button class="btn btn-sm btn-primary" @click="testCampaign(c)">Test Campaign</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Campaign Modal -->
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content animate-slide-up">
          <div class="modal-header">
            <h3>{{ isEditing ? 'Edit Campaign' : 'Create Campaign' }}</h3>
            <button class="close-btn" @click="closeModal">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">AI Project</label>
              <select v-model="form.ai_project_id" class="input" :disabled="isEditing">
                <option value="">Select AI Project...</option>
                <option v-for="p in aiProjects" :key="p.id" :value="p.id">{{ p.name }} ({{ p.fqdn_3cx }})</option>
              </select>
            </div>
            
            <div class="form-group" style="margin-top: 16px;">
              <label class="form-label">Campaign Name</label>
              <input type="text" v-model="form.name" class="input" placeholder="e.g. Real Estate Outbound" />
            </div>

            <div class="form-row form-row-2" style="margin-top: 16px;">
              <div class="form-group">
                <label class="form-label">Language</label>
                <select v-model="form.language" class="input">
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="es-ES">Spanish</option>
                  <option value="fr-FR">French</option>
                  <option value="de-DE">German</option>
                  <option value="ar-AE">Arabic (UAE)</option>
                  <option value="hi-IN">Hindi</option>
                  <option value="zh-CN">Chinese (Mandarin)</option>
                  <option value="ja-JP">Japanese</option>
                  <option value="pt-BR">Portuguese (Brazil)</option>
                  <option value="ru-RU">Russian</option>
                  <option value="it-IT">Italian</option>
                  <option value="ko-KR">Korean</option>
                  <option value="nl-NL">Dutch</option>
                  <option value="pl-PL">Polish</option>
                  <option value="sv-SE">Swedish</option>
                  <option value="tr-TR">Turkish</option>
                  <option value="tl-PH">Tagalog</option>
                  <option value="bg-BG">Bulgarian</option>
                  <option value="ro-RO">Romanian</option>
                  <option value="cs-CZ">Czech</option>
                  <option value="el-GR">Greek</option>
                  <option value="fi-FI">Finnish</option>
                  <option value="hr-HR">Croatian</option>
                  <option value="ms-MY">Malay</option>
                  <option value="sk-SK">Slovak</option>
                  <option value="da-DK">Danish</option>
                  <option value="ta-IN">Tamil</option>
                  <option value="uk-UA">Ukrainian</option>
                  <option value="hu-HU">Hungarian</option>
                  <option value="no-NO">Norwegian</option>
                  <option value="vi-VN">Vietnamese</option>
                  <option value="bn-IN">Bengali</option>
                  <option value="th-TH">Thai</option>
                  <option value="he-IL">Hebrew</option>
                  <option value="id-ID">Indonesian</option>
                  <option value="ka-GE">Georgian</option>
                  <option value="te-IN">Telugu</option>
                  <option value="gu-IN">Gujarati</option>
                  <option value="kn-IN">Kannada</option>
                  <option value="ml-IN">Malayalam</option>
                  <option value="mr-IN">Marathi</option>
                  <option value="pa-IN">Punjabi</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">LLM Model</label>
                <select v-model="form.llm_model" class="input">
                  <option value="google/gemini-2-flash">Gemini 2.0 Flash (Fastest)</option>
                  <option value="google/gemini-pro">Gemini Pro</option>
                  <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
                  <option value="anthropic/claude-3-haiku">Claude 3 Haiku</option>
                </select>
              </div>
            </div>

            <div class="form-group" style="margin-top: 16px;">
              <label class="form-label">System Prompt / Instructions</label>
              <textarea v-model="form.system_prompt" class="input textarea" rows="8" placeholder="You are a helpful assistant for 3CX. Your goal is to..."></textarea>
              <p class="help-text">This is the core "brain" of the AI. Be specific about its persona, rules, and goals.</p>
            </div>

            <div class="form-group" style="margin-top: 16px;">
              <label class="form-label">Enterprise Knowledge Base (PDF)</label>
              <input type="file" @change="handleFileUpload" accept="application/pdf" multiple class="input" />
              <p class="help-text">Upload PDFs up to 20MB. The AI will strictly answer based on this context (RAG).</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="closeModal">Cancel</button>
            <button class="btn btn-primary" @click="saveCampaign" :disabled="saving">
              {{ saving ? 'Saving...' : 'Save Campaign' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import axios from 'axios'
import AppLayout from '../components/AppLayout.vue'

const toast = inject('toast')
const campaigns = ref([])
const aiProjects = ref([])
const loading = ref(true)

const showModal = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const selectedFiles = ref([])

const form = ref({
  id: null,
  ai_project_id: '',
  name: '',
  system_prompt: '',
  stt_provider: 'deepgram',
  llm_provider: 'openrouter',
  llm_model: 'google/gemini-2-flash',
  tts_provider: 'cartesia',
  language: 'en-US'
})

const fetchAiProjects = async () => {
  try {
    const res = await axios.get('/api/admin/ai-projects')
    aiProjects.value = res.data
  } catch (err) {
    console.error('Failed to load AI Projects:', err)
  }
}

const fetchCampaigns = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/admin/ai-campaigns')
    campaigns.value = res.data
  } catch (err) {
    console.error('Failed to load campaigns:', err)
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  isEditing.value = false
  form.value = {
    id: null,
    ai_project_id: aiProjects.value.length > 0 ? aiProjects.value[0].id : '',
    name: '',
    system_prompt: 'You are a helpful assistant. Keep responses brief and polite.',
    stt_provider: 'deepgram',
    llm_provider: 'openrouter',
    llm_model: 'google/gemini-2-flash',
    tts_provider: 'cartesia',
    language: 'en-US'
  }
  selectedFiles.value = []
  showModal.value = true
}

const handleFileUpload = (event) => {
  selectedFiles.value = Array.from(event.target.files)
}

const editCampaign = (c) => {
  isEditing.value = true
  form.value = { ...c }
  selectedFiles.value = []
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const saveCampaign = async () => {
  if (!form.value.ai_project_id || !form.value.name || !form.value.system_prompt) {
    return toast('AI Project, Name, and System Prompt are required', 'error')
  }
  
  saving.value = true
  try {
    let campaignId = form.value.id;
    if (isEditing.value) {
      const res = await axios.put(`/api/admin/ai-campaigns/${campaignId}`, form.value)
      toast('Campaign updated!', 'success')
    } else {
      const res = await axios.post('/api/admin/ai-campaigns', form.value)
      campaignId = res.data.id;
      toast('Campaign created!', 'success')
    }
    
    if (selectedFiles.value.length > 0 && campaignId) {
      toast('Uploading knowledge base...', 'info')
      const formData = new FormData()
      selectedFiles.value.forEach(f => formData.append('files', f))
      
      const token = localStorage.getItem('jwt')
      await axios.post(`/api/campaigns/${campaignId}/knowledge-base`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      })
      toast('Knowledge base uploaded! Indexing started.', 'success')
    }
    
    closeModal()
    fetchCampaigns()
  } catch (err) {
    toast(err.response?.data?.error || 'Failed to save campaign', 'error')
  } finally {
    saving.value = false
  }
}

const deleteCampaign = async (id) => {
  if (!confirm('Are you sure you want to delete this campaign?')) return
  try {
    await axios.delete(`/api/admin/ai-campaigns/${id}`)
    toast('Campaign deleted!', 'success')
    fetchCampaigns()
  } catch (err) {
    toast(err.response?.data?.error || 'Failed to delete campaign', 'error')
  }
}

const testCampaign = async (c) => {
  const destination = prompt(`Enter phone number or extension to test Campaign: ${c.name}`);
  if (!destination) return;
  
  try {
    toast('Triggering AI test call...', 'info');
    const res = await axios.post('/api/admin/test-call', {
      ai_project_id: c.ai_project_id,
      campaign_id: c.id,
      destination
    });
    toast(`Test call initiated! Call ID: ${res.data.call_id}`, 'success');
  } catch (err) {
    toast(err.response?.data?.error || 'Failed to trigger test call', 'error');
  }
}

onMounted(() => {
  fetchAiProjects()
  fetchCampaigns()
})
</script>

<style scoped>
.page {
  padding: 30px;
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.table-container {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th {
  text-align: left;
  padding: 16px 20px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text2);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border);
}
.data-table td {
  padding: 16px 20px;
  font-size: 14px;
  color: var(--text);
  border-bottom: 1px solid var(--border);
}
.data-table tr:last-child td {
  border-bottom: none;
}
.data-table tr:hover td {
  background: var(--bg3);
}

.truncate-text {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.text-red {
  color: #ef4444;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}
.modal-content {
  background: var(--bg);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0,0,0,0.2);
}
.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text2);
  cursor: pointer;
  line-height: 1;
}
.close-btn:hover {
  color: var(--text);
}
.modal-body {
  padding: 24px;
  overflow-y: auto;
}
.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.textarea {
  font-family: monospace;
  resize: vertical;
}

.help-text {
  font-size: 12px;
  color: var(--text2);
  margin-top: 6px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row {
  display: flex;
  gap: 16px;
}
.form-row-2 > * {
  flex: 1;
}
</style>
