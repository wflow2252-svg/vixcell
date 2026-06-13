import axios from 'axios'

// Config is injected by Electron preload.js (window.electronAPI)
// In browser-only dev mode without Electron, fall back to localhost
export const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'X-Vixcell-Internal-Key': 'vixcell_secret_dev_key',
  },
})

// Resolve Electron-provided config (random port + internal key) BEFORE any
// request leaves — otherwise early requests race ahead with dev defaults
// and get rejected by the backend's internal-key middleware.
const configReady: Promise<void> = (async () => {
  const eAPI = typeof window !== 'undefined' ? (window as any).electronAPI : null
  if (!eAPI) return
  try {
    const cfg = await eAPI.getConfig()
    api.defaults.baseURL = cfg.apiBase
    api.defaults.headers.common['X-Vixcell-Internal-Key'] = cfg.internalKey
  } catch {
    // Electron bridge unavailable — keep browser dev defaults
  }
})()

// Request interceptor — wait for config, then attach JWT token if available
api.interceptors.request.use(async (config) => {
  await configReady
  config.baseURL = api.defaults.baseURL
  // Electron overrides land in defaults.headers.common; in plain-browser dev
  // the create()-level header already applies, so only override when set.
  const internalKey = api.defaults.headers.common['X-Vixcell-Internal-Key']
  if (internalKey) config.headers['X-Vixcell-Internal-Key'] = internalKey as string
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor — on 401 clear the stale session and restart the
// app shell; init() then auto-logs the admin back in (no login screen).
// hash+reload (not href='/login') keeps packaged file:// builds working.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      if (!window.location.hash.startsWith('#/bar')) {
        window.location.hash = '#/'
        window.location.reload()
      }
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  wizardStatus: () => api.get('/auth/wizard/status'),
  wizardSetup: (data: { company_name: string; admin_name: string; admin_email: string; admin_password: string }) =>
    api.post('/auth/wizard/setup', data),
  login: (email: string, password: string) =>
    api.post('/auth/login/json', { email, password }),
  autoLogin: () => api.post('/auth/auto-login'),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refresh_token_in: refreshToken }),
  me: () => api.get('/auth/me'),
}

// ── Tenants ───────────────────────────────────────────────────────────────────
export const tenantsAPI = {
  list: () => api.get('/tenants/'),
  get: (id: string) => api.get(`/tenants/${id}`),
  create: (data: any) => api.post('/tenants/', data),
  update: (id: string, data: any) => api.put(`/tenants/${id}`, data),
  delete: (id: string) => api.delete(`/tenants/${id}`),
}

// ── Settings ──────────────────────────────────────────────────────────────────
export const settingsAPI = {
  getPaths: () => api.get('/settings/paths'),
  updatePaths: (data: any) => api.put('/settings/paths', data),
  backup: () => api.post('/settings/backup'),
  integrations: () => api.get('/settings/integrations'),
  updateIntegration: (provider: string, data: { enabled: boolean; config: Record<string, any> }) =>
    api.put(`/settings/integrations/${provider}`, data),
  voiceSettings: () => api.get('/settings/voice'),
  updateVoiceSettings: (whisper_model: string) => api.put('/settings/voice', { whisper_model }),
}

// ── Leads ─────────────────────────────────────────────────────────────────────
export const leadsAPI = {
  list: (params?: { search?: string; status?: string; category?: string; page?: number; page_size?: number }) =>
    api.get('/leads/', { params }),
  stats: () => api.get('/leads/stats'),
  create: (data: any) => api.post('/leads/', data),
  update: (id: string, data: any) => api.put(`/leads/${id}`, data),
  delete: (id: string) => api.delete(`/leads/${id}`),
  exportCsv: () => api.get('/leads/export/csv', { responseType: 'blob' }),
  discover: (data: { what: string; where: string; limit?: number }) =>
    api.post('/leads/discover', data, { timeout: 60000 }),
  discoverImport: (items: any[], source = 'OpenStreetMap') =>
    api.post('/leads/discover/import', { items, source }),
}

// ── CRM ───────────────────────────────────────────────────────────────────────
export const crmAPI = {
  deals: (stage?: string) => api.get('/crm/deals', { params: stage ? { stage } : undefined }),
  pipeline: () => api.get('/crm/pipeline'),
  createDeal: (data: any) => api.post('/crm/deals', data),
  updateDeal: (id: string, data: any) => api.put(`/crm/deals/${id}`, data),
  deleteDeal: (id: string) => api.delete(`/crm/deals/${id}`),
  activities: (params?: { deal_id?: string; lead_id?: string }) => api.get('/crm/activities', { params }),
  createActivity: (data: any) => api.post('/crm/activities', data),
  completeActivity: (id: string) => api.put(`/crm/activities/${id}/complete`),
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  stats: () => api.get('/dashboard/stats'),
}

// ── Voice AI ──────────────────────────────────────────────────────────────────
export const voiceAPI = {
  status: () => api.get('/voice/status'),
  transcribe: (blob: Blob) => {
    const form = new FormData()
    form.append('audio', blob, 'clip.webm')
    return api.post('/voice/transcribe', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000, // first call downloads the Whisper model
    })
  },
  command: (text: string) => api.post('/voice/command', { text }, { timeout: 90000 }),
  speak: (text: string, opts?: { gender?: string; language?: string }) =>
    api.post('/voice/speak', { text, ...opts }, { responseType: 'arraybuffer', timeout: 30000 }),
}

// ── System Control (open apps / sites / folders on the machine) ──────────────
export const systemAPI = {
  apps: (q?: string) => api.get('/system/apps', { params: q ? { q } : undefined }),
  open: (kind: 'app' | 'url' | 'folder' | 'search', target: string) =>
    api.post('/system/open', { kind, target }),
  info: () => api.get('/system/info'),
  infoSpeak: (topic = 'overview') => api.get('/system/info/speak', { params: { topic } }),
}

// ── Website bridge (vixcell.com tasks / projects / meeting) ──────────────────
export const websiteAPI = {
  status: () => api.get('/website/status'),
  meetingUrl: (role = 'admin') => api.get('/website/meeting', { params: { role } }),
  tasks: (status?: string) => api.get('/website/tasks', { params: status ? { status } : undefined }),
  taskStats: () => api.get('/website/tasks/stats'),
  projects: () => api.get('/website/projects'),
  updateTask: (id: string | number, data: any) => api.put(`/website/tasks/${id}`, data),
}

// ── WhatsApp (deep-link send) ────────────────────────────────────────────────
export const whatsappAPI = {
  send: (to: string, text: string, sent_by: 'user' | 'ai' = 'user') =>
    api.post('/whatsapp/send', { to, text, sent_by }),
  resolve: (q: string) => api.get('/whatsapp/resolve', { params: { q } }),
  history: (contact_id?: string) => api.get('/whatsapp/history', { params: contact_id ? { contact_id } : undefined }),
}

// ── Assistant memory ──────────────────────────────────────────────────────────
export const memoryAPI = {
  list: () => api.get('/memory/'),
  add: (content: string) => api.post('/memory/', { content, source: 'manual' }),
  delete: (id: string) => api.delete(`/memory/${id}`),
}

// ── AI Engine ─────────────────────────────────────────────────────────────────
export const aiAPI = {
  status: () => api.get('/ai/status'),
  models: () => api.get('/ai/models'),
  pull: (name: string) => api.post('/ai/models/pull', { name }),
  pullProgress: (name: string) => api.get(`/ai/models/pull/${name}/progress`),
  deleteModel: (name: string) => api.delete(`/ai/models/${name}`),
  generate: (data: { model: string; prompt: string; system?: string; temperature?: number }) =>
    api.post('/ai/generate', data),
  content: (data: { model: string; content_type: string; topic: string; language?: string; tone?: string; extra?: string }) =>
    api.post('/ai/content', data),
}
