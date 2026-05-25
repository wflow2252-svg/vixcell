// ─── Submissions service ──────────────────────────────────────────
// Single API for all form submissions on the site.
// Saves to Firestore (if configured) AND mirrors to localStorage so
// the admin dashboard always has at least the local browser's history.

import {
  addSubmission as fbAdd,
  listSubmissions as fbList,
  markSubmissionRead as fbMark,
  deleteSubmission as fbDelete,
  isFirebaseReady,
  initFirebase,
} from './firebase'

const LOCAL_KEY = 'vixcell_submissions_v1'

function readLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') } catch { return [] }
}
function writeLocal(arr) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(arr)) } catch {}
}

function makeId() {
  return 'local-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// ─── Public API ───────────────────────────────────────────────────

/**
 * Submit a new lead. Always succeeds (local fallback).
 * Returns { id, savedToCloud }.
 */
export async function submit(type, payload) {
  const record = {
    type,           // 'project_intake' | 'feedback' | future types
    ...payload,
    read: false,
    source: typeof window !== 'undefined' ? window.location.pathname : '',
  }

  initFirebase()

  // Always save locally first — guarantees no submission is lost
  const local = readLocal()
  const localRecord = { ...record, id: makeId(), createdAt: Date.now(), syncedToCloud: false }
  local.unshift(localRecord)
  writeLocal(local)

  // Try Firestore
  if (isFirebaseReady()) {
    try {
      const cloudId = await fbAdd(record)
      // Mark local as synced
      const updated = readLocal().map(r =>
        r.id === localRecord.id ? { ...r, syncedToCloud: true, cloudId } : r
      )
      writeLocal(updated)
      return { id: cloudId, savedToCloud: true }
    } catch (err) {
      console.warn('[Submissions] Firestore save failed, kept local copy:', err)
    }
  }

  return { id: localRecord.id, savedToCloud: false }
}

/**
 * List all submissions. Merges Firestore + local, deduplicating.
 */
export async function listAll() {
  initFirebase()
  const local = readLocal()
  let cloud = []
  if (isFirebaseReady()) {
    try {
      cloud = await fbList()
    } catch (err) {
      console.warn('[Submissions] Firestore list failed:', err)
    }
  }

  // Merge: prefer cloud records (they have proper server timestamps)
  // Dedupe by cloudId on local records
  const cloudIds = new Set(cloud.map(c => c.id))
  const localOnly = local.filter(l => !l.cloudId || !cloudIds.has(l.cloudId))
  const merged = [...cloud, ...localOnly]
  merged.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  return merged
}

export async function markRead(id, read = true) {
  // Try cloud first
  if (isFirebaseReady() && !id.startsWith('local-')) {
    try { await fbMark(id, read) } catch (err) { console.warn(err) }
  }
  // Update local copy too
  const local = readLocal().map(r => (r.id === id || r.cloudId === id) ? { ...r, read } : r)
  writeLocal(local)
}

export async function remove(id) {
  if (isFirebaseReady() && !id.startsWith('local-')) {
    try { await fbDelete(id) } catch (err) { console.warn(err) }
  }
  const local = readLocal().filter(r => r.id !== id && r.cloudId !== id)
  writeLocal(local)
}

// ─── Admin auth check ─────────────────────────────────────────────
export const ADMIN_EMAILS = [
  'hazemcoding@gmail.com',
  'vixcel.eg@gmail.com',
]

export function isAdmin(email) {
  return Boolean(email) && ADMIN_EMAILS.includes(email.trim().toLowerCase())
}
