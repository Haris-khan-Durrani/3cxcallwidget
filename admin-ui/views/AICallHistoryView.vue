<template>
  <AppLayout>
    <div class="page">
      <div class="page-header animate-fade-in">
        <div>
          <div class="title-row">
            <h2>AI Call History</h2>
          </div>
          <p class="page-sub">Review completed calls, transcripts, and granular AI token costs.</p>
        </div>
      </div>

      <div v-if="loading" class="empty">
        <div class="spinner"></div>
        <p>Loading history...</p>
      </div>

      <div v-else-if="!history.length" class="empty animate-fade-in-up">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
        <h3>No calls found</h3>
        <p>Trigger an outbound AI call to see history appear here.</p>
      </div>

      <div v-else class="table-container animate-fade-in-up">
        <table class="data-table">
          <thead>
            <tr>
              <th>Destination</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Total Cost</th>
              <th>Date</th>
              <th class="text-right">Details</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in history" :key="h.id">
              <td class="font-bold">{{ h.destination }}</td>
              <td>
                <span class="badge" :class="statusClass(h.status)">
                  {{ h.status }}
                </span>
              </td>
              <td>{{ h.duration_seconds ? `${h.duration_seconds}s` : '-' }}</td>
              <td>{{ h.total_cost ? `$${h.total_cost.toFixed(4)}` : '-' }}</td>
              <td class="text-muted">{{ new Date(h.createdAt).toLocaleString() }}</td>
              <td class="text-right">
                <button class="btn btn-sm btn-ghost" @click="viewDetails(h)">View</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import AppLayout from '../components/AppLayout.vue'

const history = ref([])
const loading = ref(true)

const fetchHistory = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:3005/api/ai-calls/history')
    history.value = res.data
  } catch (err) {
    console.error('Failed to load history:', err)
  } finally {
    loading.value = false
  }
}

const statusClass = (status) => {
  if (!status) return 'badge-outline'
  const s = status.toUpperCase()
  if (s === 'COMPLETED') return 'highlight-green'
  if (s === 'FAILED') return 'badge-error'
  if (s === 'INITIATED' || s === 'RINGING') return 'highlight-blue'
  return 'badge-outline'
}

const viewDetails = (record) => {
  alert(`Transcript:\n${JSON.stringify(record.transcript || 'No transcript')}`)
}

onMounted(fetchHistory)
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
.highlight-green {
  background: rgba(63,185,80,.15); color: var(--green); border: 1px solid rgba(63,185,80,.2);
  padding: 2px 9px; border-radius: 20px; font-size: 11px; font-weight: 600;
}
.highlight-blue {
  background: rgba(88,166,255,.12); color: var(--accent); border: 1px solid rgba(88,166,255,.2);
  padding: 2px 9px; border-radius: 20px; font-size: 11px; font-weight: 600;
}
.badge-error {
  background: rgba(248,81,73,.12); color: var(--red); border: 1px solid rgba(248,81,73,.2);
  padding: 2px 9px; border-radius: 20px; font-size: 11px; font-weight: 600;
}
.badge-outline {
  background: transparent; color: var(--text2); border: 1px solid var(--border);
  padding: 2px 9px; border-radius: 20px; font-size: 11px; font-weight: 600;
}
</style>
