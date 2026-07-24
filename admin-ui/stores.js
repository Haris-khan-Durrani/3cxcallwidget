import axios from 'axios'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({ token: localStorage.getItem('admin_token') || null }),
  actions: {
    async login(username, password) {
      const res = await axios.post('/api/admin/login', { username, password })
      if (res.data.token) {
        this.token = res.data.token
        localStorage.setItem('admin_token', this.token)
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
      }
      return res.data
    },
    async verify2fa(userId, code) {
      const res = await axios.post('/api/admin/verify-2fa', { userId, code })
      this.token = res.data.token
      localStorage.setItem('admin_token', this.token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
      return res.data
    },
    logout() {
      this.token = null
      localStorage.removeItem('admin_token')
      delete axios.defaults.headers.common['Authorization']
    }
  }
})

export const useWidgetStore = defineStore('widgets', {
  state: () => ({ widgets: [], loading: false }),
  actions: {
    async fetch() {
      this.loading = true
      try {
        const res = await axios.get('/api/admin/widgets')
        this.widgets = res.data
      } catch (err) {
        console.error('Failed to fetch widgets:', err)
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('admin_token')
          delete axios.defaults.headers.common['Authorization']
          window.location.hash = '/login'
        }
      } finally {
        this.loading = false
      }
    },
    async create(payload) {
      const res = await axios.post('/api/admin/widgets', payload)
      await this.fetch()
      return res.data
    },
    async update(id, payload) {
      const res = await axios.put(`/api/admin/widgets/${id}`, payload)
      await this.fetch()
      return res.data
    },
    async delete(id) {
      await axios.delete(`/api/admin/widgets/${id}`)
      await this.fetch()
    },
    async clone(id) {
      const res = await axios.post(`/api/admin/widgets/${id}/clone`)
      await this.fetch()
      return res.data
    },
    async addAgent(widgetId, payload) {
      await axios.post(`/api/admin/widgets/${widgetId}/agents`, payload)
      await this.fetch()
    },
    async updateAgent(agentId, payload) {
      await axios.put(`/api/admin/agents/${agentId}`, payload)
      await this.fetch()
    },
    async deleteAgent(agentId) {
      await axios.delete(`/api/admin/agents/${agentId}`)
      await this.fetch()
    },
    getById(id) {
      return this.widgets.find(w => w.id === id)
    }
  }
})

export const useDialerStore = defineStore('dialers', {
  state: () => ({ dialers: [], loading: false }),
  actions: {
    async fetch() {
      this.loading = true
      try {
        const res = await axios.get('/api/admin/dialers')
        this.dialers = res.data
      } catch (err) {
        console.error('Failed to fetch dialers:', err)
      } finally {
        this.loading = false
      }
    },
    async create(payload) {
      const res = await axios.post('/api/admin/dialers', payload)
      await this.fetch()
      return res.data
    },
    async update(id, payload) {
      const res = await axios.put(`/api/admin/dialers/${id}`, payload)
      await this.fetch()
      return res.data
    },
    async delete(id) {
      await axios.delete(`/api/admin/dialers/${id}`)
      await this.fetch()
    }
  }
})
