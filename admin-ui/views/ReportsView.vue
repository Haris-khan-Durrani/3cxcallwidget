<template>
  <AppLayout>
    <div class="rp-page">

      <!-- ── Header ── -->
      <div class="rp-header">
        <div class="rp-header-left">
          <div class="rp-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="22" height="22">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <div>
            <h1 class="rp-title">Call Reports</h1>
            <p class="rp-sub">Track every lead and call initiated through your widgets</p>
          </div>
        </div>
        <div class="rp-header-actions">
          <button class="rp-btn-refresh" @click="load" :class="{ spinning: loading }" title="Refresh">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Refresh
          </button>
          <button class="rp-btn-csv" @click="downloadCSV" :disabled="!filteredRecords.length">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Download CSV
          </button>
        </div>
      </div>

      <!-- ── Filter Bar ── -->
      <div class="rp-filter-bar">
        <div class="rp-filter-item rp-filter-widget">
          <label class="rp-filter-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
            Widget
          </label>
          <select v-model="selectedId" class="rp-select" @change="load">
            <option value="">— Choose a widget —</option>
            <option v-for="w in store.widgets" :key="w.id" :value="w.id">{{ w.name }}</option>
          </select>
        </div>

        <template v-if="selectedId">
          <div class="rp-filter-divider"></div>

          <div class="rp-filter-item">
            <label class="rp-filter-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Date Range
            </label>
            <select v-model="dateFilter" class="rp-select">
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          <template v-if="dateFilter === 'custom'">
            <div class="rp-filter-item">
              <label class="rp-filter-label">From</label>
              <input type="date" v-model="customStartDate" class="rp-select"/>
            </div>
            <div class="rp-filter-item">
              <label class="rp-filter-label">To</label>
              <input type="date" v-model="customEndDate" class="rp-select"/>
            </div>
          </template>

          <div class="rp-filter-item">
            <label class="rp-filter-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Status
            </label>
            <select v-model="statusFilter" class="rp-select">
              <option value="">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Answered">Answered</option>
              <option value="Ringing">Ringing</option>
              <option value="Initiated">Initiated</option>
              <option value="Failed">Failed / Missed</option>
            </select>
          </div>

          <div class="rp-filter-item">
            <label class="rp-filter-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              Agent
            </label>
            <select v-model="agentFilter" class="rp-select">
              <option value="">All Agents</option>
              <option v-for="a in currentWidget?.Agents || []" :key="a.id" :value="a.extension">
                {{ a.first_name }} {{ a.last_name || '' }} ({{ a.extension }})
              </option>
            </select>
          </div>

          <button v-if="statusFilter || agentFilter || dateFilter !== 'all'" class="rp-clear-btn" @click="resetFilters">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="11" height="11"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            Clear
          </button>
        </template>
      </div>

      <!-- ── No Selection ── -->
      <div v-if="!selectedId" class="rp-empty">
        <div class="rp-empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
        <p class="rp-empty-title">Select a widget to begin</p>
        <p class="rp-empty-sub">Choose a widget from the filter bar above to view its call history and analytics</p>
      </div>

      <!-- ── Loading ── -->
      <div v-else-if="loading" class="rp-empty">
        <div class="rp-spinner"></div>
        <p class="rp-empty-sub">Loading report data...</p>
      </div>

      <!-- ── Report Body ── -->
      <div v-else-if="report" class="rp-body">

        <!-- KPI Summary Cards -->
        <div class="rp-kpi-row">
          <div class="rp-kpi-card">
            <div class="rp-kpi-card-top">
              <div class="rp-kpi-icon" style="background:rgba(88,166,255,.12);color:var(--accent);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              </div>
              <span class="rp-kpi-badge" style="background:rgba(88,166,255,.1);color:var(--accent);">Total</span>
            </div>
            <div class="rp-kpi-num" style="color:var(--text)">{{ filteredTotal }}</div>
            <div class="rp-kpi-lbl">Total Calls</div>
            <div class="rp-kpi-bar" style="background:var(--accent);width:100%;"></div>
          </div>

          <div class="rp-kpi-card">
            <div class="rp-kpi-card-top">
              <div class="rp-kpi-icon" style="background:rgba(63,185,80,.12);color:var(--green);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <span class="rp-kpi-badge" style="background:rgba(63,185,80,.1);color:var(--green);">
                {{ filteredTotal ? Math.round((filteredCompleted/filteredTotal)*100) : 0 }}%
              </span>
            </div>
            <div class="rp-kpi-num" style="color:var(--green)">{{ filteredCompleted }}</div>
            <div class="rp-kpi-lbl">Connected</div>
            <div class="rp-kpi-bar" style="background:var(--green);" :style="`width:${filteredTotal?(filteredCompleted/filteredTotal)*100:0}%`"></div>
          </div>

          <div class="rp-kpi-card">
            <div class="rp-kpi-card-top">
              <div class="rp-kpi-icon" style="background:rgba(248,81,73,.12);color:var(--red);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <span class="rp-kpi-badge" style="background:rgba(248,81,73,.1);color:var(--red);">
                {{ filteredTotal ? Math.round((filteredFailed/filteredTotal)*100) : 0 }}%
              </span>
            </div>
            <div class="rp-kpi-num" style="color:var(--red)">{{ filteredFailed }}</div>
            <div class="rp-kpi-lbl">Failed / Missed</div>
            <div class="rp-kpi-bar" style="background:var(--red);" :style="`width:${filteredTotal?(filteredFailed/filteredTotal)*100:0}%`"></div>
          </div>

          <div class="rp-kpi-card">
            <div class="rp-kpi-card-top">
              <div class="rp-kpi-icon" style="background:rgba(240,136,62,.12);color:var(--orange);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <span class="rp-kpi-badge" style="background:rgba(240,136,62,.1);color:var(--orange);">Ringing</span>
            </div>
            <div class="rp-kpi-num" style="color:var(--orange)">{{ filteredInitiated }}</div>
            <div class="rp-kpi-lbl">In Progress</div>
            <div class="rp-kpi-bar" style="background:var(--orange);" :style="`width:${filteredTotal?(filteredInitiated/filteredTotal)*100:0}%`"></div>
          </div>

          <!-- Answer Rate Donut KPI -->
          <div class="rp-kpi-card rp-kpi-rate-card">
            <div class="rp-kpi-rate-left">
              <div class="rp-kpi-card-top">
                <div class="rp-kpi-icon" style="background:rgba(188,140,255,.12);color:var(--purple);">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                </div>
              </div>
              <div class="rp-kpi-num" style="color:var(--purple)">{{ answerRatePercentage }}%</div>
              <div class="rp-kpi-lbl">Answer Rate</div>
            </div>
            <svg viewBox="0 0 36 36" width="62" height="62" style="flex-shrink:0;">
              <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--bg4)" stroke-width="3.5"/>
              <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--purple)" stroke-width="3.5"
                stroke-dasharray="100" :stroke-dashoffset="100 - answerRatePercentage"
                stroke-linecap="round" transform="rotate(-90 18 18)"
                style="transition:stroke-dashoffset .9s cubic-bezier(0.16,1,0.3,1)"/>
              <text x="18" y="20.5" text-anchor="middle" font-size="7" font-weight="800" fill="var(--purple)">{{ answerRatePercentage }}%</text>
            </svg>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="rp-charts-row">
          <!-- Call Volume Trend -->
          <div class="rp-chart-card rp-chart-wide">
            <div class="rp-chart-hd">
              <div>
                <div class="rp-chart-title">
                  <span class="rp-title-dot" style="background:var(--accent);"></span>
                  Call Volume Trend
                </div>
                <div class="rp-chart-sub">{{ chartPeriodLabel }}</div>
              </div>
              <div class="rp-chart-pill" style="background:rgba(88,166,255,.1);color:var(--accent);">{{ filteredTotal }} total</div>
            </div>
            <div class="rp-chart-body">
              <svg :viewBox="`0 0 ${wcd.w} ${wcd.h}`" class="rp-chart-svg" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="rp-vol-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#58a6ff" stop-opacity="0.22"/>
                    <stop offset="100%" stop-color="#58a6ff" stop-opacity="0.01"/>
                  </linearGradient>
                </defs>
                <line v-for="i in 5" :key="i"
                  :x1="wcd.px" :y1="wcd.py + (i-1)*((wcd.h-2*wcd.py)/4)"
                  :x2="wcd.w-8" :y2="wcd.py + (i-1)*((wcd.h-2*wcd.py)/4)"
                  stroke="var(--border)" stroke-width="0.5" stroke-dasharray="4,5"/>
                <path v-if="wcd.areaPath" :d="wcd.areaPath" fill="url(#rp-vol-grad)"/>
                <path v-if="wcd.path" :d="wcd.path" fill="none" stroke="var(--accent)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                <g v-for="(p,i) in wcd.points" :key="i">
                  <circle v-if="p.count > 0" :cx="p.x" :cy="p.y" r="4" fill="var(--bg2)" stroke="var(--accent)" stroke-width="2.2"/>
                  <text v-if="p.count > 0" :x="p.x" :y="Math.max(13, p.y-8)" text-anchor="middle" font-size="9" font-weight="700" fill="var(--accent)">{{ p.count }}</text>
                  <text v-if="p.showLabel" :x="p.x" :y="wcd.h - 3" text-anchor="middle" font-size="8.5" fill="var(--text3)">{{ p.label }}</text>
                </g>
              </svg>
            </div>
          </div>

          <!-- Answer Rate Card (redesigned donut) -->
          <div class="rp-chart-card rp-chart-narrow">
            <div class="rp-chart-hd">
              <div>
                <div class="rp-chart-title">
                  <span class="rp-title-dot" style="background:var(--green);"></span>
                  Call Outcomes
                </div>
                <div class="rp-chart-sub">Call result distribution</div>
              </div>
            </div>
            <div class="rp-donut-row">
              <svg viewBox="0 0 100 100" class="rp-donut-svg">
                <circle cx="50" cy="50" r="38" fill="none" stroke="var(--bg4)" stroke-width="9"/>
                <!-- Connected -->
                <circle v-if="filteredTotal > 0" cx="50" cy="50" r="38" fill="none"
                  stroke="var(--green)" stroke-width="9.5"
                  stroke-dasharray="238.76"
                  :stroke-dashoffset="238.76 * (1 - filteredCompleted/filteredTotal)"
                  stroke-linecap="butt" transform="rotate(-90 50 50)"
                  style="transition:stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)"/>
                <!-- Failed -->
                <circle v-if="filteredTotal > 0" cx="50" cy="50" r="38" fill="none"
                  stroke="var(--red)" stroke-width="9.5"
                  stroke-dasharray="238.76"
                  :stroke-dashoffset="238.76 * (1 - filteredFailed/filteredTotal)"
                  stroke-linecap="butt"
                  :transform="`rotate(${-90 + 360*(filteredCompleted/filteredTotal)} 50 50)`"
                  style="transition:stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)"/>
                <!-- Initiated -->
                <circle v-if="filteredTotal > 0" cx="50" cy="50" r="38" fill="none"
                  stroke="var(--orange)" stroke-width="9.5"
                  stroke-dasharray="238.76"
                  :stroke-dashoffset="238.76 * (1 - filteredInitiated/filteredTotal)"
                  stroke-linecap="butt"
                  :transform="`rotate(${-90 + 360*((filteredCompleted+filteredFailed)/filteredTotal)} 50 50)`"
                  style="transition:stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)"/>
                <text x="50" y="47" text-anchor="middle" font-size="15" font-weight="800" fill="var(--text)">{{ answerRatePercentage }}%</text>
                <text x="50" y="60" text-anchor="middle" font-size="7.5" fill="var(--text3)" font-weight="700" letter-spacing="0.5">ANSWER RATE</text>
              </svg>
              <div class="rp-donut-legend">
                <div class="rp-lg-row">
                  <span class="rp-lg-dot" style="background:var(--green);"></span>
                  <span class="rp-lg-name">Connected</span>
                  <span class="rp-lg-val" style="color:var(--green)">{{ filteredCompleted }}</span>
                </div>
                <div class="rp-lg-row">
                  <span class="rp-lg-dot" style="background:var(--red);"></span>
                  <span class="rp-lg-name">Failed / Missed</span>
                  <span class="rp-lg-val" style="color:var(--red)">{{ filteredFailed }}</span>
                </div>
                <div class="rp-lg-row">
                  <span class="rp-lg-dot" style="background:var(--orange);"></span>
                  <span class="rp-lg-name">In Progress</span>
                  <span class="rp-lg-val" style="color:var(--orange)">{{ filteredInitiated }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="rp-tabs-bar">
          <button class="rp-tab-btn" :class="{ active: activeTab === 'calls' }" @click="activeTab = 'calls'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            Call Log &amp; History
            <span class="rp-tab-badge">{{ filteredRecords.length }}</span>
          </button>
          <button class="rp-tab-btn" :class="{ active: activeTab === 'agents' }" @click="activeTab = 'agents'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            Agent Performance
            <span class="rp-tab-badge">{{ agentPerformanceStats.length }}</span>
          </button>
        </div>

        <!-- Call Log Tab -->
        <div v-if="activeTab === 'calls'" class="rp-table-card rp-anim">
          <div class="rp-table-top">
            <div class="rp-table-top-left">
              <span class="rp-count-big">{{ filteredRecords.length }}</span>
              <span class="rp-count-lbl">call{{ filteredRecords.length !== 1 ? 's' : '' }}</span>
              <span v-if="filteredRecords.length !== (report.records?.length || 0)" class="rp-count-filt">
                (of {{ report.records?.length || 0 }} total)
              </span>
            </div>
            <div class="rp-table-top-right">
              <div class="rp-search-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13" style="color:var(--text3);flex-shrink:0"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <input v-model="search" type="text" class="rp-search-input" placeholder="Search by name, phone, URL or IP…"/>
              </div>
              <div class="rp-pager" v-if="totalPages > 1">
                <button class="rp-pager-btn" :disabled="page <= 1" @click="page--">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="11" height="11"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <span class="rp-pager-info">{{ page }} / {{ totalPages }}</span>
                <button class="rp-pager-btn" :disabled="page >= totalPages" @click="page++">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="11" height="11"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>
            </div>
          </div>

          <div v-if="!filteredRecords.length" class="rp-no-results">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="36"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <p>No calls match your filters</p>
            <button class="rp-btn-ghost" @click="resetFilters">Clear Filters</button>
          </div>

          <div v-else class="rp-table-wrap">
            <table class="rp-table">
              <thead>
                <tr>
                  <th class="rp-th-sort" @click="sortBy('customer_name')">Name <span class="rp-sort">{{ sortKey==='customer_name'?(sortDir==='asc'?'↑':'↓'):'⇅' }}</span></th>
                  <th>Phone</th>
                  <th>Ref URL</th>
                  <th>IP</th>
                  <th>Agent Call Flow</th>
                  <th class="rp-th-sort" @click="sortBy('duration_seconds')">Duration <span class="rp-sort">{{ sortKey==='duration_seconds'?(sortDir==='asc'?'↑':'↓'):'⇅' }}</span></th>
                  <th class="rp-th-sort" @click="sortBy('status')">Status <span class="rp-sort">{{ sortKey==='status'?(sortDir==='asc'?'↑':'↓'):'⇅' }}</span></th>
                  <th style="text-align:center;">Rec</th>
                  <th class="rp-th-sort" @click="sortBy('createdAt')">Date &amp; Time <span class="rp-sort">{{ sortKey==='createdAt'?(sortDir==='asc'?'↑':'↓'):'⇅' }}</span></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in paginatedRecords" :key="r.id" class="rp-tr">
                  <td>
                    <div class="rp-name-cell">
                      <div class="rp-name-av">{{ (r.customer_name || '?').charAt(0).toUpperCase() }}</div>
                      <strong class="rp-name-text">{{ r.customer_name || '—' }}</strong>
                    </div>
                  </td>
                  <td>
                    <code class="rp-phone">{{ r.customer_phone || '—' }}</code>
                  </td>
                  <td>
                    <a v-if="r.page_url" :href="r.page_url" target="_blank" rel="noopener" class="rp-url-link" :title="r.page_url">
                      {{ cleanUrl(r.page_url) }}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                    </a>
                    <span v-else class="rp-empty-cell">—</span>
                  </td>
                  <td>
                    <code v-if="r.ip_address" class="rp-ip">{{ r.ip_address }}</code>
                    <span v-else class="rp-empty-cell">—</span>
                  </td>
                  <td>
                    <div v-if="r.agent_extension" class="rp-flow-wrap">
                      <div v-for="(step, idx) in parseCallFlow(r.agent_extension, r.status)" :key="idx" class="rp-flow-step">
                        <svg v-if="idx > 0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="9" height="9" style="color:var(--text3);flex-shrink:0"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                        <span class="rp-flow-badge"
                          :class="step.answered ? 'fbg-green' : step.statusText === 'Busy' ? 'fbg-orange' : 'fbg-red'"
                          :title="step.answered ? 'Answered' : step.statusText === 'Busy' ? 'Busy' : 'Missed'">
                          <svg v-if="step.answered" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="9" height="9"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                          <svg v-else-if="step.statusText === 'Busy'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="9" height="9"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="9" height="9"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                          <span class="rp-flow-name">{{ step.name }}</span>
                          <span class="rp-flow-ext">({{ step.ext }})</span>
                        </span>
                      </div>
                    </div>
                    <span v-else class="rp-empty-cell">—</span>
                  </td>
                  <td>
                    <span v-if="r.duration_seconds" class="rp-dur-cell">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      {{ formatDuration(r.duration_seconds) }}
                    </span>
                    <span v-else class="rp-empty-cell">—</span>
                  </td>
                  <td>
                    <span class="rp-badge" :class="statusClass(r.status)">
                      <span class="rp-badge-dot"></span>
                      {{ r.status }}
                    </span>
                  </td>
                  <td style="text-align:center;">
                    <div class="rp-rec-cell">
                      <div v-if="activeAudioRowId === r.id" class="rp-inline-player">
                        <button class="rp-ib" @click.prevent="togglePlay" type="button">
                          <svg v-if="audioPlaying" viewBox="0 0 24 24" fill="currentColor" width="11" height="11"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                          <svg v-else viewBox="0 0 24 24" fill="currentColor" width="11" height="11"><path d="M8 5v14l11-7z"/></svg>
                        </button>
                        <div class="rp-inline-tl">
                          <span class="rp-itime">{{ formatAudioTime(audioCurrentTime) }}</span>
                          <input type="range" min="0" :max="audioDuration||100" :value="audioCurrentTime" @input="onSeek" class="rp-islider"/>
                          <span class="rp-itime">{{ formatAudioTime(audioDuration) }}</span>
                        </div>
                        <button class="rp-ib rp-ib-close" @click.prevent="closeAudio">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="9" height="9"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                      </div>
                      <button v-else-if="r.recording_id" class="rp-play-btn" @click.prevent="playInline(r)" title="Play recording">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M8 5v14l11-7z"/></svg>
                      </button>
                      <span v-else class="rp-empty-cell">—</span>
                    </div>
                  </td>
                  <td>
                    <div class="rp-date-cell">
                      <span class="rp-date-d">{{ formatDateMain(r.createdAt) }}</span>
                      <span class="rp-date-t">{{ formatDateTime(r.createdAt) }}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination Footer -->
          <div v-if="totalPages > 1" class="rp-pager-footer">
            <button class="rp-pager-btn" :disabled="page <= 1" @click="page--">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="11" height="11"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
              Prev
            </button>
            <div class="rp-pager-nums">
              <button v-for="p in pageNumbers" :key="p"
                class="rp-pager-num" :class="{ active: p === page }"
                @click="typeof p === 'number' && (page = p)">{{ p }}</button>
            </div>
            <button class="rp-pager-btn" :disabled="page >= totalPages" @click="page++">
              Next
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="11" height="11"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>

        <!-- Agent Performance Tab -->
        <div v-else-if="activeTab === 'agents'" class="rp-table-card rp-anim">
          <div class="rp-table-top">
            <div class="rp-table-top-left">
              <span class="rp-count-big">{{ agentPerformanceStats.length }}</span>
              <span class="rp-count-lbl">agent{{ agentPerformanceStats.length !== 1 ? 's' : '' }}</span>
            </div>
            <p class="rp-agent-sub">Performance metrics calculated across all filtered call records</p>
          </div>

          <div class="rp-table-wrap">
            <table class="rp-table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th style="text-align:center;">Extension</th>
                  <th style="text-align:center;">Opportunities</th>
                  <th style="text-align:center;">Answered</th>
                  <th style="text-align:center;">Missed</th>
                  <th style="text-align:center;">Busy</th>
                  <th style="text-align:center;min-width:180px;">Answer Rate</th>
                  <th style="text-align:center;">Avg Talk Time</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="agent in agentPerformanceStats" :key="agent.id" class="rp-tr">
                  <td>
                    <div class="rp-agent-cell">
                      <img v-if="agent.avatar" :src="agent.avatar" class="rp-agent-av"/>
                      <div v-else class="rp-agent-av rp-agent-av-ph">{{ agent.name.charAt(0) }}</div>
                      <div>
                        <div class="rp-agent-name">{{ agent.name }}</div>
                        <div class="rp-agent-sub-label">Ext {{ agent.extension }}</div>
                      </div>
                    </div>
                  </td>
                  <td style="text-align:center;">
                    <span class="rp-ext-badge">{{ agent.extension }}</span>
                  </td>
                  <td style="text-align:center;font-weight:800;font-size:15px;">{{ agent.attempts }}</td>
                  <td style="text-align:center;font-weight:700;color:var(--green);">{{ agent.answered }}</td>
                  <td style="text-align:center;font-weight:700;color:var(--red);">{{ agent.missed }}</td>
                  <td style="text-align:center;font-weight:700;color:var(--orange);">{{ agent.busy }}</td>
                  <td>
                    <div class="rp-perf-wrap">
                      <span class="rp-perf-pct"
                        :style="agent.answerRate >= 70 ? 'color:var(--green)' : agent.answerRate >= 40 ? 'color:var(--orange)' : 'color:var(--red)'">
                        {{ agent.answerRate }}%
                      </span>
                      <div class="rp-perf-track">
                        <div class="rp-perf-fill"
                          :style="`width:${agent.answerRate}%;background:${agent.answerRate >= 70 ? 'var(--green)' : agent.answerRate >= 40 ? 'var(--orange)' : 'var(--red)'};`"></div>
                      </div>
                    </div>
                  </td>
                  <td style="text-align:center;font-weight:600;color:var(--text2);">{{ formatDuration(agent.avgDuration) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
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

const dateFilter = ref('all')
const customStartDate = ref('')
const customEndDate = ref('')
const statusFilter = ref('')
const agentFilter = ref('')
const activeTab = ref('calls')

const activeAudioRowId = ref(null)
const audioRef = ref(null)
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
  activeAudioUrl.value = `${apiBase}/api/admin/widgets/${r.widgetId}/recordings/${r.recording_id}/listen?token=${encodeURIComponent(token)}`
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

onMounted(() => {
  if (!store.widgets.length) store.fetch()
  pollTimer = setInterval(async () => {
    if (!selectedId.value || loading.value) return
    const hasActive = report.value?.records?.some(r => ['Initiated','Ringing','Answered'].includes(r.status))
    if (hasActive) {
      try {
        const res = await axios.get(`/api/admin/widgets/${selectedId.value}/stats`)
        report.value = res.data
      } catch(e) { console.error('Stats poll failed:', e) }
    }
  }, 4000)
})
onUnmounted(() => { if (pollTimer) clearInterval(pollTimer) })

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

function resetFilters() {
  dateFilter.value = 'all'
  statusFilter.value = ''
  agentFilter.value = ''
  search.value = ''
  page.value = 1
}

const currentWidget = computed(() => store.widgets.find(w => w.id === selectedId.value))

function getAgentName(ext) {
  if (!currentWidget.value?.Agents) return ext
  const a = currentWidget.value.Agents.find(a => String(a.extension) === String(ext).trim())
  return a ? `${a.first_name} ${a.last_name || ''}`.trim() : ext
}

function parseCallFlow(agentExts, status) {
  if (!agentExts) return []
  return agentExts.split(',').map((extRaw, index, arr) => {
    const parts = extRaw.trim().split(':')
    const ext = parts[0]
    const extStatus = parts[1] || 'missed'
    const isLast = index === arr.length - 1
    const answered = extStatus === 'answered' || (isLast && ['Completed','Answered'].includes(status))
    const statusText = answered ? 'Answered' : extStatus === 'busy' ? 'Busy' : 'Missed'
    return { ext, name: getAgentName(ext), answered, statusText }
  })
}

const filteredRecords = computed(() => {
  if (!report.value) return []
  let r = report.value.records || []

  if (search.value) {
    const q = search.value.toLowerCase()
    r = r.filter(x =>
      x.customer_name?.toLowerCase().includes(q) ||
      x.customer_phone?.includes(q) ||
      x.agent_extension?.includes(q) ||
      x.page_url?.toLowerCase().includes(q) ||
      x.ip_address?.includes(q)
    )
  }
  if (statusFilter.value) {
    if (statusFilter.value === 'Failed') r = r.filter(x => ['Failed','Missed','Abandoned'].includes(x.status))
    else r = r.filter(x => x.status === statusFilter.value)
  }
  if (agentFilter.value) {
    r = r.filter(x => {
      if (!x.agent_extension) return false
      return x.agent_extension.split(',').map(e => e.trim().split(':')[0]).includes(String(agentFilter.value))
    })
  }
  if (dateFilter.value !== 'all') {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    r = r.filter(x => {
      const ts = new Date(x.createdAt).getTime()
      if (dateFilter.value === 'today') return ts >= startOfToday
      if (dateFilter.value === '7days') return ts >= Date.now() - 7*86400000
      if (dateFilter.value === '30days') return ts >= Date.now() - 30*86400000
      if (dateFilter.value === 'custom') {
        const start = customStartDate.value ? new Date(customStartDate.value).getTime() : 0
        const end = customEndDate.value ? new Date(customEndDate.value).getTime() + 86399999 : Infinity
        return ts >= start && ts <= end
      }
      return true
    })
  }
  return [...r].sort((a, b) => {
    let va = a[sortKey.value], vb = b[sortKey.value]
    if (sortKey.value === 'createdAt') { va = new Date(va); vb = new Date(vb) }
    if (va < vb) return sortDir.value === 'asc' ? -1 : 1
    if (va > vb) return sortDir.value === 'asc' ? 1 : -1
    return 0
  })
})

const filteredTotal = computed(() => filteredRecords.value.length)
const filteredCompleted = computed(() => filteredRecords.value.filter(x => ['Completed','Answered'].includes(x.status)).length)
const filteredInitiated = computed(() => filteredRecords.value.filter(x => ['Initiated','Ringing'].includes(x.status)).length)
const filteredFailed = computed(() => filteredRecords.value.filter(x => ['Failed','Missed','Abandoned'].includes(x.status)).length)
const answerRatePercentage = computed(() => filteredTotal.value ? Math.round((filteredCompleted.value/filteredTotal.value)*100) : 0)

const chartPeriodLabel = computed(() => {
  if (dateFilter.value === 'today') return 'Hourly calls today'
  if (dateFilter.value === '7days') return 'Daily calls over the last 7 days'
  if (dateFilter.value === '30days') return 'Daily calls over the last 30 days'
  if (dateFilter.value === 'custom') return 'Calls in selected range'
  return 'Last 7 days call volume'
})

function buildBezierPath(pts) {
  if (!pts.length) return { line: '', area: '' }
  let line = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const cpx = (pts[i-1].x + pts[i].x) / 2
    line += ` C ${cpx} ${pts[i-1].y} ${cpx} ${pts[i].y} ${pts[i].x} ${pts[i].y}`
  }
  return { line, area: `${line} L ${pts[pts.length-1].x} ${pts[pts.length-1].y > 0 ? wcd.value.h - wcd.value.py : wcd.value.h - wcd.value.py} L ${pts[0].x} ${wcd.value.h - wcd.value.py} Z` }
}

const wcd = computed(() => {
  const w = 560, h = 150, px = 44, py = 22
  const recs = filteredRecords.value
  const now = new Date()

  let intervals = []
  const use7 = dateFilter.value === 'all' || dateFilter.value === '7days' || dateFilter.value === 'today' || dateFilter.value === 'custom'
  const days = dateFilter.value === '30days' ? 30 : 7

  for (let i = days-1; i >= 0; i--) {
    const d = new Date(); d.setDate(now.getDate() - i)
    const ds = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    const showLabel = days <= 7 || i % 7 === 0 || i === 0
    intervals.push({ label: d.toLocaleDateString(undefined, { month:'short', day:'numeric' }), start: ds, end: ds + 86400000, showLabel })
  }

  const counts = intervals.map(iv => recs.filter(r => { const t = new Date(r.createdAt).getTime(); return t >= iv.start && t < iv.end }).length)
  const maxV = Math.max(1, ...counts)
  const innerW = w - px - 12
  const innerH = h - 2*py - 8

  const points = intervals.map((iv, i) => ({
    x: px + (i/(intervals.length-1||1))*innerW,
    y: h - py - (counts[i]/maxV)*innerH,
    count: counts[i],
    label: iv.label,
    showLabel: iv.showLabel
  }))

  let path = '', areaPath = ''
  if (points.length > 0) {
    path = `M ${points[0].x} ${points[0].y}`
    for (let i = 1; i < points.length; i++) {
      const cpx = (points[i-1].x + points[i].x) / 2
      path += ` C ${cpx} ${points[i-1].y} ${cpx} ${points[i].y} ${points[i].x} ${points[i].y}`
    }
    areaPath = `${path} L ${points[points.length-1].x} ${h-py} L ${points[0].x} ${h-py} Z`
  }

  return { w, h, px, py, points, path, areaPath }
})

const agentPerformanceStats = computed(() => {
  if (!currentWidget.value || !report.value) return []
  return (currentWidget.value.Agents || []).map(agent => {
    const extStr = String(agent.extension)
    let attempts=0, answered=0, missed=0, busy=0, totalDuration=0
    filteredRecords.value.forEach(r => {
      if (!r.agent_extension) return
      const flow = parseCallFlow(r.agent_extension, r.status)
      const step = flow.find(s => String(s.ext) === extStr)
      if (step) {
        attempts++
        if (step.answered) { answered++; totalDuration += (r.duration_seconds||0) }
        else if (step.statusText === 'Busy') busy++
        else missed++
      }
    })
    return {
      id: agent.id,
      name: `${agent.first_name} ${agent.last_name||''}`.trim(),
      extension: agent.extension,
      avatar: agent.avatar,
      attempts, answered, missed, busy,
      answerRate: attempts ? Math.round((answered/attempts)*100) : 0,
      avgDuration: answered ? Math.round(totalDuration/answered) : 0
    }
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRecords.value.length / perPage)))
const paginatedRecords = computed(() => filteredRecords.value.slice((page.value-1)*perPage, page.value*perPage))

const pageNumbers = computed(() => {
  const total = totalPages.value, cur = page.value, pages = []
  if (total <= 7) { for (let i=1;i<=total;i++) pages.push(i) }
  else {
    pages.push(1)
    if (cur > 3) pages.push('…')
    for (let i=Math.max(2,cur-1);i<=Math.min(total-1,cur+1);i++) pages.push(i)
    if (cur < total-2) pages.push('…')
    pages.push(total)
  }
  return pages
})

function sortBy(key) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'desc' }
  page.value = 1
}

function statusClass(s) {
  if (!s) return 'sb-neutral'
  if (['Completed','Answered'].includes(s)) return 'sb-green'
  if (['Failed','Missed','Abandoned'].includes(s)) return 'sb-red'
  if (s === 'Ringing') return 'sb-orange'
  return 'sb-blue'
}

function formatDuration(s) {
  if (!s) return '—'
  if (s < 60) return `${s}s`
  return `${Math.floor(s/60)}m ${s%60}s`
}

function formatDateMain(d) { return new Date(d).toLocaleDateString([], { month:'short', day:'numeric', year:'2-digit' }) }
function formatDateTime(d) { return new Date(d).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) }

function cleanUrl(url) {
  if (!url) return ''
  try { const p = new URL(url); return p.hostname + (p.pathname !== '/' ? p.pathname : '') }
  catch { return url }
}

function downloadCSV() {
  if (!filteredRecords.value.length) return
  const rows = [['Name','Phone','Ref URL','IP','Agent Call Flow','Duration','Status','Date & Time']]
  filteredRecords.value.forEach(r => {
    const flowStr = r.agent_extension
      ? parseCallFlow(r.agent_extension, r.status).map(f => `${f.name} (${f.statusText})`).join(' -> ')
      : ''
    rows.push([r.customer_name||'-', r.customer_phone||'-', r.page_url||'-', r.ip_address||'-', flowStr||'-', r.duration_seconds||'0', r.status||'Unknown', new Date(r.createdAt).toLocaleString()])
  })
  const csv = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')
  const link = document.createElement('a')
  link.setAttribute('href', encodeURI(csv))
  link.setAttribute('download', `3cx_report_${new Date().toISOString().slice(0,10)}.csv`)
  document.body.appendChild(link); link.click(); document.body.removeChild(link)
}
</script>

<style scoped>
/* ─── Base ─── */
.rp-page { padding: 24px 28px; display: flex; flex-direction: column; gap: 18px; min-height: 100%; }

/* ─── Header ─── */
.rp-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.rp-header-left { display: flex; align-items: center; gap: 14px; }
.rp-header-icon {
  width: 44px; height: 44px;
  background: linear-gradient(135deg, rgba(88,166,255,.18), rgba(188,140,255,.12));
  border: 1px solid rgba(88,166,255,.22); border-radius: 13px;
  display: flex; align-items: center; justify-content: center; color: var(--accent); flex-shrink: 0;
}
.rp-title { font-size: 21px; font-weight: 800; color: var(--text); line-height: 1.1; }
.rp-sub { font-size: 12.5px; color: var(--text2); margin-top: 2px; }
.rp-header-actions { display: flex; gap: 8px; align-items: center; }

.rp-btn-refresh {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 14px; background: var(--bg2); border: 1px solid var(--border);
  border-radius: 9px; color: var(--text2); font-size: 12.5px; font-weight: 600;
  cursor: pointer; transition: all .18s;
}
.rp-btn-refresh:hover { color: var(--text); border-color: var(--accent); background: var(--bg3); }
.rp-btn-refresh.spinning svg { animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.rp-btn-csv {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 16px; background: linear-gradient(135deg,#1f6feb,#388bfd);
  border: none; border-radius: 9px; color: #fff;
  font-size: 12.5px; font-weight: 600; cursor: pointer;
  box-shadow: 0 4px 14px rgba(56,139,253,.3); transition: all .18s;
}
.rp-btn-csv:hover:not(:disabled) { box-shadow: 0 6px 22px rgba(56,139,253,.5); transform: translateY(-1px); }
.rp-btn-csv:disabled { opacity: .4; cursor: not-allowed; transform: none; box-shadow: none; }

/* ─── Filter Bar ─── */
.rp-filter-bar {
  display: flex; flex-wrap: wrap; align-items: center; gap: 12px;
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: 13px; padding: 11px 18px;
}
.rp-filter-divider { width: 1px; height: 26px; background: var(--border); flex-shrink: 0; }
.rp-filter-item { display: flex; flex-direction: column; gap: 3px; min-width: 120px; }
.rp-filter-widget { min-width: 200px; }
.rp-filter-label {
  display: flex; align-items: center; gap: 4px;
  font-size: 9.5px; font-weight: 700; color: var(--text3);
  text-transform: uppercase; letter-spacing: .7px;
}
.rp-select {
  background: transparent; border: none;
  border-bottom: 1.5px solid var(--border);
  color: var(--text); font-size: 12.5px; font-weight: 500;
  font-family: inherit; padding: 2px 18px 2px 2px; outline: none;
  cursor: pointer; transition: border-color .18s; width: 100%;
}
select.rp-select {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23848d97' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat; background-position: right 2px center; background-size: 11px;
}
select.rp-select option { background-color: var(--bg2); color: var(--text); }
.rp-select:focus { border-bottom-color: var(--accent); }

.rp-clear-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 11px; background: rgba(248,81,73,.08);
  border: 1px solid rgba(248,81,73,.2); border-radius: 7px;
  color: var(--red); font-size: 11px; font-weight: 600;
  cursor: pointer; transition: all .15s; margin-left: auto;
}
.rp-clear-btn:hover { background: rgba(248,81,73,.15); }

/* ─── Empty / Loading ─── */
.rp-empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 14px; padding: 80px 20px; text-align: center;
}
.rp-empty-icon {
  width: 68px; height: 68px; background: var(--bg2);
  border: 1px solid var(--border); border-radius: 18px;
  display: flex; align-items: center; justify-content: center; color: var(--text3);
}
.rp-empty-title { font-size: 15px; font-weight: 700; color: var(--text); }
.rp-empty-sub { font-size: 12.5px; color: var(--text2); max-width: 300px; }
.rp-spinner {
  width: 30px; height: 30px;
  border: 3px solid var(--border); border-top-color: var(--accent);
  border-radius: 50%; animation: spin .65s linear infinite;
}

/* ─── Body ─── */
.rp-body { display: flex; flex-direction: column; gap: 18px; }

/* ─── KPI Cards ─── */
.rp-kpi-row { display: grid; grid-template-columns: repeat(5,1fr); gap: 14px; }
@media (max-width:1280px) { .rp-kpi-row { grid-template-columns: repeat(3,1fr); } }
@media (max-width:700px)  { .rp-kpi-row { grid-template-columns: 1fr 1fr; } }

.rp-kpi-card {
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: 14px; padding: 16px 18px;
  display: flex; flex-direction: column; gap: 6px;
  position: relative; overflow: hidden;
  transition: border-color .2s, box-shadow .2s, transform .2s;
}
.rp-kpi-card:hover { border-color: var(--bg4); box-shadow: 0 6px 24px rgba(0,0,0,.25); transform: translateY(-1px); }
.rp-kpi-rate-card { flex-direction: row; align-items: center; justify-content: space-between; }
.rp-kpi-rate-left { display: flex; flex-direction: column; gap: 6px; }
.rp-kpi-card-top { display: flex; align-items: center; justify-content: space-between; }
.rp-kpi-icon { width: 32px; height: 32px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.rp-kpi-badge { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 20px; }
.rp-kpi-num { font-size: 28px; font-weight: 800; line-height: 1.1; font-variant-numeric: tabular-nums; }
.rp-kpi-lbl { font-size: 10.5px; font-weight: 600; color: var(--text3); text-transform: uppercase; letter-spacing: .5px; }
.rp-kpi-bar { position: absolute; bottom: 0; left: 0; height: 2.5px; border-radius: 0 2px 0 0; transition: width .9s cubic-bezier(0.16,1,0.3,1); }

/* ─── Charts Row ─── */
.rp-charts-row { display: grid; grid-template-columns: 1fr 320px; gap: 16px; }
@media (max-width:900px) { .rp-charts-row { grid-template-columns: 1fr; } }

.rp-chart-card {
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: 14px; padding: 18px 20px;
  display: flex; flex-direction: column; gap: 14px;
  transition: border-color .2s, box-shadow .2s;
}
.rp-chart-card:hover { border-color: var(--bg4); box-shadow: 0 4px 22px rgba(0,0,0,.2); }
.rp-chart-hd { display: flex; align-items: center; justify-content: space-between; }
.rp-chart-title { display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 700; color: var(--text); }
.rp-title-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.rp-chart-sub { font-size: 11px; color: var(--text3); margin-top: 3px; padding-left: 15px; }
.rp-chart-pill { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; }
.rp-chart-body { width: 100%; }
.rp-chart-svg { width: 100%; height: auto; display: block; overflow: visible; }

/* Donut */
.rp-donut-row { display: flex; align-items: center; gap: 18px; flex: 1; }
.rp-donut-svg { width: 110px; height: 110px; display: block; flex-shrink: 0; }
.rp-donut-legend { display: flex; flex-direction: column; gap: 10px; flex: 1; }
.rp-lg-row { display: flex; align-items: center; gap: 8px; }
.rp-lg-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.rp-lg-name { font-size: 11.5px; color: var(--text2); flex: 1; }
.rp-lg-val { font-size: 13px; font-weight: 800; font-variant-numeric: tabular-nums; }

/* ─── Tabs ─── */
.rp-tabs-bar {
  display: flex; gap: 6px; padding: 5px;
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: 13px; align-items: center;
}
.rp-tab-btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 9px 18px; background: transparent; border: none;
  border-radius: 9px; color: var(--text3); font-size: 13px; font-weight: 700;
  cursor: pointer; transition: all .18s;
}
.rp-tab-btn:hover { color: var(--text2); background: var(--bg3); }
.rp-tab-btn.active { background: var(--bg); color: var(--accent); box-shadow: 0 2px 10px rgba(0,0,0,.2); }
.rp-tab-badge {
  background: var(--bg3); border: 1px solid var(--border);
  color: var(--text3); font-size: 10px; font-weight: 700;
  padding: 1px 6px; border-radius: 10px;
}
.rp-tab-btn.active .rp-tab-badge { background: rgba(88,166,255,.12); border-color: rgba(88,166,255,.2); color: var(--accent); }

/* ─── Table Card ─── */
.rp-table-card {
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: 14px; overflow: hidden;
}
.rp-anim { animation: fadeUp .25s ease-out both; }
@keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }

.rp-table-top {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; padding: 16px 20px;
  border-bottom: 1px solid var(--border); flex-wrap: wrap;
}
.rp-table-top-left { display: flex; align-items: baseline; gap: 7px; }
.rp-count-big { font-size: 22px; font-weight: 800; color: var(--text); font-variant-numeric: tabular-nums; }
.rp-count-lbl { font-size: 13px; color: var(--text2); font-weight: 500; }
.rp-count-filt { font-size: 11.5px; color: var(--text3); }
.rp-agent-sub { font-size: 12px; color: var(--text3); }
.rp-table-top-right { display: flex; align-items: center; gap: 10px; }

.rp-search-wrap {
  display: flex; align-items: center; gap: 7px;
  background: var(--bg3); border: 1px solid var(--border);
  border-radius: 9px; padding: 7px 12px; transition: border-color .18s;
}
.rp-search-wrap:focus-within { border-color: var(--accent); }
.rp-search-input {
  background: transparent; border: none; outline: none;
  color: var(--text); font-size: 12.5px; font-family: inherit; width: 220px;
}
.rp-search-input::placeholder { color: var(--text3); }

/* ─── Pagination ─── */
.rp-pager { display: flex; align-items: center; gap: 6px; }
.rp-pager-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 10px; background: var(--bg2); border: 1px solid var(--border);
  border-radius: 7px; color: var(--text2); font-size: 11.5px; font-weight: 600;
  cursor: pointer; transition: all .15s;
}
.rp-pager-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--text); }
.rp-pager-btn:disabled { opacity: .4; cursor: not-allowed; }
.rp-pager-info { font-size: 12px; color: var(--text2); font-weight: 600; }

.rp-pager-footer {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 12px; border-top: 1px solid var(--border);
}
.rp-pager-nums { display: flex; gap: 5px; }
.rp-pager-num {
  min-width: 32px; height: 32px; padding: 0 4px;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg3); border: 1px solid var(--border);
  border-radius: 7px; color: var(--text2); font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all .15s;
}
.rp-pager-num:hover { border-color: var(--accent); color: var(--accent); }
.rp-pager-num.active { background: var(--accent); border-color: var(--accent); color: #fff; box-shadow: 0 2px 10px rgba(88,166,255,.35); }

/* ─── Table ─── */
.rp-table-wrap { overflow-x: auto; }
.rp-table { width: 100%; border-collapse: collapse; }
.rp-table thead tr { background: var(--bg3); }
.rp-table thead th {
  padding: 11px 16px; text-align: left;
  font-size: 10.5px; font-weight: 700; color: var(--text3);
  text-transform: uppercase; letter-spacing: .6px;
  border-bottom: 1px solid var(--border); white-space: nowrap;
}
.rp-th-sort { cursor: pointer; user-select: none; transition: color .15s; }
.rp-th-sort:hover { color: var(--text); }
.rp-sort { margin-left: 4px; opacity: .6; }

.rp-tr { border-bottom: 1px solid var(--border); transition: background .12s; }
.rp-tr:last-child { border-bottom: none; }
.rp-tr:hover { background: var(--bg3); }
.rp-table tbody td { padding: 11px 16px; font-size: 12.5px; color: var(--text); vertical-align: middle; }

.rp-name-cell { display: flex; align-items: center; gap: 9px; }
.rp-name-av {
  width: 30px; height: 30px; border-radius: 9px; flex-shrink: 0;
  background: linear-gradient(135deg,rgba(88,166,255,.18),rgba(188,140,255,.12));
  border: 1px solid rgba(88,166,255,.2);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; color: var(--accent);
}
.rp-name-text { font-weight: 600; font-size: 12.5px; white-space: nowrap; }
.rp-phone { font-family: monospace; font-size: 12px; background: var(--bg3); padding: 2px 7px; border-radius: 5px; border: 1px solid var(--border); }
.rp-ip { font-family: monospace; font-size: 11px; background: var(--bg3); padding: 2px 6px; border-radius: 5px; border: 1px solid var(--border); }
.rp-empty-cell { color: var(--text3); }

.rp-url-link {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11.5px; color: var(--accent); max-width: 160px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  text-decoration: underline; text-underline-offset: 2px;
}
.rp-url-link:hover { color: #79c0ff; }

/* Call Flow */
.rp-flow-wrap { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }
.rp-flow-step { display: flex; align-items: center; gap: 4px; }
.rp-flow-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 7px; border-radius: 6px; font-size: 10.5px; font-weight: 600;
  white-space: nowrap;
}
.fbg-green { background: rgba(63,185,80,.1); border: 1px solid rgba(63,185,80,.25); color: var(--green); }
.fbg-red   { background: rgba(248,81,73,.08); border: 1px dashed rgba(248,81,73,.25); color: var(--red); }
.fbg-orange{ background: rgba(240,136,62,.08); border: 1px dashed rgba(240,136,62,.25); color: var(--orange); }
.rp-flow-name { font-weight: 600; }
.rp-flow-ext  { opacity: .7; font-size: 9.5px; }

/* Duration */
.rp-dur-cell {
  display: inline-flex; align-items: center; gap: 5px;
  font-variant-numeric: tabular-nums; color: var(--text2);
}

/* Status Badge */
.rp-badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 9px; border-radius: 20px; font-size: 11.5px; font-weight: 600;
}
.rp-badge-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
.sb-green  { background: rgba(63,185,80,.1);  color: var(--green);  border: 1px solid rgba(63,185,80,.2);  }
.sb-green .rp-badge-dot  { background: var(--green);  box-shadow: 0 0 0 2px rgba(63,185,80,.2); }
.sb-red    { background: rgba(248,81,73,.1);  color: var(--red);    border: 1px solid rgba(248,81,73,.2);  }
.sb-red .rp-badge-dot    { background: var(--red); }
.sb-orange { background: rgba(240,136,62,.1); color: var(--orange); border: 1px solid rgba(240,136,62,.2); }
.sb-orange .rp-badge-dot { background: var(--orange); }
.sb-blue   { background: rgba(88,166,255,.1); color: var(--accent); border: 1px solid rgba(88,166,255,.2); }
.sb-blue .rp-badge-dot   { background: var(--accent); }
.sb-neutral{ background: var(--bg3); color: var(--text2); border: 1px solid var(--border); }

/* Recording */
.rp-rec-cell { display: flex; align-items: center; justify-content: center; }
.rp-play-btn {
  width: 28px; height: 28px; border-radius: 50%;
  background: rgba(88,166,255,.12); border: 1px solid rgba(88,166,255,.25);
  color: var(--accent); cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: all .15s;
}
.rp-play-btn:hover { background: rgba(88,166,255,.22); box-shadow: 0 0 0 3px rgba(88,166,255,.15); transform: scale(1.05); }

.rp-inline-player {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--bg4); border: 1px solid var(--border);
  padding: 4px 8px; border-radius: 24px; min-width: 180px; max-width: 220px;
}
.rp-ib {
  background: transparent; border: none; color: var(--text);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  width: 20px; height: 20px; border-radius: 50%; transition: background .12s; padding: 0;
}
.rp-ib:hover { background: rgba(255,255,255,.1); }
.rp-ib-close { color: var(--text3); }
.rp-inline-tl { display: flex; align-items: center; gap: 4px; flex: 1; overflow: hidden; }
.rp-itime { font-size: 9px; color: var(--text2); font-family: monospace; flex-shrink: 0; }
.rp-islider {
  flex: 1; height: 3px; background: var(--border); border-radius: 2px;
  appearance: none; outline: none; cursor: pointer; min-width: 30px;
}
.rp-islider::-webkit-slider-thumb { appearance: none; width: 9px; height: 9px; background: var(--accent); border-radius: 50%; }

/* Date Cell */
.rp-date-cell { display: flex; flex-direction: column; gap: 1px; }
.rp-date-d { font-weight: 600; font-size: 12px; white-space: nowrap; }
.rp-date-t { font-size: 10.5px; color: var(--text3); }

/* No Results */
.rp-no-results {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; padding: 60px 20px; color: var(--text3); text-align: center;
}
.rp-no-results p { font-size: 13px; color: var(--text2); }
.rp-btn-ghost {
  padding: 6px 16px; background: var(--bg3); border: 1px solid var(--border);
  border-radius: 8px; color: var(--text2); font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all .18s;
}
.rp-btn-ghost:hover { color: var(--text); border-color: var(--accent); }

/* ─── Agent Performance ─── */
.rp-agent-cell { display: flex; align-items: center; gap: 11px; }
.rp-agent-av {
  width: 34px; height: 34px; border-radius: 10px;
  object-fit: cover; border: 1.5px solid var(--border); flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.rp-agent-av-ph {
  background: linear-gradient(135deg,rgba(88,166,255,.18),rgba(188,140,255,.12));
  border: 1px solid rgba(88,166,255,.2);
  font-size: 13px; font-weight: 700; color: var(--accent);
}
.rp-agent-name { font-size: 13px; font-weight: 700; color: var(--text); }
.rp-agent-sub-label { font-size: 10.5px; color: var(--text3); margin-top: 1px; }
.rp-ext-badge {
  display: inline-block; padding: 3px 9px; border-radius: 6px;
  font-size: 11px; font-weight: 600;
  background: rgba(31,111,235,.08); border: 1px dashed rgba(31,111,235,.3); color: #388bfd;
}
.rp-perf-wrap { display: flex; align-items: center; gap: 10px; padding: 0 8px; }
.rp-perf-pct { font-size: 12px; font-weight: 700; min-width: 38px; }
.rp-perf-track { flex: 1; height: 6px; background: var(--bg4); border-radius: 3px; overflow: hidden; }
.rp-perf-fill { height: 100%; border-radius: 3px; transition: width .7s cubic-bezier(0.16,1,0.3,1); }
</style>
