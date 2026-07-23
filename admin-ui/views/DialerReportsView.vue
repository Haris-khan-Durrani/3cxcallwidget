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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Status
          </label>
          <select v-model="statusFilter" class="dr-select">
            <option value="">All Statuses</option>
            <option value="Completed">Connected</option>
            <option value="Initiated">Ringing</option>
            <option value="Failed">Failed / Missed</option>
          </select>
        </div>

        <div class="dr-filter-item">
          <label class="dr-filter-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            Agent Ext
          </label>
          <input type="text" v-model="agentFilter" class="dr-select" placeholder="e.g. 750" />
        </div>

        <button v-if="statusFilter || agentFilter || dateFilter !== '30days'" class="dr-clear-btn" @click="resetFilters" title="Clear filters">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          Clear
        </button>
      </div>

      <!-- ── Empty / Not selected ── -->
      <div v-if="!selectedId && !report" class="dr-empty-state">
        <div class="dr-empty-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32">
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

        <!-- KPI Cards Row -->
        <div class="dr-kpi-grid">

          <!-- Total Calls -->
          <div class="dr-kpi-card">
            <div class="dr-kpi-top">
              <div class="dr-kpi-icon-wrap" style="background:rgba(88,166,255,.12);color:var(--accent);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              </div>
              <span class="dr-kpi-badge" style="background:rgba(88,166,255,.1);color:var(--accent);">Total</span>
            </div>
            <div class="dr-kpi-num" style="color:var(--text);">{{ filteredRecords.length }}</div>
            <div class="dr-kpi-label">Total Calls</div>
            <div class="dr-kpi-sparkline">
              <svg viewBox="0 0 80 28" class="sparkline-svg" preserveAspectRatio="none">
                <polyline :points="sparklinePoints('total')" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="dr-kpi-bottom-bar" style="background:var(--accent);" :style="`width:100%`"></div>
          </div>

          <!-- Connected -->
          <div class="dr-kpi-card">
            <div class="dr-kpi-top">
              <div class="dr-kpi-icon-wrap" style="background:rgba(63,185,80,.12);color:var(--green);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <span class="dr-kpi-badge" style="background:rgba(63,185,80,.1);color:var(--green);">
                {{ filteredRecords.length ? Math.round((kpiStats.connected/filteredRecords.length)*100) : 0 }}%
              </span>
            </div>
            <div class="dr-kpi-num" style="color:var(--green);">{{ kpiStats.connected }}</div>
            <div class="dr-kpi-label">Connected</div>
            <div class="dr-kpi-sparkline">
              <svg viewBox="0 0 80 28" class="sparkline-svg" preserveAspectRatio="none">
                <polyline :points="sparklinePoints('connected')" fill="none" stroke="var(--green)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="dr-kpi-bottom-bar" style="background:var(--green);" :style="`width:${filteredRecords.length ? (kpiStats.connected/filteredRecords.length)*100 : 0}%`"></div>
          </div>

          <!-- Failed -->
          <div class="dr-kpi-card">
            <div class="dr-kpi-top">
              <div class="dr-kpi-icon-wrap" style="background:rgba(248,81,73,.12);color:var(--red);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <span class="dr-kpi-badge" style="background:rgba(248,81,73,.1);color:var(--red);">
                {{ filteredRecords.length ? Math.round((kpiStats.failed/filteredRecords.length)*100) : 0 }}%
              </span>
            </div>
            <div class="dr-kpi-num" style="color:var(--red);">{{ kpiStats.failed }}</div>
            <div class="dr-kpi-label">Failed / Missed</div>
            <div class="dr-kpi-sparkline">
              <svg viewBox="0 0 80 28" class="sparkline-svg" preserveAspectRatio="none">
                <polyline :points="sparklinePoints('failed')" fill="none" stroke="var(--red)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="dr-kpi-bottom-bar" style="background:var(--red);" :style="`width:${filteredRecords.length ? (kpiStats.failed/filteredRecords.length)*100 : 0}%`"></div>
          </div>

          <!-- Avg Duration -->
          <div class="dr-kpi-card">
            <div class="dr-kpi-top">
              <div class="dr-kpi-icon-wrap" style="background:rgba(240,136,62,.12);color:var(--orange);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <span class="dr-kpi-badge" style="background:rgba(240,136,62,.1);color:var(--orange);">Avg</span>
            </div>
            <div class="dr-kpi-num" style="color:var(--orange);">{{ formatDuration(kpiStats.avgDuration) || '—' }}</div>
            <div class="dr-kpi-label">Avg Call Duration</div>
            <div class="dr-kpi-sparkline">
              <svg viewBox="0 0 80 28" class="sparkline-svg" preserveAspectRatio="none">
                <polyline :points="sparklinePoints('duration')" fill="none" stroke="var(--orange)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="dr-kpi-bottom-bar" style="background:var(--orange);width:60%;"></div>
          </div>

          <!-- Total Talk Time -->
          <div class="dr-kpi-card">
            <div class="dr-kpi-top">
              <div class="dr-kpi-icon-wrap" style="background:rgba(188,140,255,.12);color:var(--purple);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
              </div>
              <span class="dr-kpi-badge" style="background:rgba(188,140,255,.1);color:var(--purple);">Total</span>
            </div>
            <div class="dr-kpi-num" style="color:var(--purple);">{{ formatTotalTime(kpiStats.totalDuration) }}</div>
            <div class="dr-kpi-label">Total Talk Time</div>
            <div class="dr-kpi-sparkline">
              <svg viewBox="0 0 80 28" class="sparkline-svg" preserveAspectRatio="none">
                <polyline :points="sparklinePoints('totaltime')" fill="none" stroke="var(--purple)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="dr-kpi-bottom-bar" style="background:var(--purple);width:100%;"></div>
          </div>

          <!-- Connect Rate Donut -->
          <div class="dr-kpi-card dr-kpi-rate-card">
            <div class="dr-kpi-rate-left">
              <div class="dr-kpi-top">
                <div class="dr-kpi-icon-wrap" style="background:rgba(188,140,255,.12);color:var(--purple);">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                </div>
              </div>
              <div class="dr-kpi-num" style="color:var(--purple);">{{ connectRate }}%</div>
              <div class="dr-kpi-label">Connect Rate</div>
            </div>
            <div class="dr-rate-donut">
              <svg viewBox="0 0 36 36" width="64" height="64">
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--bg4)" stroke-width="3.5"/>
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--purple)" stroke-width="3.5"
                  stroke-dasharray="100" :stroke-dashoffset="100 - connectRate"
                  stroke-linecap="round" transform="rotate(-90 18 18)" style="transition:stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)"/>
                <text x="18" y="20.5" text-anchor="middle" font-size="7" font-weight="800" fill="var(--purple)">{{ connectRate }}%</text>
              </svg>
            </div>
          </div>

        </div>

        <!-- Charts Row 1: Volume + Duration -->
        <div class="dr-charts-row">
          <!-- Call Volume Trend -->
          <div class="dr-chart-card">
            <div class="dr-chart-hd">
              <div>
                <div class="dr-chart-title">
                  <span class="dr-chart-title-dot" style="background:var(--accent);"></span>
                  Call Volume Trend
                </div>
                <div class="dr-chart-sub">Outbound calls over time</div>
              </div>
              <div class="dr-chart-legend-pill" style="background:rgba(88,166,255,.1);color:var(--accent);">
                {{ filteredRecords.length }} total
              </div>
            </div>
            <div class="dr-chart-body">
              <svg :viewBox="`0 0 ${cd.w} ${cd.h}`" class="dr-chart-svg" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="vol-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#58a6ff" stop-opacity="0.2"/>
                    <stop offset="100%" stop-color="#58a6ff" stop-opacity="0.01"/>
                  </linearGradient>
                </defs>
                <!-- Y-axis gridlines -->
                <line v-for="i in 5" :key="i"
                  :x1="cd.px" :y1="cd.py + (i-1)*((cd.h-2*cd.py)/4)"
                  :x2="cd.w-8" :y2="cd.py + (i-1)*((cd.h-2*cd.py)/4)"
                  stroke="var(--border)" stroke-width="0.5" stroke-dasharray="3,4"/>
                <!-- Area Fill -->
                <path v-if="cd.volAreaPath" :d="cd.volAreaPath" fill="url(#vol-grad)"/>
                <!-- Line -->
                <path v-if="cd.volPath" :d="cd.volPath" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <!-- Dots + Labels -->
                <g v-for="(p,i) in cd.volPts" :key="i">
                  <circle v-if="p.v > 0" :cx="p.x" :cy="p.y" r="3.5" fill="var(--bg2)" stroke="var(--accent)" stroke-width="2"/>
                  <text v-if="p.v > 0" :x="p.x" :y="Math.max(14, p.y - 7)" text-anchor="middle" font-size="9" font-weight="700" fill="var(--accent)">{{ p.v }}</text>
                  <text v-if="p.lbl" :x="p.x" :y="cd.h - 3" text-anchor="middle" font-size="8.5" fill="var(--text3)">{{ p.lbl }}</text>
                </g>
              </svg>
            </div>
          </div>

          <!-- Total Talk Time Trend -->
          <div class="dr-chart-card">
            <div class="dr-chart-hd">
              <div>
                <div class="dr-chart-title">
                  <span class="dr-chart-title-dot" style="background:var(--purple);"></span>
                  Total Talk Time
                </div>
                <div class="dr-chart-sub">Connected call minutes per period</div>
              </div>
              <div class="dr-chart-legend-pill" style="background:rgba(188,140,255,.1);color:var(--purple);">
                {{ formatTotalTime(kpiStats.totalDuration) }}
              </div>
            </div>
            <div class="dr-chart-body">
              <svg :viewBox="`0 0 ${cd.w} ${cd.h}`" class="dr-chart-svg" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="dur-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#bc8cff" stop-opacity="0.2"/>
                    <stop offset="100%" stop-color="#bc8cff" stop-opacity="0.01"/>
                  </linearGradient>
                </defs>
                <line v-for="i in 5" :key="i"
                  :x1="cd.px" :y1="cd.py + (i-1)*((cd.h-2*cd.py)/4)"
                  :x2="cd.w-8" :y2="cd.py + (i-1)*((cd.h-2*cd.py)/4)"
                  stroke="var(--border)" stroke-width="0.5" stroke-dasharray="3,4"/>
                <path v-if="cd.durAreaPath" :d="cd.durAreaPath" fill="url(#dur-grad)"/>
                <path v-if="cd.durPath" :d="cd.durPath" fill="none" stroke="var(--purple)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <g v-for="(p,i) in cd.durPts" :key="i">
                  <circle v-if="p.v > 0" :cx="p.x" :cy="p.y" r="3.5" fill="var(--bg2)" stroke="var(--purple)" stroke-width="2"/>
                  <text v-if="p.v > 0" :x="p.x" :y="Math.max(14, p.y - 7)" text-anchor="middle" font-size="9" font-weight="700" fill="var(--purple)">{{ p.v }}m</text>
                  <text v-if="p.lbl" :x="p.x" :y="cd.h - 3" text-anchor="middle" font-size="8.5" fill="var(--text3)">{{ p.lbl }}</text>
                </g>
              </svg>
            </div>
          </div>
        </div>

        <!-- Charts Row 2: Donut + Agent Bars -->
        <div class="dr-charts-row dr-charts-row-b">
          <!-- Status Breakdown Donut -->
          <div class="dr-chart-card">
            <div class="dr-chart-hd">
              <div>
                <div class="dr-chart-title">
                  <span class="dr-chart-title-dot" style="background:var(--green);"></span>
                  Call Outcome Breakdown
                </div>
                <div class="dr-chart-sub">Distribution of outbound call results</div>
              </div>
            </div>
            <div class="dr-donut-row">
              <div class="dr-donut-wrap">
                <svg viewBox="0 0 100 100" class="dr-donut-svg">
                  <circle cx="50" cy="50" r="36" stroke="var(--bg4)" stroke-width="8" fill="transparent"/>
                  <!-- Connected arc -->
                  <circle v-if="cd.sb.total > 0" cx="50" cy="50" r="36"
                    stroke="var(--green)" stroke-width="8.5" fill="transparent"
                    stroke-dasharray="226.19"
                    :stroke-dashoffset="226.19 * (1 - cd.sb.connected/cd.sb.total)"
                    stroke-linecap="butt" transform="rotate(-90 50 50)"
                    style="transition:stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)"/>
                  <!-- Failed arc -->
                  <circle v-if="cd.sb.total > 0" cx="50" cy="50" r="36"
                    stroke="var(--red)" stroke-width="8.5" fill="transparent"
                    stroke-dasharray="226.19"
                    :stroke-dashoffset="226.19 * (1 - cd.sb.failed/cd.sb.total)"
                    stroke-linecap="butt"
                    :transform="`rotate(${-90 + 360*(cd.sb.connected/cd.sb.total)} 50 50)`"
                    style="transition:stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)"/>
                  <!-- Ringing arc -->
                  <circle v-if="cd.sb.total > 0" cx="50" cy="50" r="36"
                    stroke="var(--orange)" stroke-width="8.5" fill="transparent"
                    stroke-dasharray="226.19"
                    :stroke-dashoffset="226.19 * (1 - cd.sb.ringing/cd.sb.total)"
                    stroke-linecap="butt"
                    :transform="`rotate(${-90 + 360*((cd.sb.connected+cd.sb.failed)/cd.sb.total)} 50 50)`"
                    style="transition:stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)"/>
                  <!-- Center labels -->
                  <text x="50" y="46" text-anchor="middle" font-size="14" font-weight="800" fill="var(--text)">{{ cd.sb.total }}</text>
                  <text x="50" y="58" text-anchor="middle" font-size="7.5" fill="var(--text3)" font-weight="600" letter-spacing="0.5">CALLS</text>
                </svg>
              </div>
              <div class="dr-donut-legend">
                <div class="dr-legend-row">
                  <span class="dr-legend-dot" style="background:var(--green);box-shadow:0 0 6px rgba(63,185,80,.5);"></span>
                  <span class="dr-legend-name">Connected</span>
                  <span class="dr-legend-val">{{ cd.sb.connected }}</span>
                  <div class="dr-legend-bar-wrap">
                    <div class="dr-legend-bar" style="background:var(--green);" :style="`width:${cd.sb.total ? (cd.sb.connected/cd.sb.total)*100 : 0}%`"></div>
                  </div>
                  <span class="dr-legend-pct" style="color:var(--green);">{{ cd.sb.total ? Math.round((cd.sb.connected/cd.sb.total)*100) : 0 }}%</span>
                </div>
                <div class="dr-legend-row">
                  <span class="dr-legend-dot" style="background:var(--red);box-shadow:0 0 6px rgba(248,81,73,.5);"></span>
                  <span class="dr-legend-name">Failed / Missed</span>
                  <span class="dr-legend-val">{{ cd.sb.failed }}</span>
                  <div class="dr-legend-bar-wrap">
                    <div class="dr-legend-bar" style="background:var(--red);" :style="`width:${cd.sb.total ? (cd.sb.failed/cd.sb.total)*100 : 0}%`"></div>
                  </div>
                  <span class="dr-legend-pct" style="color:var(--red);">{{ cd.sb.total ? Math.round((cd.sb.failed/cd.sb.total)*100) : 0 }}%</span>
                </div>
                <div class="dr-legend-row">
                  <span class="dr-legend-dot" style="background:var(--orange);box-shadow:0 0 6px rgba(240,136,62,.5);"></span>
                  <span class="dr-legend-name">Ringing</span>
                  <span class="dr-legend-val">{{ cd.sb.ringing }}</span>
                  <div class="dr-legend-bar-wrap">
                    <div class="dr-legend-bar" style="background:var(--orange);" :style="`width:${cd.sb.total ? (cd.sb.ringing/cd.sb.total)*100 : 0}%`"></div>
                  </div>
                  <span class="dr-legend-pct" style="color:var(--orange);">{{ cd.sb.total ? Math.round((cd.sb.ringing/cd.sb.total)*100) : 0 }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Agent Performance -->
          <div class="dr-chart-card">
            <div class="dr-chart-hd">
              <div>
                <div class="dr-chart-title">
                  <span class="dr-chart-title-dot" style="background:var(--accent);"></span>
                  Agent Performance
                </div>
                <div class="dr-chart-sub">Top agents by call volume &amp; talk time</div>
              </div>
              <div class="dr-legend-chips">
                <span class="dr-chip" style="background:rgba(88,166,255,.1);color:var(--accent);">
                  <span style="width:6px;height:6px;border-radius:50%;background:var(--accent);display:inline-block;"></span> Calls
                </span>
                <span class="dr-chip" style="background:rgba(188,140,255,.1);color:var(--purple);">
                  <span style="width:6px;height:6px;border-radius:50%;background:var(--purple);display:inline-block;"></span> Talk Time
                </span>
              </div>
            </div>
            <div class="dr-agent-body">
              <div v-if="cd.agents.length === 0" class="dr-no-agent-data">No agent data available for this period</div>
              <div v-else>
                <div v-for="ag in cd.agents" :key="ag.ext" class="dr-agent-row">
                  <div class="dr-agent-row-header">
                    <div class="dr-agent-avatar">{{ ag.ext.toString().slice(-2) }}</div>
                    <div class="dr-agent-info">
                      <span class="dr-agent-ext">Ext {{ ag.ext }}</span>
                      <span class="dr-agent-rate" :style="ag.rate >= 80 ? 'color:var(--green)' : ag.rate >= 50 ? 'color:var(--orange)' : 'color:var(--red)'">
                        {{ ag.rate }}% connected
                      </span>
                    </div>
                    <div class="dr-agent-nums">
                      <span class="dr-agent-call-count">{{ ag.calls }}</span>
                      <span class="dr-agent-time">{{ ag.mins }}m</span>
                    </div>
                  </div>
                  <div class="dr-agent-bars">
                    <div class="dr-agent-bar-track">
                      <div class="dr-agent-bar-fill" style="background:linear-gradient(90deg,#1f6feb,var(--accent));"
                        :style="`width:${(ag.calls/Math.max(1,...cd.agents.map(x=>x.calls)))*100}%`"></div>
                    </div>
                    <div class="dr-agent-bar-track">
                      <div class="dr-agent-bar-fill" style="background:linear-gradient(90deg,#8250df,var(--purple));"
                        :style="`width:${(ag.mins/Math.max(1,...cd.agents.map(x=>x.mins)))*100}%`"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Table Header -->
        <div class="dr-table-hd-row">
          <div class="dr-table-hd-left">
            <span class="dr-results-count">{{ filteredRecords.length }}</span>
            <span class="dr-results-label">call{{ filteredRecords.length !== 1 ? 's' : '' }}</span>
            <span v-if="filteredRecords.length !== report.records.length" class="dr-results-filt">(filtered from {{ report.records.length }})</span>
          </div>
          <div class="dr-table-hd-right">
            <div class="dr-search-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13" class="dr-search-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input type="text" v-model="tableSearch" class="dr-search-input" placeholder="Search destination, agent..." />
            </div>
            <div class="dr-pagination" v-if="totalPages > 1">
              <button class="dr-page-btn" :disabled="page <= 1" @click="page--">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <span class="dr-page-info">{{ page }} / {{ totalPages }}</span>
              <button class="dr-page-btn" :disabled="page >= totalPages" @click="page++">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Table -->
        <div class="dr-table-wrap">
          <table v-if="pagedRecords.length" class="dr-table">
            <thead>
              <tr>
                <th class="dr-th-sortable" @click="setSort('createdAt')">
                  Date &amp; Time
                  <span class="dr-sort-icon">{{ sortKey === 'createdAt' ? (sortDir === 'asc' ? '↑' : '↓') : '⇅' }}</span>
                </th>
                <th>Agent</th>
                <th class="dr-th-sortable" @click="setSort('destination')">
                  Destination
                  <span class="dr-sort-icon">{{ sortKey === 'destination' ? (sortDir === 'asc' ? '↑' : '↓') : '⇅' }}</span>
                </th>
                <th class="dr-th-sortable" @click="setSort('status')">
                  Status
                  <span class="dr-sort-icon">{{ sortKey === 'status' ? (sortDir === 'asc' ? '↑' : '↓') : '⇅' }}</span>
                </th>
                <th class="dr-th-sortable" @click="setSort('duration_seconds')">
                  Duration
                  <span class="dr-sort-icon">{{ sortKey === 'duration_seconds' ? (sortDir === 'asc' ? '↑' : '↓') : '⇅' }}</span>
                </th>
                <th style="text-align:center;">Rec</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in pagedRecords" :key="r.id" class="dr-table-row">
                <td>
                  <div class="dr-cell-date">
                    <span class="dr-date-d">{{ formatDateMain(r.createdAt) }}</span>
                    <span class="dr-date-t">{{ formatDateTime(r.createdAt) }}</span>
                  </div>
                </td>
                <td>
                  <span class="dr-agent-chip">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                    Ext {{ r.agent_extension || '—' }}
                  </span>
                </td>
                <td>
                  <div class="dr-dest-cell">
                    <span class="dr-dest-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                    </span>
                    <span class="dr-dest-num">{{ r.destination || '—' }}</span>
                  </div>
                </td>
                <td>
                  <span class="dr-status-pill" :class="statusClass(r.status)">
                    <span class="dr-status-dot"></span>
                    {{ statusLabel(r.status) }}
                  </span>
                </td>
                <td>
                  <span v-if="r.duration_seconds" class="dr-dur-cell">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    {{ formatDuration(r.duration_seconds) }}
                  </span>
                  <span v-else class="dr-dur-empty">—</span>
                </td>
                <td style="text-align:center;">
                  <div class="dr-rec-cell">
                    <div v-if="activeAudioRowId === r.id" class="dr-inline-player">
                      <button class="dr-inline-btn" @click.prevent="togglePlay" type="button" :title="audioPlaying ? 'Pause' : 'Play'">
                        <svg v-if="audioPlaying" viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                        <svg v-else viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M8 5v14l11-7z"/></svg>
                      </button>
                      <div class="dr-inline-tl">
                        <span class="dr-inline-time">{{ formatAudioTime(audioCurrentTime) }}</span>
                        <input type="range" min="0" :max="audioDuration || 100" :value="audioCurrentTime" @input="onSeek" class="dr-inline-slider"/>
                        <span class="dr-inline-time">{{ formatAudioTime(audioDuration) }}</span>
                      </div>
                      <button class="dr-inline-btn dr-inline-close" @click.prevent="closeAudio" title="Close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="10" height="10"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                    <button v-else-if="r.recording_id" class="dr-play-btn" @click.prevent="playInline(r)" title="Play recording">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                    <span v-else class="dr-dur-empty">—</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- No results -->
          <div v-else class="dr-no-results">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="36"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <p>No calls match your current filters</p>
            <button class="btn-reset" @click="resetFilters">Clear Filters</button>
          </div>
        </div>

        <!-- Pagination Footer -->
        <div v-if="totalPages > 1" class="dr-pagination-footer">
          <button class="dr-page-btn" :disabled="page <= 1" @click="page--">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
            Prev
          </button>
          <div class="dr-page-nums">
            <button v-for="p in pageNumbers" :key="p"
              class="dr-page-num-btn" :class="{ active: p === page }"
              @click="typeof p === 'number' && (page = p)">
              {{ p }}
            </button>
          </div>
          <button class="dr-page-btn" :disabled="page >= totalPages" @click="page++">
            Next
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>

      </div>

      <audio ref="audioRef" :src="activeAudioUrl"
        @play="audioPlaying = true" @pause="audioPlaying = false"
        @timeupdate="onTimeUpdate" @loadedmetadata="onLoadedMetadata"
        @ended="onAudioEnded" style="display:none;"></audio>
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
const tableSearch = ref('')
const page = ref(1)
const PAGE_SIZE = 20
const sortKey = ref('createdAt')
const sortDir = ref('desc')

// Audio
const audioRef = ref(null)
const activeAudioRowId = ref(null)
const audioPlaying = ref(false)
const audioDuration = ref(0)
const audioCurrentTime = ref(0)
const activeAudioUrl = ref('')

function playInline(r) {
  if (activeAudioRowId.value === r.id) { togglePlay(); return }
  activeAudioRowId.value = r.id
  audioPlaying.value = false
  audioCurrentTime.value = 0
  audioDuration.value = r.duration_seconds || 0
  const token = localStorage.getItem('admin_token') || ''
  const apiBase = import.meta.env.VITE_API_URL || window.location.origin
  activeAudioUrl.value = `${apiBase}/api/admin/dialers/${r.dialerId || selectedId.value}/recordings/${r.recording_id}/listen?token=${encodeURIComponent(token)}`
  nextTick(() => {
    if (audioRef.value) {
      audioRef.value.load()
      audioRef.value.play().catch(e => console.error('Audio playback failed:', e))
    }
  })
}
function togglePlay() {
  if (!audioRef.value) return
  audioPlaying.value ? audioRef.value.pause() : audioRef.value.play().catch(e => console.error(e))
}
function closeAudio() {
  audioRef.value?.pause()
  activeAudioRowId.value = null
  activeAudioUrl.value = ''
  audioPlaying.value = false
}
function onTimeUpdate() { if (audioRef.value) audioCurrentTime.value = audioRef.value.currentTime }
function onLoadedMetadata() {
  if (audioRef.value?.duration && !isNaN(audioRef.value.duration) && audioRef.value.duration !== Infinity)
    audioDuration.value = audioRef.value.duration
}
function onSeek(e) {
  if (audioRef.value) { audioRef.value.currentTime = parseFloat(e.target.value); audioCurrentTime.value = audioRef.value.currentTime }
}
function onAudioEnded() { audioPlaying.value = false; audioCurrentTime.value = 0 }
function formatAudioTime(s) {
  if (!s || isNaN(s)) return '0:00'
  return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`
}

onMounted(async () => { if (store.dialers.length === 0) await store.fetch() })
watch(dateFilter, () => { if (dateFilter.value !== 'custom') load() })
watch([statusFilter, agentFilter, tableSearch], () => { page.value = 1 })

async function load() {
  if (!selectedId.value) return
  loading.value = true
  try {
    const res = await axios.get(`/api/admin/dialer-widgets/${selectedId.value}/stats`)
    report.value = res.data
    page.value = 1
  } catch(err) { console.error(err) }
  finally { loading.value = false }
}

function resetFilters() {
  dateFilter.value = '30days'
  statusFilter.value = ''
  agentFilter.value = ''
  tableSearch.value = ''
  page.value = 1
}

function setSort(key) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'desc' }
  page.value = 1
}

const filteredRecords = computed(() => {
  if (!report.value?.records) return []
  let recs = report.value.records

  if (dateFilter.value !== 'all') {
    let start = new Date(); start.setHours(0,0,0,0)
    let end = new Date(); end.setHours(23,59,59,999)
    if (dateFilter.value === '7days') start.setDate(start.getDate() - 7)
    else if (dateFilter.value === '30days') start.setDate(start.getDate() - 30)
    else if (dateFilter.value === 'today') { /* already today */ }
    else if (dateFilter.value === 'custom') {
      start = customStartDate.value ? new Date(customStartDate.value) : new Date(0)
      end = customEndDate.value ? new Date(customEndDate.value) : end
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
    const t = agentFilter.value.trim().toLowerCase()
    recs = recs.filter(r => (r.agent_extension||'').toLowerCase().includes(t))
  }
  if (tableSearch.value.trim()) {
    const t = tableSearch.value.trim().toLowerCase()
    recs = recs.filter(r =>
      (r.destination||'').toLowerCase().includes(t) ||
      (r.agent_extension||'').toLowerCase().includes(t) ||
      (r.status||'').toLowerCase().includes(t)
    )
  }

  // Sort
  recs = [...recs].sort((a,b) => {
    let av = a[sortKey.value], bv = b[sortKey.value]
    if (sortKey.value === 'createdAt') { av = new Date(av).getTime(); bv = new Date(bv).getTime() }
    if (av == null) return 1; if (bv == null) return -1
    return sortDir.value === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
  })

  return recs
})

const kpiStats = computed(() => {
  const recs = filteredRecords.value
  const connected = recs.filter(r => ['Completed','Connected','Answered'].includes(r.status)).length
  const failed = recs.filter(r => ['Failed','Missed','Cancelled'].includes(r.status)).length
  const durations = recs.filter(r => r.duration_seconds > 0).map(r => r.duration_seconds)
  const totalDuration = durations.reduce((a,b) => a+b, 0)
  const avgDuration = durations.length ? Math.round(totalDuration / durations.length) : 0
  return { connected, failed, avgDuration, totalDuration }
})

const connectRate = computed(() => {
  const t = filteredRecords.value.length
  return t ? Math.round((kpiStats.value.connected / t) * 100) : 0
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRecords.value.length / PAGE_SIZE)))

const pagedRecords = computed(() => {
  const s = (page.value - 1) * PAGE_SIZE
  return filteredRecords.value.slice(s, s + PAGE_SIZE)
})

const pageNumbers = computed(() => {
  const total = totalPages.value
  const cur = page.value
  const pages = []
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (cur > 3) pages.push('…')
    for (let i = Math.max(2, cur-1); i <= Math.min(total-1, cur+1); i++) pages.push(i)
    if (cur < total - 2) pages.push('…')
    pages.push(total)
  }
  return pages
})

// Build time-series intervals
function buildIntervals() {
  const recs = filteredRecords.value
  const now = new Date()
  let intervals = []

  if (dateFilter.value === 'today') {
    for (let h = 0; h <= 22; h += 2) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, 0, 0)
      intervals.push({ label: `${String(h).padStart(2,'0')}:00`, start: d.getTime(), end: d.getTime() + 7200000, show: h % 4 === 0 })
    }
  } else if (dateFilter.value === '7days') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(now.getDate()-i)
      const ds = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
      intervals.push({ label: d.toLocaleDateString(undefined,{month:'short',day:'numeric'}), start: ds, end: ds+86400000, show: true })
    }
  } else if (dateFilter.value === '30days') {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(now.getDate()-i)
      const ds = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
      intervals.push({ label: d.toLocaleDateString(undefined,{month:'short',day:'numeric'}), start: ds, end: ds+86400000, show: i % 7 === 0 || i === 0 })
    }
  } else {
    // All time or custom: group by day across actual range
    if (recs.length === 0) return []
    const timestamps = recs.map(r => new Date(r.createdAt).getTime())
    const minTs = Math.min(...timestamps), maxTs = Math.max(...timestamps)
    const sd = new Date(minTs); sd.setHours(0,0,0,0)
    const days = Math.max(1, Math.ceil((maxTs - sd.getTime()) / 86400000) + 1)
    const step = days <= 14 ? 1 : days <= 60 ? 7 : 30
    for (let i = 0; i < days; i += step) {
      const d = new Date(sd.getTime() + i*86400000)
      const ds = d.getTime()
      intervals.push({ label: d.toLocaleDateString(undefined,{month:'short',day:'numeric'}), start: ds, end: ds + step*86400000, show: true })
    }
  }
  return intervals
}

function buildPath(pts, w, h, py) {
  if (!pts.length) return { line: '', area: '' }
  let line = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const cp1x = (pts[i-1].x + pts[i].x) / 2
    line += ` C ${cp1x} ${pts[i-1].y} ${cp1x} ${pts[i].y} ${pts[i].x} ${pts[i].y}`
  }
  const area = `${line} L ${pts[pts.length-1].x} ${h-py} L ${pts[0].x} ${h-py} Z`
  return { line, area }
}

const cd = computed(() => {
  const w = 520, h = 155, px = 44, py = 22
  const recs = filteredRecords.value
  const intervals = buildIntervals()

  const empty = { w, h, px, py, volPts: [], durPts: [], volPath: '', volAreaPath: '', durPath: '', durAreaPath: '',
    sb: { connected:0, failed:0, ringing:0, total:0 }, agents: [] }

  if (!intervals.length || !recs.length) return empty

  const data = intervals.map(iv => {
    const ir = recs.filter(r => { const t = new Date(r.createdAt).getTime(); return t >= iv.start && t < iv.end })
    const dur = ir.reduce((a,r) => a + (r.duration_seconds||0), 0)
    return { lbl: iv.show ? iv.label : null, count: ir.length, mins: Math.round((dur/60)*10)/10 }
  })

  const maxV = Math.max(1, ...data.map(d => d.count))
  const maxD = Math.max(0.1, ...data.map(d => d.mins))
  const innerW = w - px - 12
  const innerH = h - 2*py - 10

  const mkPts = (vals, maxVal) => data.map((d, i) => ({
    x: px + (i/(data.length-1||1))*innerW,
    y: h - py - (vals[i]/maxVal)*innerH,
    v: vals[i],
    lbl: d.lbl
  }))

  const volPts = mkPts(data.map(d=>d.count), maxV)
  const durPts = mkPts(data.map(d=>d.mins), maxD)
  const vp = buildPath(volPts, w, h, py)
  const dp = buildPath(durPts, w, h, py)

  // Status breakdown
  let connected=0, failed=0, ringing=0
  recs.forEach(r => {
    const s = (r.status||'').toLowerCase()
    if (['completed','connected','answered'].includes(s)) connected++
    else if (['failed','missed','cancelled'].includes(s)) failed++
    else if (['initiated','ringing'].includes(s)) ringing++
  })

  // Agent stats
  const am = {}
  recs.forEach(r => {
    const ext = r.agent_extension || '?'
    if (!am[ext]) am[ext] = { ext, calls:0, connected:0, dur:0 }
    am[ext].calls++
    const s = (r.status||'').toLowerCase()
    if (['completed','connected','answered'].includes(s)) { am[ext].connected++; am[ext].dur += (r.duration_seconds||0) }
  })
  const agents = Object.values(am)
    .map(a => ({ ext: a.ext, calls: a.calls, mins: Math.round((a.dur/60)*10)/10, rate: a.calls ? Math.round((a.connected/a.calls)*100) : 0 }))
    .sort((a,b) => b.calls - a.calls).slice(0, 6)

  return { w, h, px, py, volPts, durPts, volPath: vp.line, volAreaPath: vp.area, durPath: dp.line, durAreaPath: dp.area,
    sb: { connected, failed, ringing, total: recs.length }, agents }
})

// Sparklines (last 7 points of daily volume)
function sparklinePoints(type) {
  const recs = filteredRecords.value
  const pts = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i)
    const ds = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    const dr = recs.filter(r => { const t = new Date(r.createdAt).getTime(); return t >= ds && t < ds+86400000 })
    if (type === 'total') pts.push(dr.length)
    else if (type === 'connected') pts.push(dr.filter(r => ['Completed','Connected','Answered'].includes(r.status)).length)
    else if (type === 'failed') pts.push(dr.filter(r => ['Failed','Missed','Cancelled'].includes(r.status)).length)
    else if (type === 'duration') pts.push(dr.length ? Math.round(dr.filter(r=>r.duration_seconds>0).reduce((a,r)=>a+(r.duration_seconds||0),0) / Math.max(1,dr.filter(r=>r.duration_seconds>0).length)) : 0)
    else if (type === 'totaltime') pts.push(dr.reduce((a,r)=>a+(r.duration_seconds||0),0))
  }
  const maxV = Math.max(1, ...pts)
  return pts.map((v,i) => {
    const x = (i/(pts.length-1))*78 + 1
    const y = 26 - (v/maxV)*22
    return `${x},${y}`
  }).join(' ')
}

function statusClass(s) {
  if (!s) return 'pill-neutral'
  const l = s.toLowerCase()
  if (['completed','connected','answered'].includes(l)) return 'pill-green'
  if (['failed','missed','cancelled'].includes(l)) return 'pill-red'
  return 'pill-orange'
}

function statusLabel(s) {
  if (!s) return 'Unknown'
  const l = s.toLowerCase()
  if (['completed','connected','answered'].includes(l)) return 'Connected'
  if (['failed','missed','cancelled'].includes(l)) return 'Failed'
  if (['initiated','ringing'].includes(l)) return 'Ringing'
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
  const m = Math.floor(sec/60), s = sec%60
  return m === 0 ? `${s}s` : `${m}m ${s}s`
}
function formatTotalTime(sec) {
  if (!sec) return '0m'
  const h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function downloadCSV() {
  const rows = [['Date','Time','Agent Ext','Destination','Status','Duration (s)']]
  filteredRecords.value.forEach(r => rows.push([
    formatDateMain(r.createdAt), formatDateTime(r.createdAt),
    r.agent_extension||'', r.destination||'', r.status||'', r.duration_seconds||'0'
  ]))
  const csv = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n')
  const link = document.createElement('a')
  link.setAttribute('href', encodeURI(csv))
  link.setAttribute('download', `Dialer_Report_${new Date().toISOString().slice(0,10)}.csv`)
  document.body.appendChild(link); link.click(); document.body.removeChild(link)
}
</script>

<style scoped>
/* ─── Base ─── */
.dr-page {
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 18px;
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
.dr-header-left { display: flex; align-items: center; gap: 14px; }
.dr-header-icon {
  width: 44px; height: 44px;
  background: linear-gradient(135deg, rgba(88,166,255,.18), rgba(188,140,255,.12));
  border: 1px solid rgba(88,166,255,.25);
  border-radius: 13px;
  display: flex; align-items: center; justify-content: center;
  color: var(--accent); flex-shrink: 0;
}
.dr-title { font-size: 21px; font-weight: 800; color: var(--text); line-height: 1.1; }
.dr-sub { font-size: 12.5px; color: var(--text2); margin-top: 2px; }
.dr-header-actions { display: flex; gap: 8px; align-items: center; }

.btn-icon-action {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 14px; background: var(--bg2);
  border: 1px solid var(--border); border-radius: 9px;
  color: var(--text2); font-size: 12.5px; font-weight: 600;
  cursor: pointer; transition: all .18s;
}
.btn-icon-action:hover { color: var(--text); border-color: var(--accent); background: var(--bg3); }
.btn-icon-action.spinning svg { animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.btn-csv {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 16px; background: linear-gradient(135deg, #1f6feb, #388bfd);
  border: none; border-radius: 9px; color: #fff;
  font-size: 12.5px; font-weight: 600; cursor: pointer; transition: all .18s;
  box-shadow: 0 4px 14px rgba(56,139,253,.3);
}
.btn-csv:hover:not(:disabled) { box-shadow: 0 6px 22px rgba(56,139,253,.5); transform: translateY(-1px); }
.btn-csv:disabled { opacity: .4; cursor: not-allowed; transform: none; box-shadow: none; }

/* ─── Filter Bar ─── */
.dr-filter-bar {
  display: flex; flex-wrap: wrap; align-items: center; gap: 12px;
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: 13px; padding: 11px 18px;
}
.dr-filter-divider { width: 1px; height: 26px; background: var(--border); flex-shrink: 0; }
.dr-filter-item { display: flex; flex-direction: column; gap: 3px; min-width: 120px; }
.dr-filter-dialer { min-width: 170px; }
.dr-filter-label {
  display: flex; align-items: center; gap: 4px;
  font-size: 9.5px; font-weight: 700; color: var(--text3);
  text-transform: uppercase; letter-spacing: .7px;
}
.dr-select {
  background: transparent; border: none;
  border-bottom: 1.5px solid var(--border);
  color: var(--text); font-size: 12.5px; font-weight: 500;
  font-family: inherit; padding: 2px 18px 2px 2px; outline: none;
  cursor: pointer; transition: border-color .18s; width: 100%;
}
select.dr-select {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23848d97' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat; background-position: right 2px center; background-size: 11px;
}
select.dr-select option { background-color: var(--bg2); color: var(--text); }
.dr-select:focus { border-bottom-color: var(--accent); }

.dr-clear-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 11px; background: rgba(248,81,73,.08);
  border: 1px solid rgba(248,81,73,.2); border-radius: 7px;
  color: var(--red); font-size: 11px; font-weight: 600;
  cursor: pointer; transition: all .15s; margin-left: auto;
}
.dr-clear-btn:hover { background: rgba(248,81,73,.15); }

/* ─── Empty / Loading ─── */
.dr-empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 14px; padding: 80px 20px; text-align: center;
}
.dr-empty-icon-wrap {
  width: 68px; height: 68px; background: var(--bg2);
  border: 1px solid var(--border); border-radius: 18px;
  display: flex; align-items: center; justify-content: center; color: var(--text3);
}
.dr-empty-title { font-size: 15px; font-weight: 700; color: var(--text); }
.dr-empty-sub { font-size: 12.5px; color: var(--text2); max-width: 300px; }
.dr-spinner {
  width: 30px; height: 30px;
  border: 3px solid var(--border); border-top-color: var(--accent);
  border-radius: 50%; animation: spin .65s linear infinite;
}

/* ─── Report Body ─── */
.dr-body { display: flex; flex-direction: column; gap: 18px; }

/* ─── KPI Grid ─── */
.dr-kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 14px;
}
@media (max-width: 1280px) { .dr-kpi-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 700px)  { .dr-kpi-grid { grid-template-columns: 1fr 1fr; } }

.dr-kpi-card {
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: 14px; padding: 16px 18px;
  display: flex; flex-direction: column; gap: 6px;
  position: relative; overflow: hidden;
  transition: border-color .2s, box-shadow .2s, transform .2s;
}
.dr-kpi-card:hover { border-color: var(--bg4); box-shadow: 0 6px 24px rgba(0,0,0,.25); transform: translateY(-1px); }

.dr-kpi-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px; }
.dr-kpi-icon-wrap {
  width: 32px; height: 32px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.dr-kpi-badge {
  font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 20px;
}
.dr-kpi-num { font-size: 28px; font-weight: 800; line-height: 1.1; font-variant-numeric: tabular-nums; }
.dr-kpi-label { font-size: 10.5px; font-weight: 600; color: var(--text3); text-transform: uppercase; letter-spacing: .5px; }

.dr-kpi-sparkline { height: 28px; margin-top: 2px; }
.sparkline-svg { width: 100%; height: 28px; overflow: visible; }

.dr-kpi-bottom-bar {
  position: absolute; bottom: 0; left: 0; height: 2.5px;
  border-radius: 0 2px 0 0;
  transition: width .9s cubic-bezier(0.16,1,0.3,1);
}

/* Rate Card */
.dr-kpi-rate-card { flex-direction: row; align-items: center; justify-content: space-between; }
.dr-kpi-rate-left { display: flex; flex-direction: column; gap: 6px; }
.dr-rate-donut { flex-shrink: 0; }

/* ─── Charts ─── */
.dr-charts-row {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
}
.dr-charts-row-b {
  grid-template-columns: 1fr 1.25fr;
}
@media (max-width: 900px) { .dr-charts-row, .dr-charts-row-b { grid-template-columns: 1fr; } }

.dr-chart-card {
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: 14px; padding: 18px 20px;
  display: flex; flex-direction: column; gap: 14px;
  transition: border-color .2s, box-shadow .2s;
}
.dr-chart-card:hover { border-color: var(--bg4); box-shadow: 0 4px 22px rgba(0,0,0,.2); }

.dr-chart-hd { display: flex; align-items: center; justify-content: space-between; }
.dr-chart-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 13.5px; font-weight: 700; color: var(--text);
}
.dr-chart-title-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.dr-chart-sub { font-size: 11px; color: var(--text3); margin-top: 3px; padding-left: 15px; }
.dr-chart-legend-pill {
  font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px;
}

.dr-chart-body { width: 100%; }
.dr-chart-svg { width: 100%; height: auto; display: block; overflow: visible; }

/* ─── Donut ─── */
.dr-donut-row { display: flex; align-items: center; gap: 24px; flex: 1; }
.dr-donut-wrap { flex-shrink: 0; }
.dr-donut-svg { width: 120px; height: 120px; display: block; }

.dr-donut-legend { display: flex; flex-direction: column; gap: 12px; flex: 1; }
.dr-legend-row {
  display: grid;
  grid-template-columns: 10px 1fr 28px 1fr 38px;
  align-items: center; gap: 10px;
}
.dr-legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dr-legend-name { font-size: 12px; font-weight: 500; color: var(--text2); }
.dr-legend-val { font-size: 12px; font-weight: 700; color: var(--text); text-align: right; font-variant-numeric: tabular-nums; }
.dr-legend-bar-wrap { height: 5px; background: var(--bg4); border-radius: 3px; overflow: hidden; }
.dr-legend-bar { height: 100%; border-radius: 3px; transition: width .8s cubic-bezier(0.16,1,0.3,1); }
.dr-legend-pct { font-size: 11px; font-weight: 700; text-align: right; font-variant-numeric: tabular-nums; }

/* ─── Agent Bars ─── */
.dr-legend-chips { display: flex; gap: 8px; }
.dr-chip { display: inline-flex; align-items: center; gap: 5px; padding: 3px 8px; border-radius: 20px; font-size: 10.5px; font-weight: 600; }
.dr-agent-body { display: flex; flex-direction: column; gap: 12px; }
.dr-no-agent-data { color: var(--text3); font-size: 12px; text-align: center; padding: 24px 0; }

.dr-agent-row { display: flex; flex-direction: column; gap: 7px; }
.dr-agent-row-header { display: flex; align-items: center; gap: 10px; }
.dr-agent-avatar {
  width: 30px; height: 30px; border-radius: 9px; flex-shrink: 0;
  background: linear-gradient(135deg, rgba(88,166,255,.2), rgba(188,140,255,.15));
  border: 1px solid rgba(88,166,255,.2);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; color: var(--accent);
}
.dr-agent-info { display: flex; flex-direction: column; gap: 1px; flex: 1; min-width: 0; }
.dr-agent-ext { font-size: 12.5px; font-weight: 700; color: var(--text); }
.dr-agent-rate { font-size: 10.5px; font-weight: 600; }
.dr-agent-nums { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; flex-shrink: 0; }
.dr-agent-call-count { font-size: 13px; font-weight: 800; color: var(--accent); }
.dr-agent-time { font-size: 10.5px; color: var(--purple); font-weight: 600; }

.dr-agent-bars { display: flex; flex-direction: column; gap: 5px; }
.dr-agent-bar-track { height: 5px; background: var(--bg4); border-radius: 3px; overflow: hidden; }
.dr-agent-bar-fill { height: 100%; border-radius: 3px; transition: width .7s cubic-bezier(0.16,1,0.3,1); }

/* ─── Table Header Row ─── */
.dr-table-hd-row {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; flex-wrap: wrap;
}
.dr-table-hd-left { display: flex; align-items: baseline; gap: 7px; }
.dr-results-count { font-size: 22px; font-weight: 800; color: var(--text); font-variant-numeric: tabular-nums; }
.dr-results-label { font-size: 13px; color: var(--text2); font-weight: 500; }
.dr-results-filt { font-size: 11.5px; color: var(--text3); }
.dr-table-hd-right { display: flex; align-items: center; gap: 10px; }

.dr-search-wrap {
  display: flex; align-items: center; gap: 7px;
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: 9px; padding: 7px 12px; transition: border-color .18s;
}
.dr-search-wrap:focus-within { border-color: var(--accent); }
.dr-search-icon { color: var(--text3); flex-shrink: 0; }
.dr-search-input {
  background: transparent; border: none; outline: none;
  color: var(--text); font-size: 12.5px; font-family: inherit;
  width: 200px;
}
.dr-search-input::placeholder { color: var(--text3); }

/* ─── Pagination ─── */
.dr-pagination { display: flex; align-items: center; gap: 6px; }
.dr-page-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 10px; background: var(--bg2); border: 1px solid var(--border);
  border-radius: 7px; color: var(--text2); font-size: 11.5px; font-weight: 600;
  cursor: pointer; transition: all .15s;
}
.dr-page-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--text); }
.dr-page-btn:disabled { opacity: .4; cursor: not-allowed; }
.dr-page-info { font-size: 12px; color: var(--text2); font-weight: 600; white-space: nowrap; }

.dr-pagination-footer {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 8px 0;
}
.dr-page-nums { display: flex; align-items: center; gap: 5px; }
.dr-page-num-btn {
  min-width: 32px; height: 32px; padding: 0 4px;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: 7px; color: var(--text2); font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all .15s;
}
.dr-page-num-btn:hover { border-color: var(--accent); color: var(--accent); }
.dr-page-num-btn.active {
  background: var(--accent); border-color: var(--accent);
  color: #fff; box-shadow: 0 2px 10px rgba(88,166,255,.35);
}

/* ─── Table ─── */
.dr-table-wrap {
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: 14px; overflow: hidden;
}
.dr-table { width: 100%; border-collapse: collapse; }
.dr-table thead tr { background: var(--bg3); }
.dr-table thead th {
  padding: 11px 16px; text-align: left;
  font-size: 10.5px; font-weight: 700; color: var(--text3);
  text-transform: uppercase; letter-spacing: .6px;
  border-bottom: 1px solid var(--border); white-space: nowrap;
}
.dr-th-sortable { cursor: pointer; user-select: none; transition: color .15s; }
.dr-th-sortable:hover { color: var(--text); }
.dr-sort-icon { margin-left: 4px; opacity: .6; }

.dr-table-row { border-bottom: 1px solid var(--border); transition: background .12s; }
.dr-table-row:last-child { border-bottom: none; }
.dr-table-row:hover { background: var(--bg3); }
.dr-table-row td { padding: 11px 16px; font-size: 12.5px; color: var(--text); vertical-align: middle; }

.dr-cell-date { display: flex; flex-direction: column; gap: 1px; }
.dr-date-d { font-weight: 600; font-size: 12.5px; }
.dr-date-t { font-size: 10.5px; color: var(--text3); }

.dr-agent-chip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 9px; background: var(--bg3);
  border: 1px solid var(--border); border-radius: 20px;
  font-size: 11.5px; font-weight: 600; color: var(--text2);
}
.dr-dest-cell { display: flex; align-items: center; gap: 7px; }
.dr-dest-icon { color: var(--text3); flex-shrink: 0; }
.dr-dest-num { font-family: monospace; font-size: 12.5px; letter-spacing: .3px; }

.dr-status-pill {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 3px 10px; border-radius: 20px;
  font-size: 11.5px; font-weight: 600;
}
.dr-status-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
.pill-green { background: rgba(63,185,80,.1); color: var(--green); border: 1px solid rgba(63,185,80,.2); }
.pill-green .dr-status-dot { background: var(--green); box-shadow: 0 0 0 2px rgba(63,185,80,.25); }
.pill-red   { background: rgba(248,81,73,.1);  color: var(--red);   border: 1px solid rgba(248,81,73,.2); }
.pill-red   .dr-status-dot { background: var(--red); }
.pill-orange{ background: rgba(240,136,62,.1); color: var(--orange);border: 1px solid rgba(240,136,62,.2); }
.pill-orange .dr-status-dot { background: var(--orange); }
.pill-neutral { background: var(--bg3); color: var(--text2); border: 1px solid var(--border); }
.pill-neutral .dr-status-dot { background: var(--text3); }

.dr-dur-cell {
  display: inline-flex; align-items: center; gap: 5px;
  font-variant-numeric: tabular-nums; color: var(--text2); font-size: 12px;
}
.dr-dur-empty { color: var(--text3); }

/* ─── Rec Cell / Inline Player ─── */
.dr-rec-cell { display: flex; align-items: center; justify-content: center; }
.dr-play-btn {
  width: 28px; height: 28px; border-radius: 50%;
  background: rgba(88,166,255,.12); border: 1px solid rgba(88,166,255,.25);
  color: var(--accent); cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all .15s;
}
.dr-play-btn:hover { background: rgba(88,166,255,.22); box-shadow: 0 0 0 3px rgba(88,166,255,.15); transform: scale(1.05); }

.dr-inline-player {
  display: inline-flex; align-items: center; gap: 7px;
  background: var(--bg4); border: 1px solid var(--border);
  padding: 4px 9px; border-radius: 24px; min-width: 180px; max-width: 240px;
}
.dr-inline-btn {
  background: transparent; border: none; color: var(--text);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; border-radius: 50%; transition: background .12s; padding: 0;
}
.dr-inline-btn:hover { background: rgba(255,255,255,.1); }
.dr-inline-close { color: var(--text3); }
.dr-inline-tl { display: flex; align-items: center; gap: 5px; flex: 1; overflow: hidden; }
.dr-inline-time { font-size: 9.5px; color: var(--text2); font-family: monospace; flex-shrink: 0; }
.dr-inline-slider {
  flex: 1; height: 3px; background: var(--border); border-radius: 2px;
  appearance: none; outline: none; cursor: pointer; min-width: 30px;
}
.dr-inline-slider::-webkit-slider-thumb {
  appearance: none; width: 9px; height: 9px;
  background: var(--accent); border-radius: 50%; transition: transform .1s;
}
.dr-inline-slider::-webkit-slider-thumb:hover { transform: scale(1.3); }

/* ─── No results ─── */
.dr-no-results {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; padding: 60px 20px; text-align: center; color: var(--text3);
}
.dr-no-results p { font-size: 13px; color: var(--text2); }
.btn-reset {
  padding: 6px 16px; background: var(--bg3); border: 1px solid var(--border);
  border-radius: 8px; color: var(--text2); font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all .18s;
}
.btn-reset:hover { color: var(--text); border-color: var(--accent); }
</style>
