<template>
  <AppLayout>
    <div class="page animate-fade-in">
      <div class="page-header">
        <div>
          <div class="title-row">
            <h2>System Users</h2>
            <span class="count-badge">{{ users.length }}</span>
          </div>
          <p class="page-sub">Manage administrator accounts and access permissions for the call connect platform.</p>
        </div>
        <button class="btn btn-primary new-user-btn" @click="openCreateModal">
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          New User
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="empty">
        <div class="spinner"></div>
        <p>Loading system users...</p>
      </div>

      <!-- Users Table -->
      <div v-else class="users-container">
        <div class="dr-table-wrap">
          <table class="dr-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>2-Step Verification</th>
                <th>Role</th>
                <th>Created At</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in users" :key="u.id" class="dr-table-row">
                <td class="user-name-cell">
                  <span class="user-icon">👤</span>
                  <span class="user-username">{{ u.username }}</span>
                </td>
                <td class="date-cell">
                  {{ u.email || '—' }}
                </td>
                <td>
                  <span class="badge" :class="u.two_factor_enabled ? 'badge-green' : 'badge-red'">
                    {{ u.two_factor_enabled ? 'Active (Email)' : 'Disabled' }}
                  </span>
                </td>
                <td>
                  <span class="badge" :class="u.role === 'admin' ? 'badge-blue' : 'badge-orange'">
                    {{ u.role.toUpperCase() }}
                  </span>
                </td>
                <td class="date-cell">
                  {{ formatDate(u.createdAt) }}
                </td>
                <td style="text-align: right;">
                  <div class="actions-group">
                    <button class="btn btn-sm btn-ghost" @click="openEditModal(u)">
                      Edit
                    </button>
                    <button class="btn btn-sm btn-ghost" @click="openResetModal(u)">
                      Reset Password
                    </button>
                    <button 
                      class="btn btn-sm btn-danger" 
                      :disabled="users.length <= 1"
                      @click="deleteUser(u)"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Edit User Modal -->
      <div v-if="showEditModal" class="modal-backdrop" @click.self="showEditModal = false">
        <div class="modal-box card animate-slide-up" @click.stop>
          <div class="modal-header">
            <h3>Edit System User</h3>
            <button class="btn btn-icon btn-ghost close-modal" @click="showEditModal = false">❌</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Username</label>
              <input type="text" v-model="editUser.username" class="input" placeholder="e.g. jsmith" />
            </div>
            <div class="form-group">
              <label class="form-label">Email Address (Optional)</label>
              <input type="email" v-model="editUser.email" class="input" placeholder="e.g. user@domain.com" />
            </div>
            <div class="form-group">
              <label class="form-label">Role</label>
              <select v-model="editUser.role" class="input">
                <option value="admin">Administrator</option>
                <option value="agent">Agent / Regular User</option>
              </select>
            </div>
            <div class="form-group toggle-wrap">
              <div>
                <span class="toggle-label-text">2-Step Verification</span>
                <p class="toggle-sub" :style="!editUser.email ? 'color: var(--red)' : ''">
                  {{ !editUser.email ? '⚠️ Requires email address to enable.' : 'Require email OTP code when signing in.' }}
                </p>
              </div>
              <label class="toggle">
                <input type="checkbox" v-model="editUser.two_factor_enabled" :disabled="!editUser.email" />
                <span class="toggle-track"></span>
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="showEditModal = false">Cancel</button>
            <button class="btn btn-primary" :disabled="!editUser.username" @click="updateUser">Save Changes</button>
          </div>
        </div>
      </div>

      <!-- Create User Modal -->
      <div v-if="showCreateModal" class="modal-backdrop" @click.self="showCreateModal = false">
        <div class="modal-box card animate-slide-up" @click.stop>
          <div class="modal-header">
            <h3>Create System User</h3>
            <button class="btn btn-icon btn-ghost close-modal" @click="showCreateModal = false">❌</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Username</label>
              <input type="text" v-model="newUser.username" class="input" placeholder="e.g. jsmith" />
            </div>
            <div class="form-group">
              <label class="form-label">Email Address (Optional)</label>
              <input type="email" v-model="newUser.email" class="input" placeholder="e.g. user@domain.com" />
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" v-model="newUser.password" class="input" placeholder="••••••••" />
            </div>
            <div class="form-group">
              <label class="form-label">Role</label>
              <select v-model="newUser.role" class="input">
                <option value="admin">Administrator</option>
                <option value="agent">Agent / Regular User</option>
              </select>
            </div>
            <div class="form-group toggle-wrap">
              <div>
                <span class="toggle-label-text">2-Step Verification</span>
                <p class="toggle-sub" :style="!newUser.email ? 'color: var(--red)' : ''">
                  {{ !newUser.email ? '⚠️ Requires email address to enable.' : 'Require email OTP code when signing in.' }}
                </p>
              </div>
              <label class="toggle">
                <input type="checkbox" v-model="newUser.two_factor_enabled" :disabled="!newUser.email" />
                <span class="toggle-track"></span>
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="showCreateModal = false">Cancel</button>
            <button class="btn btn-primary" :disabled="!newUser.username || !newUser.password" @click="createUser">Create User</button>
          </div>
        </div>
      </div>

      <!-- Reset Password Modal -->
      <div v-if="showResetModal" class="modal-backdrop" @click.self="showResetModal = false">
        <div class="modal-box card animate-slide-up" @click.stop>
          <div class="modal-header">
            <h3>Reset Password: {{ activeUser?.username }}</h3>
            <button class="btn btn-icon btn-ghost close-modal" @click="showResetModal = false">❌</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">New Password</label>
              <input type="password" v-model="resetPasswordVal" class="input" placeholder="••••••••" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="showResetModal = false">Cancel</button>
            <button class="btn btn-accent" :disabled="!resetPasswordVal" @click="resetPassword">Reset Password</button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, onMounted, inject } from 'vue'
import axios from 'axios'
import AppLayout from '../components/AppLayout.vue'

const toast = inject('toast')
const users = ref([])
const loading = ref(false)

const showCreateModal = ref(false)
const newUser = reactive({ username: '', email: '', password: '', role: 'admin', two_factor_enabled: false })

const showEditModal = ref(false)
const editUser = reactive({ id: '', username: '', email: '', role: 'admin', two_factor_enabled: false })

const showResetModal = ref(false)
const activeUser = ref(null)
const resetPasswordVal = ref('')

onMounted(() => {
  fetchUsers()
})

async function fetchUsers() {
  loading.value = true
  try {
    const res = await axios.get('/api/admin/users')
    users.value = res.data
  } catch (err) {
    toast(err.response?.data?.error || 'Failed to fetch users', 'error')
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  newUser.username = ''
  newUser.email = ''
  newUser.password = ''
  newUser.role = 'admin'
  newUser.two_factor_enabled = false
  showCreateModal.value = true
}

async function createUser() {
  try {
    await axios.post('/api/admin/users', newUser)
    toast('User created successfully', 'success')
    showCreateModal.value = false
    fetchUsers()
  } catch (err) {
    toast(err.response?.data?.error || 'Failed to create user', 'error')
  }
}

function openEditModal(user) {
  editUser.id = user.id
  editUser.username = user.username
  editUser.email = user.email || ''
  editUser.role = user.role
  editUser.two_factor_enabled = !!user.two_factor_enabled
  showEditModal.value = true
}

async function updateUser() {
  try {
    await axios.put(`/api/admin/users/${editUser.id}`, {
      username: editUser.username,
      email: editUser.email,
      role: editUser.role,
      two_factor_enabled: editUser.two_factor_enabled
    })
    toast('User details updated successfully', 'success')
    showEditModal.value = false
    fetchUsers()
  } catch (err) {
    toast(err.response?.data?.error || 'Failed to update user', 'error')
  }
}

function openResetModal(user) {
  activeUser.value = user
  resetPasswordVal.value = ''
  showResetModal.value = true
}

async function resetPassword() {
  try {
    await axios.put(`/api/admin/users/${activeUser.value.id}`, { password: resetPasswordVal.value })
    toast(`Password reset for ${activeUser.value.username} successfully`, 'success')
    showResetModal.value = false
  } catch (err) {
    toast(err.response?.data?.error || 'Failed to reset password', 'error')
  }
}

async function deleteUser(user) {
  if (!confirm(`Are you sure you want to delete user "${user.username}"?`)) return
  try {
    await axios.delete(`/api/admin/users/${user.id}`)
    toast('User deleted successfully', 'success')
    fetchUsers()
  } catch (err) {
    toast(err.response?.data?.error || 'Failed to delete user', 'error')
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.page {
  padding: 30px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.count-badge {
  background: var(--border);
  color: var(--text2);
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
}
.page-sub {
  font-size: 13px;
  color: var(--text2);
  margin-top: 4px;
}
.user-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.user-icon {
  font-size: 16px;
}
.user-username {
  font-weight: 600;
  color: var(--text);
}
.actions-group {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.date-cell {
  color: var(--text2);
}

/* Modals */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.65);
  backdrop-filter: blur(4px);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.modal-box {
  width: 100%;
  max-width: 440px;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 24px 8px;
}
.modal-header h3 {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.3px;
}
.modal-body {
  padding: 16px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 0 24px 24px;
  border-top: 1px solid rgba(128,128,128,0.1);
  padding-top: 16px;
}
.close-modal {
  padding: 4px 8px;
  font-size: 12px;
}

/* Table styling (copied and adapted from Reports) */
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

/* Spinner styling */
.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 10px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
