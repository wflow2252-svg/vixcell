// ─── VIXCELL AI — Session Memory & Context Tracking ─────────────────
// Tracks conversation history, user preferences, project state,
// and detected entities across multiple turns.

const STORAGE_KEY = 'vixcell_ai_sessions_v2'
const MAX_HISTORY = 20

const sessions = {}

// Try to restore from localStorage on init
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) Object.assign(sessions, JSON.parse(saved))
  }
} catch {}

function persist() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
    }
  } catch {}
}

export function getSession(id) {
  if (!sessions[id]) {
    sessions[id] = {
      id,
      createdAt: Date.now(),
      stage: 'start',           // start | collecting | building | exploring
      context: {
        projectName: '',
        businessType: '',
        primary: '#6366f1',
        logo: null,
        lastTopic: '',
        userLanguage: '',       // 'ar' | 'en' | ''
        userName: '',
      },
      history: [],              // last N turns: { role, text, intent, ts }
      generatedFiles: null,
      lastIntent: '',
      counters: { totalTurns: 0, sitesBuilt: 0, codeAnalyzed: 0 },
    }
  }
  return sessions[id]
}

export function addTurn(id, role, text, intent = '') {
  const s = getSession(id)
  s.history.push({ role, text: text.slice(0, 500), intent, ts: Date.now() })
  if (s.history.length > MAX_HISTORY) {
    s.history = s.history.slice(-MAX_HISTORY)
  }
  if (role === 'user') {
    s.counters.totalTurns++
    if (intent) s.lastIntent = intent
  }
  persist()
}

export function updateContext(id, patch) {
  const s = getSession(id)
  Object.assign(s.context, patch)
  persist()
}

export function setStage(id, stage) {
  const s = getSession(id)
  s.stage = stage
  persist()
}

export function setGeneratedFiles(id, files) {
  const s = getSession(id)
  s.generatedFiles = files
  s.counters.sitesBuilt++
  persist()
}

export function resetSession(id) {
  delete sessions[id]
  persist()
}

export function detectLanguage(text) {
  const arabic = (text.match(/[؀-ۿ]/g) || []).length
  const latin = (text.match(/[a-zA-Z]/g) || []).length
  if (arabic > latin) return 'ar'
  if (latin > 0) return 'en'
  return ''
}

export function getRecentHistory(id, n = 5) {
  const s = getSession(id)
  return s.history.slice(-n)
}

export function hasRecentIntent(id, intent, withinTurns = 3) {
  const recent = getRecentHistory(id, withinTurns)
  return recent.some(h => h.intent === intent)
}

export function countSessions() {
  return Object.keys(sessions).length
}

// Useful for debug / future features
export function inspectSession(id) {
  const s = getSession(id)
  return {
    id: s.id,
    age: Date.now() - s.createdAt,
    stage: s.stage,
    turns: s.counters.totalTurns,
    sitesBuilt: s.counters.sitesBuilt,
    context: s.context,
    historyLength: s.history.length,
  }
}
