<template>
  <AppLayout>
    <div class="dr-page">

      <!-- ── Header ── -->
      <div class="dr-header">
        <div class="dr-header-left">
          <div class="dr-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="22" height="22">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
            </svg>
          </div>
          <div>
            <h1 class="dr-title">Dialer Reports</h1>
            <p class="dr-sub">Detailed outbound call analytics across your agents</p>
          </div>
        </div>
        <div class="dr-header-actions">
          <button class="btn-icon-action" @click="load" :class="{ spinning: loading }" title="Refresh">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Refresh
          </button>
          <button class="btn-csv" @click="downloadCSV" :disabled="!filteredRecords.length">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      <!-- ── Filter Bar ── -->
      <div class="dr-filter-bar">
        <div class="dr-filter-item dr-filter-dialer">
          <label class="dr-filter-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            Dialer
          </label>
          <select v-model="selectedId" class="dr-select" @change="load">
            <option value="">All Dialers</option>
            <option v-for="w in store.dialers" :key="w.id" :value="w.id">{{ w.name }}</option>
          </select>
        </div>

        <div class="dr-filter-divider"></div>

        <div class="dr-filter-item">
          <label class="dr-filter-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Date Range
          </label>
          <select v-model="dateFilter" class="dr-select">
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        <template v-if="dateFilter === 'custom'">
          <div class="dr-filter-item">
            <label class="dr-filter-label">From</label>
            <input type="date" v-model="customStartDate" class="dr-select" />
          </div>
          <div class="dr-filter-item">
            <label class="dr-filter-label">To</label>
            <input type="date" v-model="customEndDate" class="dr-select" />
          </div>
        </template>

        <div class="dr-filter-item">
          <label class="dr-filter-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Status
          </label>
          <select v-model="statusFilter" class="dr-select">
            <option value="">All Statuses</option>
            <option value="Completed">✅ Connected</option>
            <option value="Initiated">🔄 Initiated / Ringing</option>
            <option value="Failed">❌ Failed / Missed</option>
          </select>
        </div>

        <div class="dr-filter-item">
          <label class="dr-filter-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            Agent Ext
          </label>
          <input type="text" v-model="agentFilter" class="dr-select" placeholder="e.g. 750" />
        </div>
      </div>

      <!-- ── Empty / Not selected ── -->
      <div v-if="!selectedId && !report" class="dr-empty-state">
        <div class="dr-empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="36">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
          </svg>
        </div>
        <p class="dr-empty-title">Select a dialer to get started</p>
        <p class="dr-empty-sub">Choose a dialer widget above to view outbound call analytics and history</p>
      </div>

      <!-- ── Loading ── -->
      <div v-else-if="loading" class="dr-empty-state">
        <div class="dr-spinner"></div>
        <p class="dr-empty-sub">Loading report data...</p>
      </div>

      <!-- ── Report ── -->
      <div v-else-if="report" class="dr-body">

        <!-- KPI Cards -->
        <div class="dr-kpi-grid">
          <div class="dr-kpi-card dr-kpi-total">
            <div class="dr-kpi-icon-wrap dr-kpi-icon-blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
              </svg>
            </div>
            <div class="dr-kpi-meta">
              <span class="dr-kpi-label">Total Calls</span>
              <span class="dr-kpi-num dr-kpi-num-blue">{{ report.total }}</span>
            </div>
            <div class="dr-kpi-bar dr-kpi-bar-blue" :style="`width:${report.total ? 100 : 0}%`"></div>
          </div>

          <div class="dr-kpi-card dr-kpi-connected">
            <div class="dr-kpi-icon-wrap dr-kpi-icon-green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="dr-kpi-meta">
              <span class="dr-kpi-label">Connected</span>
              <span class="dr-kpi-num dr-kpi-num-green">{{ report.completed }}</span>
            </div>
            <div class="dr-kpi-bar dr-kpi-bar-green" :style="`width:${report.total ? (report.completed/report.total)*100 : 0}%`"></div>
          </div>

          <div class="dr-kpi-card dr-kpi-ringing">
            <div class="dr-kpi-icon-wrap dr-kpi-icon-orange">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="dr-kpi-meta">
              <span class="dr-kpi-label">Ringing</span>
              <span class="dr-kpi-num dr-kpi-num-orange">{{ report.initiated }}</span>
            </div>
            <div class="dr-kpi-bar dr-kpi-bar-orange" :style="`width:${report.total ? (report.initiated/report.total)*100 : 0}%`"></div>
          </div>

          <div class="dr-kpi-card dr-kpi-failed">
            <div class="dr-kpi-icon-wrap dr-kpi-icon-red">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="dr-kpi-meta">
              <span class="dr-kpi-label">Failed / Missed</span>
              <span class="dr-kpi-num dr-kpi-num-red">{{ report.failed }}</span>
            </div>
            <div class="dr-kpi-bar dr-kpi-bar-red" :style="`width:${report.total ? (report.failed/report.total)*100 : 0}%`"></div>
          </div>

          <!-- Connection rate card -->
          <div class="dr-kpi-card dr-kpi-rate">
            <div class="dr-kpi-icon-wrap dr-kpi-icon-purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
            </div>
            <div class="dr-kpi-meta">
              <span class="dr-kpi-label">Connect Rate</span>
              <span class="dr-kpi-num dr-kpi-num-purple">{{ report.total ? Math.round((report.completed/report.total)*100) : 0 }}%</span>
            </div>
            <div class="dr-rate-ring">
              <svg viewBox="0 0 36 36" width="52" height="52">
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--bg4)" stroke-width="3"/>
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#bc8cff" stroke-width="3"
                  stroke-dasharray="100" :stroke-dashoffset="report.total ? 100 - Math.round((report.completed/report.total)*100) : 100"
                  stroke-linecap="round" transform="rotate(-90 18 18)" style="transition:stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- ── Charts Grid ── -->
        <div class="dr-charts-row animate-fade-in" style="margin-bottom: 24px;">
          <!-- Chart 1: Call Volume Trend -->
          <div class="dr-chart-card card">
            <div class="dr-chart-header">
              <div class="dr-chart-header-left">
                <span class="dr-chart-icon dr-kpi-icon-blue" style="font-size: 14px;">📈</span>
                <div>
                  <h4 class="dr-chart-title">Call Volume Trend</h4>
                  <p class="dr-chart-subtitle">Total calls per hour/day</p>
                </div>
              </div>
            </div>
            <div class="dr-chart-body">
              <svg :viewBox="`0 0 ${chartData.width} ${chartData.height}`" class="dr-chart-svg">
                <defs>
                  <linearGradient id="vol-area-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.25"/>
                    <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
                  </linearGradient>
                </defs>
                <line 
                  v-for="idx in 4" :key="idx" 
                  :x1="chartData.paddingX" :y1="chartData.paddingY + (idx - 1) * ((chartData.height - 2*chartData.paddingY) / 3)" 
                  :x2="chartData.width - chartData.paddingX" :y2="chartData.paddingY + (idx - 1) * ((chartData.height - 2*chartData.paddingY) / 3)" 
                  stroke="var(--border)" stroke-width="1" stroke-dasharray="3,3"
                />
                <path v-if="chartData.volumeAreaPath" :d="chartData.volumeAreaPath" fill="url(#vol-area-gradient)"/>
                <path v-if="chartData.volumePath" :d="chartData.volumePath" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round"/>
                <g v-for="(p, idx) in chartData.volumePoints" :key="idx">
                  <circle v-if="p.count > 0" :cx="p.x" :cy="p.y" r="4" fill="var(--bg2)" stroke="var(--accent)" stroke-width="2.5"/>
                  <text v-if="p.count > 0 && chartData.volumePoints.length <= 15" :x="p.x" :y="p.y - 8" text-anchor="middle" font-size="10" font-weight="700" fill="var(--text)">
                    {{ p.count }}
                  </text>
                  <text v-if="p.showLabel" :x="p.x" :y="chartData.height - 6" text-anchor="middle" font-size="9" font-weight="500" fill="var(--text3)">
                    {{ p.label }}
                  </text>
                </g>
              </svg>
            </div>
          </div>

          <!-- Chart 2: Call Duration Trend (Total Talk Time) -->
          <div class="dr-chart-card card">
            <div class="dr-chart-header">
              <div class="dr-chart-header-left">
                <span class="dr-chart-icon dr-kpi-icon-purple" style="font-size: 14px;">⏱️</span>
                <div>
                  <h4 class="dr-chart-title">Total Talk Time (min)</h4>
                  <p class="dr-chart-subtitle">Sum of connected call durations in minutes</p>
                </div>
              </div>
            </div>
            <div class="dr-chart-body">
              <svg :viewBox="`0 0 ${chartData.width} ${chartData.height}`" class="dr-chart-svg">
                <defs>
                  <linearGradient id="dur-area-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="var(--purple)" stop-opacity="0.25"/>
                    <stop offset="100%" stop-color="var(--purple)" stop-opacity="0"/>
                  </linearGradient>
                </defs>
                <line 
                  v-for="idx in 4" :key="idx" 
                  :x1="chartData.paddingX" :y1="chartData.paddingY + (idx - 1) * ((chartData.height - 2*chartData.paddingY) / 3)" 
                  :x2="chartData.width - chartData.paddingX" :y2="chartData.paddingY + (idx - 1) * ((chartData.height - 2*chartData.paddingY) / 3)" 
                  stroke="var(--border)" stroke-width="1" stroke-dasharray="3,3"
                />
                <path v-if="chartData.durationAreaPath" :d="chartData.durationAreaPath" fill="url(#dur-area-gradient)"/>
                <path v-if="chartData.durationPath" :d="chartData.durationPath" fill="none" stroke="var(--purple)" stroke-width="2.5" stroke-linecap="round"/>
                <g v-for="(p, idx) in chartData.durationPoints" :key="idx">
                  <circle v-if="p.duration > 0" :cx="p.x" :cy="p.y" r="4" fill="var(--bg2)" stroke="var(--purple)" stroke-width="2.5"/>
                  <text v-if="p.duration > 0 && chartData.durationPoints.length <= 15" :x="p.x" :y="p.y - 8" text-anchor="middle" font-size="10" font-weight="700" fill="var(--text)">
                    {{ p.duration }}m
                  </text>
                  <text v-if="p.showLabel" :x="p.x" :y="chartData.height - 6" text-anchor="middle" font-size="9" font-weight="500" fill="var(--text3)">
                    {{ p.label }}
                  </text>
                </g>
              </svg>
            </div>
          </div>
        </div>

        <!-- Row 2: Status Breakdown and Agent metrics -->
        <div class="dr-charts-row dr-charts-row-split" style="margin-bottom: 24px;">
          <!-- Chart 3: Status Breakdown Donut -->
          <div class="dr-chart-card card">
            <div class="dr-chart-header">
              <h4 class="dr-chart-title">Call Status Breakdown</h4>
              <p class="dr-chart-subtitle">Distribution of outbound call outcomes</p>
            </div>
            <div class="dr-donut-wrapper">
              <div class="dr-donut-chart">
                <svg viewBox="0 0 100 100" class="dr-donut-svg">
                  <circle cx="50" cy="50" r="38" stroke="var(--border)" stroke-width="7" fill="transparent"/>
                  <circle 
                    v-if="chartData.statusBreakdown.total > 0"
                    cx="50" cy="50" r="38" 
                    stroke="var(--green)" stroke-width="7.5" fill="transparent"
                    stroke-dasharray="238.76"
                    :stroke-dashoffset="238.76 * (1 - chartData.statusBreakdown.completed / chartData.statusBreakdown.total)"
                    stroke-linecap="round"
                    transform="rotate(-90 50 50)"
                  />
                  <circle 
                    v-if="chartData.statusBreakdown.total > 0"
                    cx="50" cy="50" r="38" 
                    stroke="var(--red)" stroke-width="7.5" fill="transparent"
                    stroke-dasharray="238.76"
                    :stroke-dashoffset="238.76 * (1 - chartData.statusBreakdown.failed / chartData.statusBreakdown.total)"
                    stroke-linecap="round"
                    :transform="`rotate(${-90 + 360 * (chartData.statusBreakdown.completed / chartData.statusBreakdown.total)} 50 50)`"
                  />
                  <circle 
                    v-if="chartData.statusBreakdown.total > 0"
                    cx="50" cy="50" r="38" 
                    stroke="var(--orange)" stroke-width="7.5" fill="transparent"
                    stroke-dasharray="238.76"
                    :stroke-dashoffset="238.76 * (1 - chartData.statusBreakdown.initiated / chartData.statusBreakdown.total)"
                    stroke-linecap="round"
                    :transform="`rotate(${-90 + 360 * ((chartData.statusBreakdown.completed + chartData.statusBreakdown.failed) / chartData.statusBreakdown.total)} 50 50)`"
                  />
                  <text x="50" y="47" text-anchor="middle" font-size="13" font-weight="800" fill="var(--text)">
                    {{ chartData.statusBreakdown.total }}
                  </text>
                  <text x="50" y="60" text-anchor="middle" font-size="8" font-weight="600" fill="var(--text3)" style="text-transform:uppercase; letter-spacing:0.5px;">
                    Total Calls
                  </text>
                </svg>
              </div>
              <div class="dr-donut-legend">
                <div class="legend-item">
                  <span class="legend-color" style="background:var(--green)"></span>
                  <span class="legend-label">Connected</span>
                  <span class="legend-value">{{ chartData.statusBreakdown.completed }}</span>
                  <span class="legend-pct">{{ chartData.statusBreakdown.total ? Math.round((chartData.statusBreakdown.completed / chartData.statusBreakdown.total)*100) : 0 }}%</span>
                </div>
                <div class="legend-item">
                  <span class="legend-color" style="background:var(--orange)"></span>
                  <span class="legend-label">Ringing</span>
                  <span class="legend-value">{{ chartData.statusBreakdown.initiated }}</span>
                  <span class="legend-pct">{{ chartData.statusBreakdown.total ? Math.round((chartData.statusBreakdown.initiated / chartData.statusBreakdown.total)*100) : 0 }}%</span>
                </div>
                <div class="legend-item">
                  <span class="legend-color" style="background:var(--red)"></span>
                  <span class="legend-label">Failed / Missed</span>
                  <span class="legend-value">{{ chartData.statusBreakdown.failed }}</span>
                  <span class="legend-pct">{{ chartData.statusBreakdown.total ? Math.round((chartData.statusBreakdown.failed / chartData.statusBreakdown.total)*100) : 0 }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Chart 4: Agent Call Volume & Talk Time -->
          <div class="dr-chart-card card">
            <div class="dr-chart-header">
              <h4 class="dr-chart-title">Agent Call Volume & Talk Time</h4>
              <p class="dr-chart-subtitle">Top extensions by outbound attempts</p>
            </div>
            <div class="dr-agent-bars-wrapper">
              <div v-if="chartData.agentPerformance.length === 0" class="dr-empty-chart-text">
                No agent data for this period
              </div>
              <div v-else class="dr-agent-bar-list">
                <div v-for="agent in chartData.agentPerformance" :key="agent.extension" class="dr-agent-bar-row">
                  <div class="dr-agent-bar-info">
                    <span class="dr-agent-bar-name">📞 Extension {{ agent.extension }}</span>
                    <span class="dr-agent-bar-stats">
                      <strong>{{ agent.totalCalls }}</strong> call{{ agent.totalCalls !== 1 ? 's' : '' }} 
                      <span class="divider-dot">•</span> 
                      <strong>{{ agent.durationMinutes }}m</strong> talk time
                    </span>
                  </div>
                  <div class="dr-agent-bar-track-container">
                    <div class="dr-agent-bar-track" style="margin-bottom: 2px;" title="Calls Volume">
                      <div class="dr-agent-bar-fill fill-blue" :style="`width:${(agent.totalCalls / Math.max(1, ...chartData.agentPerformance.map(x => x.totalCalls))) * 100}%`"></div>
                    </div>
                    <div class="dr-agent-bar-track" title="Talk Time">
                      <div class="dr-agent-bar-fill fill-purple" :style="`width:${(agent.durationMinutes / Math.max(1, ...chartData.agentPerformance.map(x => x.durationMinutes))) * 100}%`"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Results count -->
        <div class="dr-table-header">
          <div class="dr-results-label">
            <span class="dr-results-count">{{ filteredRecords.length }}</span>
            <span class="dr-results-text">call{{ filteredRecords.length !== 1 ? 's' : '' }} found</span>
            <span v-if="filteredRecords.length !== report.records.length" class="dr-results-filtered">(filtered from {{ report.records.length }} total)</span>
          </div>
        </div>

        <!-- Table -->
        <div class="dr-table-wrap">
          <table v-if="filteredRecords.length" class="dr-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Agent</th>
                <th>Destination</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Rec</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in filteredRecords" :key="r.id" class="dr-table-row">
                <td class="dr-td-date">
                  <span class="dr-date-main">{{ formatDateMain(r.createdAt) }}</span>
                  <span class="dr-date-time">{{ formatDateTime(r.createdAt) }}</span>
                </td>
                <td>
                  <span class="dr-agent-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                    Ext {{ r.agent_extension || '—' }}
                  </span>
                </td>
                <td class="dr-td-dest">
                  <span class="dr-dest-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  </span>
                  {{ r.destination || '—' }}
                </td>
                <td>
                  <span class="dr-status-pill" :class="statusClass(r.status)">
                    <span class="dr-status-dot"></span>
                    {{ statusLabel(r.status) }}
                  </span>
                </td>
                <td class="dr-td-dur">
                  <span v-if="r.duration_seconds" class="dr-dur">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    {{ formatDuration(r.duration_seconds) }}
                  </span>
                  <span v-else class="dr-dur-empty">—</span>
                </td>
                <td>
                  <div class="recording-cell">
                    <div v-if="activeAudioRowId === r.id" class="inline-player">
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
              </tr>
            </tbody>
          </table>

          <!-- No results -->
          <div v-else class="dr-no-results">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <p>No calls match your current filters</p>
            <button class="btn-reset" @click="resetFilters">Clear Filters</button>
          </div>
        </div>
      </div>

      <audio 
        ref="audioRef" 
        :src="activeAudioUrl" 
        @play="audioPlaying = true" 
        @pause="audioPlaying = false" 
        @timeupdate="onTimeUpdate" 
        @loadedmetadata="onLoadedMetadata"
        @ended="onAudioEnded"
        style="display: none;"
      ></audio>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import axios from 'axios'
import AppLayout from '../components/AppLayout.vue'
import { useDialerStore } from '../stores'

const store = useDialerStore()
const selectedId = ref('')
const loading = ref(false)
const report = ref(null)

const dateFilter = ref('30days')
const customStartDate = ref('')
const customEndDate = ref('')
const statusFilter = ref('')
const agentFilter = ref('')

// Audio Player Refs & State
const audioRef = ref(null)
const activeAudioRowId = ref(null)
const audioPlaying = ref(false)
const audioDuration = ref(0)
const audioCurrentTime = ref(0)
const activeAudioUrl = ref('')

function playInline(r) {
  if (activeAudioRowId.value === r.id) {
    togglePlay()
    return
  }
  activeAudioRowId.value = r.id
  audioPlaying.value = false
  audioCurrentTime.value = 0
  // Pre-populate duration from database record
  audioDuration.value = r.duration_seconds || 0

  const token = localStorage.getItem('admin_token') || ''
  const apiBase = import.meta.env.VITE_API_URL || window.location.origin
  activeAudioUrl.value = `${apiBase}/api/admin/dialers/${r.dialerId || selectedId.value}/recordings/${r.recording_id}/listen?token=${encodeURIComponent(token)}`

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
  activeAudioUrl.value = ''
  audioPlaying.value = false
}

function onTimeUpdate() {
  if (audioRef.value) {
    audioCurrentTime.value = audioRef.value.currentTime
  }
}

function onLoadedMetadata() {
  if (audioRef.value && audioRef.value.duration && !isNaN(audioRef.value.duration) && audioRef.value.duration !== Infinity) {
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

onMounted(async () => {
  if (store.dialers.length === 0) {
    await store.fetch()
  }
})

watch(dateFilter, () => { if (dateFilter.value !== 'custom') load() })

async function load() {
  if (!selectedId.value) return
  loading.value = true
  try {
    const res = await axios.get(`/api/admin/dialer-widgets/${selectedId.value}/stats`)
    report.value = res.data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  dateFilter.value = '30days'
  statusFilter.value = ''
  agentFilter.value = ''
}

const filteredRecords = computed(() => {
  if (!report.value || !report.value.records) return []
  let recs = report.value.records

  if (dateFilter.value !== 'all') {
    let start = new Date(); start.setHours(0,0,0,0)
    let end = new Date(); end.setHours(23,59,59,999)
    if (dateFilter.value === '7days') start.setDate(start.getDate() - 7)
    else if (dateFilter.value === '30days') start.setDate(start.getDate() - 30)
    else if (dateFilter.value === 'custom') {
      start = customStartDate.value ? Object.assign(new Date(customStartDate.value), { _h: start.setHours(0,0,0,0) }) && new Date(customStartDate.value) : new Date(0)
      end = customEndDate.value ? Object.assign(new Date(customEndDate.value), { _h: end.setHours(23,59,59,999) }) && new Date(customEndDate.value) : end
      if (start) start.setHours(0,0,0,0)
      if (end) end.setHours(23,59,59,999)
    }
    recs = recs.filter(r => { const d = new Date(r.createdAt); return d >= start && d <= end })
  }

  if (statusFilter.value) {
    if (statusFilter.value === 'Completed') recs = recs.filter(r => ['Completed','Connected','Answered'].includes(r.status))
    else if (statusFilter.value === 'Initiated') recs = recs.filter(r => ['Initiated','Ringing'].includes(r.status))
    else if (statusFilter.value === 'Failed') recs = recs.filter(r => ['Failed','Missed','Cancelled'].includes(r.status))
  }

  if (agentFilter.value.trim()) {
    const term = agentFilter.value.trim().toLowerCase()
    recs = recs.filter(r => (r.agent_extension || '').toLowerCase().includes(term))
  }
  return recs
})

const chartData = computed(() => {
  const recs = filteredRecords.value
  if (!recs || recs.length === 0) {
    return {
      volumePoints: [],
      durationPoints: [],
      volumePath: '',
      volumeAreaPath: '',
      durationPath: '',
      durationAreaPath: '',
      statusBreakdown: { completed: 0, initiated: 0, failed: 0, total: 0 },
      agentPerformance: [],
      width: 500,
      height: 150,
      paddingX: 40,
      paddingY: 25,
      maxCount: 5,
      maxDuration: 5
    }
  }

  let intervals = []
  let groupType = 'day'
  const now = new Date()
  
  if (dateFilter.value === 'today') {
    groupType = 'hour'
    for (let h = 0; h <= 23; h += 2) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, 0, 0)
      intervals.push({
        label: `${h.toString().padStart(2, '0')}:00`,
        start: d.getTime(),
        end: d.getTime() + 2 * 60 * 60 * 1000
      })
    }
  } else if (dateFilter.value === '7days') {
    groupType = 'day'
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(now.getDate() - i)
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
      intervals.push({
        label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        start: dayStart,
        end: dayStart + 24 * 60 * 60 * 1000
      })
    }
  } else if (dateFilter.value === '30days') {
    groupType = 'day'
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(now.getDate() - i)
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
      intervals.push({
        label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        start: dayStart,
        end: dayStart + 24 * 60 * 60 * 1000,
        showLabel: i % 5 === 0
      })
    }
  } else {
    const timestamps = recs.map(r => new Date(r.createdAt).getTime())
    const minTs = Math.min(...timestamps)
    const maxTs = Math.max(...timestamps)
    const diffDays = Math.ceil((maxTs - minTs) / (24 * 60 * 60 * 1000))
    
    if (diffDays <= 1) {
      groupType = 'hour'
      const startDay = new Date(minTs)
      for (let h = 0; h <= 23; h += 2) {
        const d = new Date(startDay.getFullYear(), startDay.getMonth(), startDay.getDate(), h, 0, 0)
        intervals.push({
          label: `${h.toString().padStart(2, '0')}:00`,
          start: d.getTime(),
          end: d.getTime() + 2 * 60 * 60 * 1000
        })
      }
    } else {
      groupType = 'day'
      const startDay = new Date(minTs)
      startDay.setHours(0,0,0,0)
      const endDay = new Date(maxTs)
      endDay.setHours(23,59,59,999)
      
      const numDays = Math.ceil((endDay.getTime() - startDay.getTime()) / (24 * 60 * 60 * 1000))
      const labelInterval = numDays <= 7 ? 1 : numDays <= 30 ? 5 : Math.ceil(numDays / 7)
      
      for (let i = 0; i < numDays; i++) {
        const d = new Date(startDay.getTime() + i * 24 * 60 * 60 * 1000)
        const dayStart = d.getTime()
        intervals.push({
          label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          start: dayStart,
          end: dayStart + 24 * 60 * 60 * 1000,
          showLabel: i % labelInterval === 0
        })
      }
    }
  }

  const data = intervals.map(interval => {
    const periodRecs = recs.filter(r => {
      const ts = new Date(r.createdAt).getTime()
      return ts >= interval.start && ts < interval.end
    })
    const count = periodRecs.length
    const totalDurationSeconds = periodRecs.reduce((acc, r) => acc + (r.duration_seconds || 0), 0)
    const durationMinutes = Math.round((totalDurationSeconds / 60) * 10) / 10
    return {
      label: interval.label,
      showLabel: interval.showLabel !== false,
      count,
      duration: durationMinutes
    }
  })

  const width = 500
  const height = 150
  const paddingX = 40
  const paddingY = 25
  const maxCount = Math.max(5, ...data.map(x => x.count))
  const maxDuration = Math.max(5, ...data.map(x => x.duration))
  
  const volumePoints = data.map((item, idx) => {
    const x = paddingX + (idx / (data.length - 1 || 1)) * (width - 2 * paddingX)
    const y = height - paddingY - (item.count / maxCount) * (height - 2 * paddingY - 10)
    return { x, y, count: item.count, label: item.label, showLabel: item.showLabel }
  })
  const durationPoints = data.map((item, idx) => {
    const x = paddingX + (idx / (data.length - 1 || 1)) * (width - 2 * paddingX)
    const y = height - paddingY - (item.duration / maxDuration) * (height - 2 * paddingY - 10)
    return { x, y, duration: item.duration, label: item.label, showLabel: item.showLabel }
  })
  
  const getPaths = (pts) => {
    let linePath = ''
    let areaPath = ''
    if (pts.length > 0) {
      linePath = `M ${pts[0].x} ${pts[0].y}`
      for (let i = 1; i < pts.length; i++) {
        linePath += ` L ${pts[i].x} ${pts[i].y}`
      }
      areaPath = `${linePath} L ${pts[pts.length - 1].x} ${height - paddingY} L ${pts[0].x} ${height - paddingY} Z`
    }
    return { linePath, areaPath }
  }
  
  const volPaths = getPaths(volumePoints)
  const durPaths = getPaths(durationPoints)
  
  let completed = 0
  let initiated = 0
  let failed = 0
  recs.forEach(r => {
    const lower = (r.status || '').toLowerCase()
    if (['completed', 'connected', 'answered'].includes(lower)) completed++
    else if (['initiated', 'ringing'].includes(lower)) initiated++
    else if (['failed', 'missed', 'cancelled'].includes(lower)) failed++
  })
  
  const agentMap = {}
  recs.forEach(r => {
    const ext = r.agent_extension || '—'
    if (!agentMap[ext]) {
      agentMap[ext] = { extension: ext, totalCalls: 0, connectedCalls: 0, totalDuration: 0 }
    }
    agentMap[ext].totalCalls++
    const lower = (r.status || '').toLowerCase()
    if (['completed', 'connected', 'answered'].includes(lower)) {
      agentMap[ext].connectedCalls++
      agentMap[ext].totalDuration += (r.duration_seconds || 0)
    }
  })
  
  const agentPerformance = Object.values(agentMap)
    .map(a => ({
      ...a,
      durationMinutes: Math.round((a.totalDuration / 60) * 10) / 10,
      connectRate: a.totalCalls ? Math.round((a.connectedCalls / a.totalCalls) * 100) : 0
    }))
    .sort((a, b) => b.totalCalls - a.totalCalls)
    .slice(0, 5)

  return {
    volumePoints,
    durationPoints,
    volumePath: volPaths.linePath,
    volumeAreaPath: volPaths.areaPath,
    durationPath: durPaths.linePath,
    durationAreaPath: durPaths.areaPath,
    statusBreakdown: { completed, initiated, failed, total: recs.length },
    agentPerformance,
    width,
    height,
    paddingX,
    paddingY,
    maxCount,
    maxDuration
  }
})

function statusClass(s) {
  if (!s) return 'pill-neutral'
  const lower = s.toLowerCase()
  if (['completed','connected','answered'].includes(lower)) return 'pill-green'
  if (['failed','missed','cancelled'].includes(lower)) return 'pill-red'
  return 'pill-orange'
}

function statusLabel(s) {
  if (!s) return 'Unknown'
  const lower = s.toLowerCase()
  if (['completed','connected','answered'].includes(lower)) return 'Connected'
  if (['failed','missed','cancelled'].includes(lower)) return 'Failed'
  if (['initiated','ringing'].includes(lower)) return 'Ringing'
  return s
}

function formatDateMain(ds) {
  if (!ds) return '-'
  return new Date(ds).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function formatDateTime(ds) {
  if (!ds) return ''
  return new Date(ds).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDuration(sec) {
  if (!sec) return ''
  const m = Math.floor(sec / 60)
  const s = sec % 60
  if (m === 0) return `${s}s`
  return `${m}m ${s}s`
}

function downloadCSV() {
  const rows = [['Date', 'Time', 'Agent Ext', 'Destination', 'Status', 'Duration (s)']]
  filteredRecords.value.forEach(r => {
    rows.push([
      formatDateMain(r.createdAt),
      formatDateTime(r.createdAt),
      r.agent_extension || '',
      r.destination || '',
      r.status || '',
      r.duration_seconds || '0'
    ])
  })
  const csv = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n")
  const link = document.createElement("a")
  link.setAttribute("href", encodeURI(csv))
  link.setAttribute("download", `Dialer_Report_${new Date().toISOString().slice(0,10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<style scoped>
/* ─── Page ─── */
.dr-page {
  padding: 28px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 100%;
}

/* ─── Header ─── */
.dr-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.dr-header-left { display: flex; align-items: center; gap: 16px; }
.dr-header-icon {
  width: 46px; height: 46px;
  background: linear-gradient(135deg, rgba(88,166,255,.18) 0%, rgba(188,140,255,.12) 100%);
  border: 1px solid rgba(88,166,255,.25);
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  color: var(--accent);
  flex-shrink: 0;
}
.dr-title { font-size: 22px; font-weight: 800; color: var(--text); line-height: 1.1; }
.dr-sub { font-size: 13px; color: var(--text2); margin-top: 3px; }

.dr-header-actions { display: flex; gap: 10px; align-items: center; }

.btn-icon-action {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 8px 16px;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text2);
  font-size: 13px; font-weight: 600;
  cursor: pointer;
  transition: all .2s;
}
.btn-icon-action:hover { color: var(--text); border-color: var(--accent); background: var(--bg3); }
.btn-icon-action.spinning svg { animation: spin 0.8s linear infinite; }

@keyframes spin { to { transform: rotate(360deg); } }

.btn-csv {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 8px 18px;
  background: linear-gradient(135deg, #1f6feb, #388bfd);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 13px; font-weight: 600;
  cursor: pointer;
  transition: all .2s;
  box-shadow: 0 4px 12px rgba(56,139,253,.3);
}
.btn-csv:hover:not(:disabled) { box-shadow: 0 6px 20px rgba(56,139,253,.5); transform: translateY(-1px); }
.btn-csv:disabled { opacity: .45; cursor: not-allowed; transform: none; box-shadow: none; }

/* ─── Filter Bar ─── */
.dr-filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  align-items: center;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px 20px;
  gap: 12px;
}
.dr-filter-divider {
  width: 1px;
  height: 28px;
  background: var(--border);
  flex-shrink: 0;
}
.dr-filter-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 130px;
}
.dr-filter-dialer { min-width: 180px; }
.dr-filter-label {
  display: flex; align-items: center; gap: 4px;
  font-size: 10px; font-weight: 700;
  color: var(--text3);
  text-transform: uppercase;
  letter-spacing: 0.6px;
}
.dr-select {
  background: transparent;
  border: none;
  border-bottom: 1.5px solid var(--border);
  color: var(--text);
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  padding: 3px 4px;
  outline: none;
  cursor: pointer;
  transition: border-color .2s;
  width: 100%;
}
.dr-select:focus { border-bottom-color: var(--accent); }

select.dr-select {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23848d97' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 4px center;
  background-size: 12px;
  padding-right: 20px;
}

select.dr-select option {
  background-color: var(--bg2);
  color: var(--text);
}

/* ─── Empty / Loading ─── */
.dr-empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 14px;
  padding: 80px 20px;
  text-align: center;
}
.dr-empty-icon {
  width: 72px; height: 72px;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 20px;
  display: flex; align-items: center; justify-content: center;
  color: var(--text3);
}
.dr-empty-title { font-size: 16px; font-weight: 700; color: var(--text); }
.dr-empty-sub { font-size: 13px; color: var(--text2); max-width: 320px; }

.dr-spinner {
  width: 32px; height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin .7s linear infinite;
}

/* ─── KPI Grid ─── */
.dr-kpi-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}
@media (max-width: 1100px) { .dr-kpi-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 700px) { .dr-kpi-grid { grid-template-columns: 1fr 1fr; } }

.dr-kpi-card {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  overflow: hidden;
  transition: border-color .2s, box-shadow .2s;
}
.dr-kpi-card:hover { border-color: var(--bg4); box-shadow: 0 4px 20px rgba(0,0,0,.2); }

.dr-kpi-icon-wrap {
  width: 36px; height: 36px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.dr-kpi-icon-blue   { background: rgba(88,166,255,.12);  color: var(--accent); }
.dr-kpi-icon-green  { background: rgba(63,185,80,.12);   color: var(--green); }
.dr-kpi-icon-orange { background: rgba(240,136,62,.12);  color: var(--orange); }
.dr-kpi-icon-red    { background: rgba(248,81,73,.12);   color: var(--red); }
.dr-kpi-icon-purple { background: rgba(188,140,255,.12); color: var(--purple); }

.dr-kpi-meta { display: flex; flex-direction: column; gap: 2px; }
.dr-kpi-label {
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .6px;
  color: var(--text3);
}
.dr-kpi-num {
  font-size: 30px; font-weight: 800; line-height: 1.1;
}
.dr-kpi-num-blue   { color: var(--accent); }
.dr-kpi-num-green  { color: var(--green); }
.dr-kpi-num-orange { color: var(--orange); }
.dr-kpi-num-red    { color: var(--red); }
.dr-kpi-num-purple { color: var(--purple); }

.dr-kpi-bar {
  position: absolute;
  bottom: 0; left: 0;
  height: 3px;
  border-radius: 0 3px 3px 0;
  transition: width 0.8s cubic-bezier(0.16,1,0.3,1);
}
.dr-kpi-bar-blue   { background: var(--accent); }
.dr-kpi-bar-green  { background: var(--green); }
.dr-kpi-bar-orange { background: var(--orange); }
.dr-kpi-bar-red    { background: var(--red); }

/* Rate card */
.dr-kpi-rate { flex-direction: row; align-items: center; justify-content: space-between; }
.dr-rate-ring { flex-shrink: 0; opacity: .85; }

/* ─── Table header ─── */
.dr-table-header {
  display: flex; align-items: center; justify-content: space-between;
}
.dr-results-label { display: flex; align-items: center; gap: 6px; }
.dr-results-count {
  font-size: 22px; font-weight: 800; color: var(--text);
}
.dr-results-text { font-size: 13px; color: var(--text2); font-weight: 500; }
.dr-results-filtered { font-size: 12px; color: var(--text3); }

/* ─── Table ─── */
.dr-table-wrap {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
}
.dr-table {
  width: 100%;
  border-collapse: collapse;
}
.dr-table thead tr {
  background: var(--bg3);
}
.dr-table thead th {
  padding: 12px 18px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  color: var(--text3);
  text-transform: uppercase;
  letter-spacing: .6px;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}
.dr-table-row {
  transition: background .15s;
  border-bottom: 1px solid var(--border);
}
.dr-table-row:last-child { border-bottom: none; }
.dr-table-row:hover { background: var(--bg3); }
.dr-table-row td {
  padding: 13px 18px;
  font-size: 13px;
  color: var(--text);
  vertical-align: middle;
}

.dr-td-date { display: flex; flex-direction: column; gap: 1px; }
.dr-date-main { font-weight: 600; font-size: 13px; }
.dr-date-time { font-size: 11px; color: var(--text3); }

.dr-agent-badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 10px;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 20px;
  font-size: 12px; font-weight: 600;
  color: var(--text2);
}

.dr-td-dest { display: flex; align-items: center; gap: 7px; font-family: monospace; font-size: 13px; letter-spacing: 0.3px; }
.dr-dest-icon { color: var(--text3); flex-shrink: 0; }

.dr-status-pill {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px; font-weight: 600;
}
.dr-status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

.pill-green { background: rgba(63,185,80,.12); color: var(--green); border: 1px solid rgba(63,185,80,.2); }
.pill-green .dr-status-dot { background: var(--green); box-shadow: 0 0 0 2px rgba(63,185,80,.25); }

.pill-red { background: rgba(248,81,73,.1); color: var(--red); border: 1px solid rgba(248,81,73,.2); }
.pill-red .dr-status-dot { background: var(--red); }

.pill-orange { background: rgba(240,136,62,.1); color: var(--orange); border: 1px solid rgba(240,136,62,.2); }
.pill-orange .dr-status-dot { background: var(--orange); }

.pill-neutral { background: var(--bg3); color: var(--text2); border: 1px solid var(--border); }
.pill-neutral .dr-status-dot { background: var(--text3); }

.dr-dur {
  display: inline-flex; align-items: center; gap: 5px;
  font-variant-numeric: tabular-nums;
  color: var(--text2); font-size: 12px;
}
.dr-dur-empty { color: var(--text3); }

/* ─── No results ─── */
.dr-no-results {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; padding: 60px 20px; text-align: center;
  color: var(--text3);
}
.dr-no-results p { font-size: 13px; color: var(--text2); }
.btn-reset {
  padding: 6px 16px;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text2);
  font-size: 12px; font-weight: 600;
  cursor: pointer;
  transition: all .2s;
}
.btn-reset:hover { color: var(--text); border-color: var(--accent); }

/* Recording and Player Styles */
.recording-cell {
  display: flex;
  align-items: center;
  min-height: 32px;
}
.rec-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  border-radius: 6px;
  padding: 6px;
  transition: background .15s, color .15s;
}
.rec-link:hover {
  background: rgba(88,166,255,.15);
  color: #79c0ff;
}
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

/* ─── Charts Row ─── */
.dr-charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.dr-charts-row-split {
  grid-template-columns: 1fr 1.3fr;
}
@media (max-width: 950px) {
  .dr-charts-row, .dr-charts-row-split {
    grid-template-columns: 1fr;
  }
}

.dr-chart-card {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: border-color .2s, box-shadow .2s;
}
.dr-chart-card:hover {
  border-color: var(--bg4);
  box-shadow: 0 4px 20px rgba(0,0,0,.2);
}

.dr-chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.dr-chart-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.dr-chart-icon {
  font-size: 16px;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dr-chart-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
}
.dr-chart-subtitle {
  font-size: 11px;
  color: var(--text3);
}

.dr-chart-body {
  position: relative;
  width: 100%;
}
.dr-chart-svg {
  width: 100%;
  height: auto;
  display: block;
}

/* Donut Chart styles */
.dr-donut-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 16px;
  flex: 1;
}
@media (max-width: 500px) {
  .dr-donut-wrapper {
    flex-direction: column;
    text-align: center;
  }
}
.dr-donut-chart {
  width: 120px;
  height: 120px;
  position: relative;
  flex-shrink: 0;
}
.dr-donut-svg {
  width: 100%;
  height: 100%;
}
.dr-donut-legend {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}
.legend-item {
  display: grid;
  grid-template-columns: 12px 1fr auto auto;
  align-items: center;
  gap: 12px;
  font-size: 12px;
}
.legend-color {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.legend-label {
  color: var(--text2);
  font-weight: 500;
}
.legend-value {
  color: var(--text);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.legend-pct {
  color: var(--text3);
  font-size: 11px;
  font-weight: 600;
  text-align: right;
  min-width: 32px;
}

/* Agent Horizontal Bar chart styles */
.dr-agent-bars-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: center;
}
.dr-agent-bar-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.dr-agent-bar-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.dr-agent-bar-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}
.dr-agent-bar-name {
  color: var(--text);
  font-weight: 600;
}
.dr-agent-bar-stats {
  color: var(--text2);
  font-size: 11px;
}
.divider-dot {
  color: var(--text3);
  margin: 0 4px;
}
.dr-agent-bar-track-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: rgba(0,0,0,0.15);
  border-radius: 6px;
  padding: 6px 8px;
  border: 1px solid var(--border);
}
.dr-agent-bar-track {
  height: 5px;
  background: var(--bg3);
  border-radius: 3px;
  overflow: hidden;
  width: 100%;
}
.dr-agent-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.fill-blue {
  background: linear-gradient(90deg, #1f6feb, var(--accent));
}
.fill-purple {
  background: linear-gradient(90deg, #8250df, var(--purple));
}
.dr-empty-chart-text {
  text-align: center;
  color: var(--text3);
  font-size: 13px;
  padding: 30px 0;
}
</style>
