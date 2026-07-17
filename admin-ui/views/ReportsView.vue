<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Call Reports</h2>
          <p class="page-sub">Track every lead and call initiated through your widgets</p>
        </div>
      </div>

      <div class="widget-select-row card">
        <div class="form-group select-widget-group">
          <label class="form-label">Select Widget</label>
          <select v-model="selectedId" class="input" @change="load">
            <option value="">-- Choose a widget --</option>
            <option v-for="w in store.widgets" :key="w.id" :value="w.id">{{ w.name }}</option>
          </select>
        </div>
        <div v-if="selectedId" class="filters-wrap">
          <div class="form-group filter-field">
            <label class="form-label">Date Range</label>
            <select v-model="dateFilter" class="input">
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          <div v-if="dateFilter === 'custom'" class="form-group filter-field">
            <label class="form-label">From</label>
            <input type="date" v-model="customStartDate" class="input" />
          </div>
          <div v-if="dateFilter === 'custom'" class="form-group filter-field">
            <label class="form-label">To</label>
            <input type="date" v-model="customEndDate" class="input" />
          </div>
          <div class="form-group filter-field">
            <label class="form-label">Status</label>
            <select v-model="statusFilter" class="input">
              <option value="">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Answered">Answered</option>
              <option value="Ringing">Ringing</option>
              <option value="Initiated">Initiated</option>
              <option value="Failed">Failed / Missed</option>
            </select>
          </div>
          <div class="form-group filter-field">
            <label class="form-label">Agent</label>
            <select v-model="agentFilter" class="input">
              <option value="">All Agents</option>
              <option v-for="a in currentWidget?.Agents || []" :key="a.id" :value="a.extension">
                {{ a.first_name }} {{ a.last_name || '' }} ({{ a.extension }})
              </option>
            </select>
          </div>
          <button class="btn btn-ghost btn-sm refresh-btn" @click="load" title="Refresh call log">↻ Refresh</button>
          <button class="btn btn-primary btn-sm refresh-btn" @click="downloadCSV" :disabled="!filteredRecords.length" title="Download CSV Report">📥 Download CSV</button>
        </div>
      </div>

      <!-- No selection -->
      <div v-if="!selectedId" class="empty">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
        <p>Select a widget above to view its call history and statistics</p>
      </div>

      <!-- Loading -->
      <div v-else-if="loading" class="empty">
        <div class="spinner"></div>
        <p>Loading report...</p>
      </div>

      <!-- Report -->
      <div v-else-if="report">
        <!-- KPI Charts -->
        <div class="kpi-charts-row">
          <!-- Call Volume Line/Area Chart -->
          <div class="kpi-card card flex-2">
            <div class="kpi-header">
              <h4>Call Volume Trend (Last 7 Days)</h4>
              <span class="kpi-sub">Total calls per day over the last 7 days</span>
            </div>
            <div class="chart-container">
              <svg :viewBox="`0 0 ${weeklyCallChartData.width} ${weeklyCallChartData.height}`" class="line-chart-svg">
                <!-- Gradients -->
                <defs>
                  <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.25"/>
                    <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
                  </linearGradient>
                </defs>
                <!-- Grid Lines -->
                <line 
                  v-for="idx in 4" :key="idx" 
                  :x1="40" :y1="20 + (idx - 1) * 26.6" 
                  :x2="460" :y2="20 + (idx - 1) * 26.6" 
                  stroke="var(--border)" stroke-width="1" stroke-dasharray="3,3"
                />
                <!-- Gradient Area Fill -->
                <path 
                  v-if="weeklyCallChartData.areaPath" 
                  :d="weeklyCallChartData.areaPath" 
                  fill="url(#area-gradient)"
                />
                <!-- Line Path -->
                <path 
                  v-if="weeklyCallChartData.path" 
                  :d="weeklyCallChartData.path" 
                  fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"
                />
                <!-- Points and Tooltips -->
                <g v-for="(p, idx) in weeklyCallChartData.points" :key="idx">
                  <circle 
                    :cx="p.x" :cy="p.y" r="5" 
                    fill="var(--bg2)" stroke="var(--accent)" stroke-width="3"
                  />
                  <!-- Value display above circle -->
                  <text 
                    :x="p.x" :y="p.y - 10" 
                    text-anchor="middle" font-size="11" font-weight="700" fill="var(--text)"
                  >
                    {{ p.count }}
                  </text>
                  <!-- Label on X-axis -->
                  <text 
                    :x="p.x" :y="weeklyCallChartData.height - 4" 
                    text-anchor="middle" font-size="10" font-weight="500" fill="var(--text3)"
                  >
                    {{ p.label }}
                  </text>
                </g>
              </svg>
            </div>
          </div>

          <!-- Answer Rate Donut Chart -->
          <div class="kpi-card card flex-1">
            <div class="kpi-header">
              <h4>Answer Rate</h4>
              <span class="kpi-sub">Percentage of successfully connected calls</span>
            </div>
            <div class="donut-container">
              <svg viewBox="0 0 100 100" class="donut-chart-svg">
                <!-- Background Circle -->
                <circle cx="50" cy="50" r="38" class="donut-bg" stroke="var(--border)" stroke-width="8" fill="transparent" />
                <!-- Progress Circle -->
                <circle 
                  cx="50" cy="50" r="38" 
                  class="donut-progress" 
                  stroke="var(--green)" stroke-width="8" fill="transparent"
                  stroke-dasharray="238.76"
                  :stroke-dashoffset="238.76 * (1 - answerRatePercentage / 100)"
                  stroke-linecap="round"
                  transform="rotate(-90 50 50)"
                />
                <!-- Inner Text -->
                <text x="50" y="52" text-anchor="middle" class="donut-value" fill="var(--text)">{{ answerRatePercentage }}%</text>
                <text x="50" y="66" text-anchor="middle" class="donut-lbl" fill="var(--text3)">Connected</text>
              </svg>
            </div>
          </div>
        </div>

        <!-- Tab Navigation Bar -->
        <div class="tabs-nav-bar card">
          <button 
            class="nav-tab-btn" 
            :class="{ active: activeTab === 'calls' }" 
            @click="activeTab = 'calls'"
          >
            📋 Call Log & History
          </button>
          <button 
            class="nav-tab-btn" 
            :class="{ active: activeTab === 'agents' }" 
            @click="activeTab = 'agents'"
          >
            👥 Agent Performance Report
          </button>
        </div>

        <!-- Call Log Tab -->
        <div v-if="activeTab === 'calls'" class="card animate-fade-in" style="overflow:hidden;">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border);">
            <h3>Call Log</h3>
            <div class="search-wrap">
              <input v-model="search" type="text" class="input" placeholder="Search by name or phone..." style="width:260px;" />
            </div>
          </div>

          <div v-if="!filteredRecords.length" class="empty" style="padding:40px;">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
            <p>No calls match your filters</p>
          </div>

          <div v-else class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th @click="sortBy('customer_name')" class="sortable">Name <span class="sort-icon">{{ sortKey === 'customer_name' ? (sortDir === 'asc' ? '↑' : '↓') : '⇅' }}</span></th>
                  <th>Phone</th>
                  <th>Agent Call Flow (Attempts)</th>
                  <th @click="sortBy('duration_seconds')" class="sortable">Duration <span class="sort-icon">{{ sortKey === 'duration_seconds' ? (sortDir === 'asc' ? '↑' : '↓') : '⇅' }}</span></th>
                  <th @click="sortBy('status')" class="sortable">Status <span class="sort-icon">{{ sortKey === 'status' ? (sortDir === 'asc' ? '↑' : '↓') : '⇅' }}</span></th>
                  <th>Rec</th>
                  <th @click="sortBy('createdAt')" class="sortable">Date &amp; Time <span class="sort-icon">{{ sortKey === 'createdAt' ? (sortDir === 'asc' ? '↑' : '↓') : '⇅' }}</span></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in paginatedRecords" :key="r.id">
                  <td><strong>{{ r.customer_name }}</strong></td>
                  <td><code style="font-size:12px;">{{ r.customer_phone }}</code></td>
                  <td>
                    <div v-if="r.agent_extension" class="call-flow-container">
                      <div v-for="(step, idx) in parseCallFlow(r.agent_extension, r.status)" :key="idx" class="call-flow-step">
                        <span v-if="idx > 0" class="flow-arrow">➔</span>
                        <span class="flow-badge" :class="step.answered ? 'flow-badge-green' : (step.statusText === 'Busy' ? 'flow-badge-orange' : 'flow-badge-red')" :title="step.answered ? 'Answered call' : (step.statusText === 'Busy' ? 'Agent busy' : 'Missed/Declined call')">
                          <span class="flow-status-icon">{{ step.answered ? '✅' : (step.statusText === 'Busy' ? '⏳' : '❌') }}</span>
                          <span class="flow-agent-name">{{ step.name }}</span>
                          <span class="flow-agent-ext">({{ step.ext }})</span>
                        </span>
                      </div>
                    </div>
                    <span v-else style="color:var(--text3)">—</span>
                  </td>
                  <td>
                    <strong v-if="r.duration_seconds">{{ formatDuration(r.duration_seconds) }}</strong>
                    <span v-else style="color:var(--text3)">—</span>
                  </td>
                  <td>
                    <span class="badge" :class="statusClass(r.status)">{{ r.status }}</span>
                  </td>
                  <td>
                    <div class="rec-cell">
                      <div v-if="activeAudioRowId === r.id" class="inline-player">
                        <audio 
                          ref="audioRef" 
                          :src="getListenUrl(r)" 
                          autoplay
                          @play="audioPlaying = true"
                          @pause="audioPlaying = false"
                          @timeupdate="onTimeUpdate"
                          @loadedmetadata="onLoadedMetadata"
                          @ended="onAudioEnded"
                          style="display: none;"
                        ></audio>
                        
                        <button class="inline-btn play-btn" @click.prevent="togglePlay" type="button">
                          <span v-if="audioPlaying">⏸️</span>
                          <span v-else>▶️</span>
                        </button>
                        
                        <div class="inline-timeline">
                          <span class="inline-time">{{ formatAudioTime(audioCurrentTime) }}</span>
                          <input 
                            type="range" 
                            min="0" 
                            :max="audioDuration || 100" 
                            :value="audioCurrentTime" 
                            @input="onSeek" 
                            class="inline-slider" 
                          />
                          <span class="inline-time">{{ formatAudioTime(audioDuration) }}</span>
                        </div>
                        
                        <button class="inline-btn close-btn" @click.prevent="closeAudio" title="Close">✕</button>
                      </div>

                      <a v-else-if="r.recording_id" href="javascript:void(0)" @click.prevent="playInline(r)" class="rec-link" title="Play recording">
                        <svg style="width:16px;height:16px;display:block;" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                        </svg>
                      </a>
                      <span v-else style="color:var(--text3)">—</span>
                    </div>
                  </td>
                  <td style="color:var(--text2);font-size:12px;">{{ formatDate(r.createdAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="pagination">
            <button class="btn btn-ghost btn-sm" :disabled="page <= 1" @click="page--">← Prev</button>
            <span style="font-size:13px;color:var(--text2);">Page {{ page }} / {{ totalPages }}</span>
            <button class="btn btn-ghost btn-sm" :disabled="page >= totalPages" @click="page++">Next →</button>
          </div>
        </div>

        <!-- Agent Performance Tab -->
        <div v-else-if="activeTab === 'agents'" class="card animate-fade-in" style="overflow:hidden;">
          <div style="padding:16px 20px;border-bottom:1px solid var(--border);">
            <h3>Agent Call Metrics Summary</h3>
            <p style="font-size:12px;color:var(--text3);margin-top:4px;">Performance KPIs calculated across all call records for the selected widget</p>
          </div>
          
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Agent Name</th>
                  <th style="text-align:center;">Extension</th>
                  <th style="text-align:center;">Total Opportunities</th>
                  <th style="text-align:center;">Answered</th>
                  <th style="text-align:center;">Missed</th>
                  <th style="text-align:center;">Busy</th>
                  <th style="text-align:center;">Answer Rate</th>
                  <th style="text-align:center;">Avg Talk Time</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="agent in agentPerformanceStats" :key="agent.id">
                  <td>
                    <div style="display:flex;align-items:center;gap:12px;">
                      <img v-if="agent.avatar" :src="agent.avatar" class="agent-av-icon" />
                      <div v-else class="agent-av-placeholder">{{ agent.name.charAt(0) }}</div>
                      <strong>{{ agent.name }}</strong>
                    </div>
                  </td>
                  <td style="text-align:center;"><span class="ext-badge">{{ agent.extension }}</span></td>
                  <td style="text-align:center;font-weight:700;">{{ agent.attempts }}</td>
                  <td style="text-align:center;color:var(--green);font-weight:700;">{{ agent.answered }}</td>
                  <td style="text-align:center;color:var(--red);font-weight:700;">{{ agent.missed }}</td>
                  <td style="text-align:center;color:var(--orange);font-weight:700;">{{ agent.busy }}</td>
                  <td style="text-align:center;">
                    <div class="perf-bar-wrap">
                      <span class="perf-pct" :style="{ color: agent.answerRate >= 70 ? 'var(--green)' : (agent.answerRate >= 40 ? 'var(--orange)' : 'var(--red)') }">
                        {{ agent.answerRate }}%
                      </span>
                      <div class="perf-bar-bg">
                        <div class="perf-bar-fill" :style="{ width: agent.answerRate + '%', background: agent.answerRate >= 70 ? 'var(--green)' : (agent.answerRate >= 40 ? 'var(--orange)' : 'var(--red)') }"></div>
                      </div>
                    </div>
                  </td>
                  <td style="text-align:center;font-weight:600;">
                    {{ formatDuration(agent.avgDuration) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, inject, nextTick } from 'vue'
import axios from 'axios'
import AppLayout from '../components/AppLayout.vue'
import { useWidgetStore } from '../stores'

const store = useWidgetStore()
const toast = inject('toast')
const selectedId = ref('')
const loading = ref(false)
const report = ref(null)
const search = ref('')
const sortKey = ref('createdAt')
const sortDir = ref('desc')
const page = ref(1)
const perPage = 15
let pollTimer = null

// New filter state variables
const dateFilter = ref('all')
const customStartDate = ref('')
const customEndDate = ref('')
const statusFilter = ref('')
const agentFilter = ref('')
const activeTab = ref('calls')

// Inline audio player state
const activeAudioRowId = ref(null)
const audioRef = ref(null)
const audioPlaying = ref(false)
const audioDuration = ref(0)
const audioCurrentTime = ref(0)

function playInline(r) {
  if (activeAudioRowId.value === r.id) {
    togglePlay()
    return
  }
  activeAudioRowId.value = r.id
  audioPlaying.value = false
  audioCurrentTime.value = 0
  audioDuration.value = 0

  nextTick(() => {
    if (audioRef.value) {
      audioRef.value.load()
      audioRef.value.play().catch(err => {
        console.error('Audio playback failed:', err)
      })
    }
  })
}

function togglePlay() {
  if (!audioRef.value) return
  if (audioPlaying.value) {
    audioRef.value.pause()
  } else {
    audioRef.value.play().catch(e => console.error(e))
  }
}

function closeAudio() {
  if (audioRef.value) {
    audioRef.value.pause()
  }
  activeAudioRowId.value = null
  audioPlaying.value = false
}

function onTimeUpdate() {
  if (audioRef.value) {
    audioCurrentTime.value = audioRef.value.currentTime
  }
}

function onLoadedMetadata() {
  if (audioRef.value) {
    audioDuration.value = audioRef.value.duration
  }
}

function onSeek(e) {
  if (audioRef.value) {
    audioRef.value.currentTime = parseFloat(e.target.value)
    audioCurrentTime.value = audioRef.value.currentTime
  }
}

function onAudioEnded() {
  audioPlaying.value = false
  audioCurrentTime.value = 0
}

function formatAudioTime(s) {
  if (!s || isNaN(s)) return '0:00'
  const mins = Math.floor(s / 60)
  const secs = Math.floor(s % 60)
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

function getListenUrl(r) {
  const token = localStorage.getItem('admin_token') || ''
  const apiBase = import.meta.env.VITE_API_URL || window.location.origin
  return `${apiBase}/api/admin/widgets/${r.widgetId}/recordings/${r.recording_id}/listen?token=${encodeURIComponent(token)}`
}

onMounted(() => {
  if (!store.widgets.length) store.fetch()
  // Background polling to auto-update call status
  pollTimer = setInterval(async () => {
    if (!selectedId.value || loading.value) return
    const hasActiveCalls = report.value?.records?.some(r => ['Initiated', 'Ringing', 'Answered'].includes(r.status))
    if (hasActiveCalls) {
      try {
        const res = await axios.get(`/api/admin/widgets/${selectedId.value}/stats`)
        report.value = res.data
      } catch (e) {
        console.error('Stats poll failed:', e)
      }
    }
  }, 4000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

async function load() {
  if (!selectedId.value) return
  loading.value = true
  report.value = null
  try {
    const res = await axios.get(`/api/admin/widgets/${selectedId.value}/stats`)
    report.value = res.data
    page.value = 1
  } catch { toast('Failed to load report', 'error') }
  finally { loading.value = false }
}

const currentWidget = computed(() => store.widgets.find(w => w.id === selectedId.value))

function getAgentName(ext) {
  if (!currentWidget.value || !currentWidget.value.Agents) return ext
  const agent = currentWidget.value.Agents.find(a => String(a.extension) === String(ext).trim())
  return agent ? `${agent.first_name} ${agent.last_name || ''}`.trim() : ext
}

function parseCallFlow(agentExts, status) {
  if (!agentExts) return []
  const exts = agentExts.split(',').map(x => x.trim()).filter(Boolean)
  return exts.map((extRaw, index) => {
    const parts = extRaw.split(':')
    const ext = parts[0]
    const extStatus = parts[1] || 'missed'
    const isLast = index === exts.length - 1
    const answered = extStatus === 'answered' || (isLast && ['Completed', 'Answered'].includes(status))
    
    let statusText = 'Missed'
    if (answered) statusText = 'Answered'
    else if (extStatus === 'busy') statusText = 'Busy'
    
    return {
      ext,
      name: getAgentName(ext),
      answered,
      statusText
    }
  })
}

// Filtered Records logic based on search, status, date, agent
const filteredRecords = computed(() => {
  if (!report.value) return []
  let r = report.value.records || []

  // 1. Search Query Filter
  if (search.value) {
    const q = search.value.toLowerCase()
    r = r.filter(x => 
      x.customer_name?.toLowerCase().includes(q) || 
      x.customer_phone?.includes(q) || 
      x.agent_extension?.includes(q)
    )
  }

  // 2. Status Filter
  if (statusFilter.value) {
    if (statusFilter.value === 'Failed') {
      r = r.filter(x => ['Failed', 'Missed', 'Abandoned'].includes(x.status))
    } else {
      r = r.filter(x => x.status === statusFilter.value)
    }
  }

  // 3. Agent Filter
  if (agentFilter.value) {
    r = r.filter(x => {
      if (!x.agent_extension) return false
      const flowExts = x.agent_extension.split(',').map(e => e.trim().split(':')[0])
      return flowExts.includes(String(agentFilter.value))
    })
  }

  // 4. Date Range Filter
  if (dateFilter.value !== 'all') {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    
    r = r.filter(x => {
      const ts = new Date(x.createdAt).getTime()
      if (dateFilter.value === 'today') {
        return ts >= startOfToday
      } else if (dateFilter.value === '7days') {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
        return ts >= sevenDaysAgo
      } else if (dateFilter.value === '30days') {
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
        return ts >= thirtyDaysAgo
      } else if (dateFilter.value === 'custom') {
        if (!customStartDate.value && !customEndDate.value) return true
        // Add local timezone offset for accurate day matching
        const start = customStartDate.value ? new Date(customStartDate.value).getTime() : 0
        const end = customEndDate.value ? new Date(customEndDate.value).getTime() + 86399999 : Infinity
        return ts >= start && ts <= end
      }
      return true
    })
  }

  // 5. Sorting
  return [...r].sort((a, b) => {
    let va = a[sortKey.value], vb = b[sortKey.value]
    if (sortKey.value === 'createdAt') { va = new Date(va); vb = new Date(vb) }
    if (va < vb) return sortDir.value === 'asc' ? -1 : 1
    if (va > vb) return sortDir.value === 'asc' ? 1 : -1
    return 0
  })
})

// Dynamic statistics computed based on filtered records
const filteredTotal = computed(() => filteredRecords.value.length)
const filteredCompleted = computed(() => filteredRecords.value.filter(x => x.status === 'Completed' || x.status === 'Answered').length)
const filteredInitiated = computed(() => filteredRecords.value.filter(x => x.status === 'Initiated' || x.status === 'Ringing').length)
const filteredFailed = computed(() => filteredRecords.value.filter(x => ['Failed', 'Missed', 'Abandoned'].includes(x.status)).length)

// Dynamic answer rate percentage based on filtered records
const answerRatePercentage = computed(() => {
  if (!filteredTotal.value) return 0
  return Math.round((filteredCompleted.value / filteredTotal.value) * 100)
})

// Dynamic weekly call volume data for SVG charts
const weeklyCallChartData = computed(() => {
  const data = []
  const now = new Date()
  
  // Create last 7 days list
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(now.getDate() - i)
    const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    const dayEnd = dayStart + 24 * 60 * 60 * 1000
    
    // Count calls in this day
    const count = filteredRecords.value.filter(x => {
      const ts = new Date(x.createdAt).getTime()
      return ts >= dayStart && ts < dayEnd
    }).length
    
    data.push({ label: dateStr, count })
  }
  
  const width = 500
  const height = 140
  const paddingX = 40
  const paddingY = 25
  
  const maxCount = Math.max(5, ...data.map(x => x.count))
  
  const points = data.map((item, idx) => {
    const x = paddingX + (idx / (data.length - 1)) * (width - 2 * paddingX)
    const y = height - paddingY - (item.count / maxCount) * (height - 2 * paddingY - 10)
    return { x, y, count: item.count, label: item.label }
  })
  
  // Draw line path
  let path = ''
  if (points.length > 0) {
    path = `M ${points[0].x} ${points[0].y}`
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`
    }
  }
  
  // Draw area path (gradient fill)
  let areaPath = ''
  if (points.length > 0) {
    areaPath = `${path} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
  }
  
  return { points, path, areaPath, data, height, width, paddingY }
})

const agentPerformanceStats = computed(() => {
  if (!currentWidget.value || !report.value) return []
  
  const agents = currentWidget.value.Agents || []
  const records = filteredRecords.value || []
  
  return agents.map(agent => {
    const extStr = String(agent.extension)
    let attempts = 0
    let answered = 0
    let missed = 0
    let busy = 0
    let totalDuration = 0
    
    records.forEach(r => {
      if (!r.agent_extension) return
      const flow = parseCallFlow(r.agent_extension, r.status)
      const agentStep = flow.find(step => String(step.ext) === extStr)
      if (agentStep) {
        attempts++
        if (agentStep.answered) {
          answered++
          totalDuration += (r.duration_seconds || 0)
        } else if (agentStep.statusText === 'Busy') {
          busy++
        } else {
          missed++
        }
      }
    })
    
    const answerRate = attempts ? Math.round((answered / attempts) * 100) : 0
    const avgDuration = answered ? Math.round(totalDuration / answered) : 0
    
    return {
      id: agent.id,
      name: `${agent.first_name} ${agent.last_name || ''}`.trim(),
      extension: agent.extension,
      avatar: agent.avatar,
      attempts,
      answered,
      missed,
      busy,
      answerRate,
      avgDuration
    }
  })
})

// Pagination logic
const totalPages = computed(() => Math.ceil(filteredRecords.value.length / perPage))

function downloadCSV() {
  if (!filteredRecords.value.length) return
  const rows = [
    ['Name', 'Phone', 'Agent Call Flow', 'Duration', 'Status', 'Date & Time']
  ]
  filteredRecords.value.forEach(r => {
    let flowStr = ''
    if (r.agent_extension) {
      const flow = parseCallFlow(r.agent_extension, r.status)
      flowStr = flow.map(f => `${f.name} (${f.statusText})`).join(' -> ')
    }
    rows.push([
      r.customer_name || '-',
      r.customer_phone || '-',
      flowStr || '-',
      r.duration_seconds || '0s',
      r.status || 'Unknown',
      new Date(r.createdAt).toLocaleString()
    ])
  })
  
  const csvContent = rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `3cx_report_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const paginatedRecords = computed(() => filteredRecords.value.slice((page.value - 1) * perPage, page.value * perPage))

function sortBy(key) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'desc' }
}

function statusClass(s) {
  return {
    'badge-blue': s === 'Answered',
    'badge-orange': s === 'Ringing',
    'badge-gray': s === 'Initiated',
    'badge-green': s === 'Completed',
    'badge-red': ['Failed', 'Missed', 'Abandoned'].includes(s)
  }
}

function formatDuration(s) {
  if (!s) return '—'
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

function formatDate(d) {
  return new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function getRecordingUrl(r) {
  const token = localStorage.getItem('admin_token') || ''
  const apiBase = import.meta.env.VITE_API_URL || ''
  return `${apiBase}/api/admin/widgets/${r.widgetId}/recordings/${r.recording_id}/download?token=${encodeURIComponent(token)}`
}
</script>


<style scoped>
.page { padding: 32px 40px; width: 100%; }
.page-header { margin-bottom: 24px; }
.page-sub { color: var(--text2); font-size: 13px; margin-top: 4px; }

/* Filter Card Row */
.widget-select-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
  padding: 20px 24px;
  flex-wrap: wrap;
}
.select-widget-group {
  width: 280px;
}
.filters-wrap {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 16px;
  justify-content: flex-end;
  flex-wrap: wrap;
  min-width: 320px;
}
.filter-field {
  width: 160px;
}
.refresh-btn {
  margin-bottom: 2px;
  height: 36px;
  display: flex;
  align-items: center;
  padding: 0 16px;
}

/* KPI Charts Layout */
.kpi-charts-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  width: 100%;
}
.kpi-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
}
.kpi-header {
  margin-bottom: 16px;
}
.kpi-header h4 {
  font-size: 14px;
  font-weight: 700;
  margin: 0 0 4px;
  color: var(--text);
}
.kpi-sub {
  font-size: 11px;
  color: var(--text3);
}
.flex-1 { flex: 1; min-width: 260px; }
.flex-2 { flex: 2; min-width: 480px; }

@media (max-width: 1024px) {
  .kpi-charts-row {
    flex-direction: column;
  }
  .flex-2, .flex-1 {
    width: 100%;
  }
}

/* Line Chart Styles */
.chart-container {
  height: 160px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.line-chart-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

/* Donut Chart Styles */
.donut-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 160px;
}
.donut-chart-svg {
  width: 140px;
  height: 140px;
}
.donut-value {
  font-size: 18px;
  font-weight: 800;
  font-family: monospace;
}
.donut-lbl {
  font-size: 8px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
.stat-card { display: flex; align-items: center; gap: 16px; padding: 18px 20px; }
.stat-icon { width: 46px; height: 46px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
.stat-label { font-size: 11px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: .6px; margin-bottom: 5px; }
.stat-value { font-size: 28px; font-weight: 800; line-height: 1; }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
thead th { padding: 10px 16px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; color: var(--text2); border-bottom: 1px solid var(--border); text-align: left; background: var(--bg); }
thead th.sortable { cursor: pointer; user-select: none; }
thead th.sortable:hover { color: var(--text); }
.sort-icon { color: var(--text3); margin-left: 4px; }
tbody td { padding: 12px 16px; border-bottom: 1px solid var(--border); font-size: 13px; }
tbody tr:last-child td { border-bottom: none; }
tbody tr:hover { background: rgba(255,255,255,.02); }
.pagination { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 14px; border-top: 1px solid var(--border); }
.ext-badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 500; background: rgba(31,111,235,0.08); border: 1px dashed rgba(31,111,235,0.25); color: #1f6feb; }
.spinner { width: 28px; height: 28px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin .7s linear infinite; }
.rec-link { display: inline-flex; align-items: center; justify-content: center; color: var(--accent); border-radius: 6px; padding: 4px; transition: background .15s, color .15s; }
.rec-link:hover { background: rgba(88,166,255,.15); color: #79c0ff; }

/* Call flow logs elements */
.call-flow-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
.call-flow-step {
  display: flex;
  align-items: center;
  gap: 6px;
}
.flow-arrow {
  color: var(--text3);
  font-size: 11px;
}
.flow-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  transition: transform 0.1s;
}
.flow-badge:hover {
  transform: scale(1.03);
}
.flow-status-icon {
  font-size: 10px;
}
.flow-agent-name {
  font-weight: 600;
}
.flow-agent-ext {
  opacity: 0.75;
  font-size: 10px;
}

.flow-badge-red {
  background: rgba(248, 81, 73, 0.08);
  border: 1px dashed rgba(248, 81, 73, 0.25);
  color: var(--red);
}
.flow-badge-orange {
  background: rgba(240, 136, 62, 0.08);
  border: 1px dashed rgba(240, 136, 62, 0.25);
  color: var(--orange);
}
.flow-badge-green {
  background: rgba(63, 185, 80, 0.12);
  border: 1px solid rgba(63, 185, 80, 0.25);
  color: var(--green);
}

/* Tab Navigation Bar */
.tabs-nav-bar {
  display: flex;
  padding: 6px;
  background: var(--bg2);
  border: 1px solid var(--border);
  gap: 8px;
  margin-bottom: 20px;
  border-radius: var(--radius-lg);
}
.nav-tab-btn {
  background: transparent;
  border: none;
  color: var(--text3);
  font-size: 13px;
  font-weight: 700;
  padding: 10px 18px;
  border-radius: 8px;
  cursor: pointer;
  transition: var(--transition);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.nav-tab-btn:hover {
  color: var(--text2);
  background: var(--bg3);
}
.nav-tab-btn.active {
  background: var(--bg);
  color: var(--accent);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

/* Agent performance report styles */
.agent-av-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid var(--border);
}
.agent-av-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bg3);
  color: var(--text2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
  border: 1.5px solid var(--border);
  text-transform: uppercase;
}
.perf-bar-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 140px;
  margin: 0 auto;
}
.perf-pct {
  font-size: 11px;
  font-weight: 700;
  text-align: left;
}
.perf-bar-bg {
  width: 100%;
  height: 6px;
  background: rgba(255,255,255,0.06);
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.02);
}
.perf-bar-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s ease;
}

/* Slide in animation helper */
.animate-fade-in {
  animation: fadeIn 0.3s ease-out both;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 768px) { .stats-grid { grid-template-columns: 1fr 1fr; } }

/* Inline Custom Dark Player */
.inline-player {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--bg4);
  border: 1px solid var(--border);
  padding: 4px 10px;
  border-radius: 30px;
  width: 100%;
  max-width: 220px;
}
.inline-btn {
  background: transparent;
  border: none;
  color: var(--text);
  cursor: pointer;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  transition: background 0.15s;
  padding: 0;
}
.inline-btn:hover {
  background: rgba(255,255,255,0.1);
}
.inline-timeline {
  display: flex;
  align-items: center;
  gap: 5px;
  flex: 1;
  overflow: hidden;
}
.inline-time {
  font-size: 10px;
  color: var(--text2);
  font-family: monospace;
}
.inline-slider {
  flex: 1;
  height: 3px;
  background: var(--border);
  border-radius: 1.5px;
  appearance: none;
  outline: none;
  cursor: pointer;
  min-width: 40px;
}
.inline-slider::-webkit-slider-thumb {
  appearance: none;
  width: 8px;
  height: 8px;
  background: var(--accent);
  border-radius: 50%;
  transition: transform 0.1s;
}
.inline-slider::-webkit-slider-thumb:hover {
  transform: scale(1.3);
}
</style>
