<template>
  <AppLayout>
    <div class="page">
      <div class="page-header animate-fade-in">
        <div>
          <div class="title-row">
            <h2>AI & SIP Credentials</h2>
          </div>
          <p class="page-sub">Configure tenant-specific API keys for Deepgram, OpenRouter, Cartesia, and 3CX SIP.</p>
        </div>
      </div>


      <div class="card settings-card animate-fade-in-up">
        <div class="card-header">
          <span class="card-icon">🔑</span>
          <div>
            <h3>Provider Configuration</h3>
            <p class="card-desc">Keys are encrypted at rest using AES-256-GCM.</p>
          </div>
        </div>
        <div class="divider"></div>
        <div class="card-body">
          <div class="form-row form-row-2">
            <div class="form-group">
              <label class="form-label">Select AI Project</label>
              <div style="display: flex; gap: 8px;">
                <select v-model="form.ai_project_id" class="input" style="flex: 1;">
                  <option disabled value="">Select an AI Project...</option>
                  <option v-for="p in aiProjects" :key="p.id" :value="p.id">
                    {{ p.name }} ({{ p.fqdn_3cx }})
                  </option>
                </select>
                <button class="btn btn-outline" @click="showNewProjectModal = true">
                  + New
                </button>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Deepgram API Key</label>
              <input type="password" v-model="form.deepgram_key" class="input" placeholder="••••••••" />
            </div>
          </div>
          <div class="form-row form-row-2" style="margin-top:16px">
            <div class="form-group">
              <label class="form-label">OpenRouter API Key</label>
              <input type="password" v-model="form.openrouter_key" class="input" placeholder="••••••••" />
            </div>
            <div class="form-group">
              <label class="form-label">Cartesia API Key</label>
              <input type="password" v-model="form.cartesia_key" class="input" placeholder="••••••••" />
            </div>
          </div>
          
          <div class="form-row form-row-2" style="margin-top:16px">
            <div class="form-group">
              <label class="form-label">Cartesia Voice ID (Optional)</label>
              
              <div v-if="cartesiaVoices.length > 0" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px;">
                <div style="display: flex; gap: 8px;">
                  <select v-model="voiceLanguageFilter" class="input" style="flex: 1">
                    <option value="">All Languages</option>
                    <option v-for="lang in availableLanguages" :key="lang" :value="lang">
                      {{ languageNames[lang] || lang }}
                    </option>
                  </select>
                  <input type="text" v-model="voiceSearchQuery" class="input" placeholder="Search voices by name..." style="flex: 2" />
                </div>
              </div>

              <div style="display: flex; gap: 8px;">
                <select v-if="cartesiaVoices.length > 0" v-model="form.cartesia_voice_id" class="input">
                  <option disabled value="">Select a Cartesia Voice...</option>
                  <option v-for="v in filteredCartesiaVoices" :key="v.id" :value="v.id">
                    {{ v.name }} — {{ languageNames[v.language] || v.language }}
                  </option>
                </select>
                <input v-else type="text" v-model="form.cartesia_voice_id" class="input" placeholder="e.g. a0e99841..." />
                
                <button class="btn btn-outline" @click="fetchCartesiaVoices(false)" :disabled="!form.ai_project_id || fetchingVoices">
                  <span v-if="fetchingVoices" class="btn-spinner"></span>
                  Fetch Voices
                </button>
                <button class="btn btn-ghost" @click="previewCartesiaVoice" :disabled="!form.cartesia_voice_id || !form.ai_project_id || previewingVoice">
                  ▶ Play
                </button>
              </div>
              <p v-if="cartesiaVoices.length === 0" class="card-desc">Click Fetch to list voices (requires configured Cartesia Key first)</p>
            </div>
          </div>
          <div class="form-row form-row-2" style="margin-top:16px">
            <div class="form-group">
              <label class="form-label">Daily.co API Key</label>
              <input type="password" v-model="form.daily_key" class="input" placeholder="••••••••" />
            </div>
            <div class="form-group">
            </div>
          </div>
          <div class="form-row form-row-2" style="margin-top:16px">
            <div class="form-group">
              <label class="form-label">3CX SIP Extension</label>
              <input type="text" v-model="form.sip_extension" class="input" placeholder="e.g. 800" />
            </div>
            <div class="form-group">
              <label class="form-label">3CX SIP Password</label>
              <input type="password" v-model="form.sip_password" class="input" placeholder="••••••••" />
            </div>
          </div>
          <div class="action-row" style="margin-top:24px">
            <button class="btn btn-primary" :disabled="saving" @click="saveCredentials">
              <span v-if="saving" class="btn-spinner"></span>
              Save Encrypted Credentials
            </button>
          </div>
        </div>
      </div>
      <div class="table-wrap animate-fade-in-up" style="margin-top: 32px;">
        <table>
          <thead>
            <tr>
              <th>AI Project Name</th>
              <th>Deepgram</th>
              <th>OpenRouter</th>
              <th>Cartesia</th>
              <th>Daily</th>
              <th>3CX SIP</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="configuredCredentials.length === 0">
              <td colspan="7" style="text-align: center; padding: 30px; color: var(--text2);">No AI Projects have AI credentials configured yet.</td>
            </tr>
            <tr v-for="c in configuredCredentials" :key="c.ai_project_id">
              <td><strong>{{ c.project_name }}</strong></td>
              <td><span :class="c.has_deepgram ? 'badge-green' : 'badge-outline'">{{ c.has_deepgram ? 'Configured' : 'Missing' }}</span></td>
              <td><span :class="c.has_openrouter ? 'badge-green' : 'badge-outline'">{{ c.has_openrouter ? 'Configured' : 'Missing' }}</span></td>
              <td><span :class="c.has_cartesia ? 'badge-green' : 'badge-outline'">{{ c.has_cartesia ? 'Configured' : 'Missing' }}</span></td>
              <td><span :class="c.has_daily ? 'badge-green' : 'badge-outline'">{{ c.has_daily ? 'Configured' : 'Missing' }}</span></td>
              <td><span :class="c.has_sip ? 'badge-green' : 'badge-outline'">{{ c.has_sip ? c.sip_extension : 'Missing' }}</span></td>
              <td>
                <div style="display: flex; gap: 8px;">
                  <button class="btn btn-sm btn-ghost" @click="editCredential(c)">Edit / Add</button>
                  <button class="btn btn-sm btn-primary" @click="testCall(c.ai_project_id)" v-if="c.has_sip && c.has_deepgram && c.has_cartesia && c.has_openrouter">Test Call</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- New AI Project Modal -->
      <div class="modal-overlay" v-if="showNewProjectModal" @click.self="showNewProjectModal = false">
        <div class="modal-content animate-slide-up">
          <div class="modal-header">
            <h3>Create AI Project</h3>
            <button class="close-btn" @click="showNewProjectModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group" style="margin-bottom: 16px;">
              <label class="form-label">Project Name</label>
              <input type="text" v-model="newProjectForm.name" class="input" placeholder="e.g. Sales PBX AI" />
            </div>
            <div class="form-group">
              <label class="form-label">3CX Server FQDN</label>
              <input type="text" v-model="newProjectForm.fqdn_3cx" class="input" placeholder="e.g. mycompany.3cx.ae" />
            </div>
          </div>
          <div class="modal-footer" style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 8px;">
            <button class="btn btn-ghost" @click="showNewProjectModal = false">Cancel</button>
            <button class="btn btn-primary" @click="createAiProject" :disabled="creatingProject">
              <span v-if="creatingProject" class="btn-spinner"></span> Save Project
            </button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { reactive, ref, computed, onMounted, inject } from 'vue'
import axios from 'axios'
import AppLayout from '../components/AppLayout.vue'

const toast = inject('toast')
const aiProjects = ref([])
const configuredCredentials = ref([])
const saving = ref(false)

const showNewProjectModal = ref(false)
const creatingProject = ref(false)
const newProjectForm = reactive({
  name: '',
  fqdn_3cx: ''
})

const form = reactive({
  ai_project_id: '',
  deepgram_key: '',
  openrouter_key: '',
  cartesia_key: '',
  cartesia_voice_id: '',
  daily_key: '',
  sip_extension: '',
  sip_password: ''
})

const cartesiaVoices = ref([])
const voiceSearchQuery = ref('')
const voiceLanguageFilter = ref('')
const fetchingVoices = ref(false)
const previewingVoice = ref(false)
let audioPlayer = null

const LANGUAGE_NAMES = {
  'en': 'English', 'fr': 'French', 'de': 'German', 'es': 'Spanish',
  'pt': 'Portuguese', 'zh': 'Chinese', 'ja': 'Japanese', 'hi': 'Hindi',
  'it': 'Italian', 'ko': 'Korean', 'nl': 'Dutch', 'pl': 'Polish',
  'ru': 'Russian', 'sv': 'Swedish', 'tr': 'Turkish', 'tl': 'Tagalog',
  'bg': 'Bulgarian', 'ro': 'Romanian', 'ar': 'Arabic', 'cs': 'Czech',
  'el': 'Greek', 'fi': 'Finnish', 'hr': 'Croatian', 'ms': 'Malay',
  'sk': 'Slovak', 'da': 'Danish', 'ta': 'Tamil', 'uk': 'Ukrainian',
  'hu': 'Hungarian', 'no': 'Norwegian', 'vi': 'Vietnamese', 'bn': 'Bengali',
  'th': 'Thai', 'he': 'Hebrew', 'ka': 'Georgian', 'id': 'Indonesian',
  'te': 'Telugu', 'gu': 'Gujarati', 'kn': 'Kannada', 'ml': 'Malayalam',
  'mr': 'Marathi', 'pa': 'Punjabi'
}
const languageNames = LANGUAGE_NAMES

const availableLanguages = computed(() => {
  const langs = new Set(cartesiaVoices.value.map(v => v.language))
  return Array.from(langs).sort((a, b) => {
    const nameA = LANGUAGE_NAMES[a] || a
    const nameB = LANGUAGE_NAMES[b] || b
    return nameA.localeCompare(nameB)
  })
})

const filteredCartesiaVoices = computed(() => {
  return cartesiaVoices.value.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(voiceSearchQuery.value.toLowerCase()) || v.id.toLowerCase().includes(voiceSearchQuery.value.toLowerCase())
    const matchesLanguage = voiceLanguageFilter.value ? v.language === voiceLanguageFilter.value : true
    return matchesSearch && matchesLanguage
  })
})

const fetchAiProjects = async () => {
  try {
    const res = await axios.get('/api/admin/ai-projects')
    aiProjects.value = res.data
  } catch (err) {
    console.error('Failed to fetch ai projects:', err)
  }
}

const createAiProject = async () => {
  if (!newProjectForm.name || !newProjectForm.fqdn_3cx) return toast('Name and 3CX FQDN are required', 'error')
  creatingProject.value = true
  try {
    const res = await axios.post('/api/admin/ai-projects', newProjectForm)
    aiProjects.value.push(res.data)
    form.ai_project_id = res.data.id // auto select
    showNewProjectModal.value = false
    newProjectForm.name = ''
    newProjectForm.fqdn_3cx = ''
    toast('AI Project created!', 'success')
  } catch (err) {
    toast(err.response?.data?.error || 'Failed to create project', 'error')
  } finally {
    creatingProject.value = false
  }
}

const fetchCredentials = async () => {
  try {
    const res = await axios.get('/api/admin/ai-credentials')
    configuredCredentials.value = res.data
  } catch (err) {
    console.error('Failed to fetch configured credentials:', err)
  }
}

onMounted(() => {
  fetchAiProjects()
  fetchCredentials()
})

const editCredential = async (c) => {
  form.ai_project_id = c.ai_project_id
  form.deepgram_key = ''
  form.openrouter_key = ''
  form.cartesia_key = ''
  form.cartesia_voice_id = c.cartesia_voice_id || ''
  form.daily_key = ''
  form.sip_extension = c.sip_extension || ''
  form.sip_password = ''
  cartesiaVoices.value = [] // Reset voices list for the new project
  
  if (c.has_cartesia) {
    await fetchCartesiaVoices(true)
  } else {
    toast('Select a provider to update its key.', 'info')
  }
}

const fetchCartesiaVoices = async (silent = false) => {
  if (!form.ai_project_id) {
    if (!silent) toast('Please select an AI Project first', 'error')
    return
  }
  fetchingVoices.value = true
  try {
    const res = await axios.get(`/api/admin/ai-projects/${form.ai_project_id}/cartesia/voices`)
    cartesiaVoices.value = res.data || []
    if (cartesiaVoices.value.length > 0 && !form.cartesia_voice_id) {
      form.cartesia_voice_id = cartesiaVoices.value[0].id
    }
    if (!silent) toast('Cartesia voices loaded!', 'success')
  } catch (err) {
    if (!silent) toast(err.response?.data?.error || 'Failed to fetch voices. Ensure Cartesia key is saved first.', 'error')
  } finally {
    fetchingVoices.value = false
  }
}

const previewCartesiaVoice = async () => {
  if (!form.ai_project_id || !form.cartesia_voice_id) return toast('AI Project and Voice ID required', 'error')
  
  const selectedVoice = cartesiaVoices.value.find(v => v.id === form.cartesia_voice_id)
  const lang = selectedVoice ? selectedVoice.language : 'en'
  
  const previewTexts = {
    'en': "Hi, I am your AI assistant. How can I help you today?",
    'fr': "Bonjour, je suis votre assistant IA. Comment puis-je vous aider aujourd'hui ?",
    'de': "Hallo, ich bin Ihr KI-Assistent. Wie kann ich Ihnen heute helfen?",
    'es': "Hola, soy tu asistente de IA. ¿Cómo puedo ayudarte hoy?",
    'pt': "Olá, sou seu assistente de IA. Como posso ajudar hoje?",
    'zh': "你好，我是你的AI助手。今天我能为你做些什么？",
    'ja': "こんにちは、AIアシスタントです。本日はどのようなご用件でしょうか？",
    'hi': "नमस्ते, मैं आपका एआई सहायक हूं। आज मैं आपकी कैसे मदद कर सकता हूं?",
    'it': "Ciao, sono il tuo assistente virtuale. Come posso aiutarti oggi?",
    'ko': "안녕하세요, 인공지능 어시스턴트입니다. 무엇을 도와드릴까요?",
    'nl': "Hallo, ik ben uw AI-assistent. Hoe kan ik u vandaag helpen?",
    'pl': "Cześć, jestem twoim asystentem AI. W czym mogę ci dzisiaj pomóc?",
    'ru': "Здравствуйте, я ваш ИИ-помощник. Чем могу помочь сегодня?",
    'sv': "Hej, jag är din AI-assistent. Hur kan jag hjälpa dig idag?",
    'tr': "Merhaba, ben yapay zeka asistanınızım. Bugün size nasıl yardımcı olabilirim?",
    'tl': "Kamusta, ako ang iyong AI assistant. Paano kita matutulungan ngayon?",
    'bg': "Здравейте, аз съм вашият AI асистент. Как мога да ви помогна днес?",
    'ro': "Bună, sunt asistentul tău AI. Cum te pot ajuta astăzi?",
    'ar': "مرحبًا، أنا مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟",
    'cs': "Dobrý den, jsem váš AI asistent. Jak vám mohu dnes pomoci?",
    'el': "Γεια σας, είμαι ο βοηθός AI σας. Πώς μπορώ να σας βοηθήσω σήμερα;",
    'fi': "Hei, olen AI-avustajasi. Kuinka voin auttaa sinua tänään?",
    'hr': "Bok, ja sam vaš AI asistent. Kako vam mogu pomoći danas?",
    'ms': "Hai, saya pembantu AI anda. Bagaimana saya boleh membantu anda hari ini?",
    'sk': "Ahoj, som tvoj AI asistent. Ako ti môžem dnes pomôcť?",
    'da': "Hej, jeg er din AI-assistent. Hvordan kan jeg hjælpe dig i dag?",
    'ta': "வணக்கம், நான் உங்கள் AI உதவியாளர். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?",
    'uk': "Привіт, я ваш ШІ-помічник. Чим можу допомогти сьогодні?",
    'hu': "Szia, én vagyok a te AI asszisztensed. Miben segíthetek ma?",
    'no': "Hei, jeg er din AI-assistent. Hvordan kan jeg hjelpe deg i dag?",
    'vi': "Xin chào, tôi là trợ lý AI của bạn. Hôm nay tôi có thể giúp gì cho bạn?",
    'bn': "হ্যালো, আমি আপনার এআই সহকারী। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?",
    'th': "สวัสดี ฉันคือผู้ช่วย AI ของคุณ วันนี้ฉันจะช่วยอะไรคุณได้บ้าง?",
    'he': "שלום, אני עוזר ה-AI שלך. איך אני יכול לעזור לך היום?",
    'ka': "გამარჯობა, მე ვარ თქვენი AI ასისტენტი. რით შემიძლია დაგეხმაროთ დღეს?",
    'id': "Halo, saya asisten AI Anda. Bagaimana saya bisa membantu Anda hari ini?",
    'te': "హలో, నేను మీ AI సహాయకుడిని. ఈ రోజు నేను మీకు ఎలా సహాయపడగలను?",
    'gu': "નમસ્તે, હું તમારો AI સહાયક છું. આજે હું તમને કેવી રીતે મદદ કરી શકું?",
    'kn': "ಹಲೋ, ನಾನು ನಿಮ್ಮ AI ಸಹಾಯಕ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
    'ml': "നമസ്കാരം, ഞാൻ നിങ്ങളുടെ AI സഹായിയാണ്. ഇന്ന് ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കും?",
    'mr': "नमस्कार, मी तुमचा AI सहाय्यक आहे. मी आज तुम्हाला कशी मदत करू शकतो?",
    'pa': "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ ਤੁਹਾਡਾ AI ਸਹਾਇਕ ਹਾਂ। ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?"
  }
  
  const previewText = previewTexts[lang] || previewTexts['en']

  previewingVoice.value = true
  toast('Generating preview...', 'info')
  try {
    const res = await axios.post(`/api/admin/ai-projects/${form.ai_project_id}/cartesia/preview`, {
      voice_id: form.cartesia_voice_id,
      text: previewText,
      language: lang
    }, { responseType: 'blob' })
    
    if (audioPlayer) {
      audioPlayer.pause()
      audioPlayer = null
    }

    // res.data is already a Blob when responseType is 'blob'
    const audioBlob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'audio/wav' })
    const url = URL.createObjectURL(audioBlob)
    audioPlayer = new Audio(url)
    
    audioPlayer.onended = () => {
      URL.revokeObjectURL(url)
    }
    audioPlayer.onerror = (e) => {
      console.error('Audio playback error:', e)
      URL.revokeObjectURL(url)
      toast('Audio loaded but failed to play. Try a different voice.', 'error')
    }

    try {
      await audioPlayer.play()
      toast('Playing voice preview!', 'success')
    } catch (playErr) {
      // Autoplay blocked by browser - still let user know audio is ready
      console.warn('Autoplay blocked:', playErr.message)
      toast('Click anywhere on the page first, then try Play again (browser autoplay policy)', 'error')
      URL.revokeObjectURL(url)
    }
  } catch (err) {
    console.error('Preview error:', err)
    toast(err.response?.data?.error || 'Failed to generate voice preview', 'error')
  } finally {
    previewingVoice.value = false
  }
}

const saveCredentials = async () => {
  if (!form.ai_project_id) return toast('Please select an AI Project', 'error')
  
  if (form.cartesia_voice_id && cartesiaVoices.value.length > 0) {
    const selectedVoice = cartesiaVoices.value.find(v => v.id === form.cartesia_voice_id)
    if (selectedVoice) {
      form.cartesia_language = selectedVoice.language
    }
  }

  saving.value = true
  try {
    await axios.post('/api/admin/ai-credentials', form)
    toast('Credentials securely encrypted and saved!', 'success')
    form.deepgram_key = ''
    form.openrouter_key = ''
    form.cartesia_key = ''
    form.sip_password = ''
    fetchCredentials()
  } catch (err) {
    toast(err.response?.data?.error || 'Failed to save credentials', 'error')
  } finally {
    saving.value = false
  }
}

const testCall = async (ai_project_id) => {
  const destination = prompt("Enter phone number or extension to call (e.g. 101 or +1234567890):");
  if (!destination) return;
  
  try {
    toast('Triggering AI test call...', 'info');
    const res = await axios.post('/api/admin/test-call', {
      ai_project_id,
      destination
    });
    toast(`Test call initiated successfully! Call ID: ${res.data.call_id}`, 'success');
  } catch (err) {
    toast(err.response?.data?.error || 'Failed to trigger test call', 'error');
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
.table-wrap {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th {
  text-align: left;
  padding: 14px 20px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text2);
  border-bottom: 1px solid var(--border);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
td {
  padding: 14px 20px;
  font-size: 13px;
  color: var(--text);
  border-bottom: 1px solid var(--border);
}
tr:last-child td {
  border-bottom: none;
}
tr:hover td {
  background: var(--bg3);
}
.badge-green {
  background: rgba(63,185,80,.15); color: var(--green); border: 1px solid rgba(63,185,80,.2);
  padding: 2px 9px; border-radius: 20px; font-size: 11px; font-weight: 600;
}
.badge-outline {
  background: transparent; color: var(--text2); border: 1px solid var(--border);
  padding: 2px 9px; border-radius: 20px; font-size: 11px; font-weight: 600;
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
</style>
