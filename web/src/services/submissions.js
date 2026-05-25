// ─── Submissions service ──────────────────────────────────────────
// Backed by Supabase (Postgres) with localStorage as offline fallback.
// Public can INSERT only; RLS policies on the DB ensure SELECT/UPDATE/
// DELETE are admin-only — so even with the publishable key exposed,
// nobody but the whitelisted admins can read leads.

import { supabase, sendClientVerification } from './supabase'

const TABLE = 'submissions'
const LOCAL_KEY = 'vixcell_submissions_v2'

// Admin whitelist (matches the DB `public.is_admin()` function).
// Kept here too so the UI can short-circuit before talking to the DB.
export const ADMIN_EMAILS = [
  'hazemcoding@gmail.com',
  'vixcel.eg@gmail.com',
]

export function isAdmin(email) {
  return Boolean(email) && ADMIN_EMAILS.includes(email.trim().toLowerCase())
}

// ─── Local cache helpers ──────────────────────────────────────────
function readLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') } catch { return [] }
}
function writeLocal(arr) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(arr)) } catch {}
}
function makeLocalId() {
  return 'local-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// ─── Public API ───────────────────────────────────────────────────

/**
 * Submit a new lead.
 * @param type    'project_intake' | 'feedback' | 'contact'
 * @param payload { name, whatsapp?, email?, brief?, message?, rating?, metadata? }
 * Returns { id, savedToCloud }.
 */
export async function submit(type, payload) {
  const record = {
    type,
    name:     (payload.name     || '').trim().slice(0, 120),
    whatsapp: payload.whatsapp ? String(payload.whatsapp).trim().slice(0, 32)  : null,
    email:    payload.email    ? String(payload.email).trim().slice(0, 320)    : null,
    brief:    payload.brief    ? String(payload.brief).slice(0, 5000)           : null,
    message:  payload.message  ? String(payload.message).slice(0, 5000)         : null,
    rating:   typeof payload.rating === 'number' ? payload.rating : null,
    source:   typeof window !== 'undefined' ? window.location.pathname : null,
    metadata: payload.metadata || {},
  }

  // Always save to localStorage immediately so the user never loses a submission
  const localRecord = {
    ...record,
    id: makeLocalId(),
    created_at: new Date().toISOString(),
    read: false,
    syncedToCloud: false,
  }
  const local = readLocal()
  local.unshift(localRecord)
  writeLocal(local)

  // Mirror to Supabase
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .insert(record)
      .select('id, reference, created_at')
      .single()

    if (error) throw error

    // Mark the local copy as synced so we don't show duplicates
    const updated = readLocal().map(r =>
      r.id === localRecord.id
        ? { ...r, syncedToCloud: true, cloudId: data.id, reference: data.reference }
        : r
    )
    writeLocal(updated)

    // Fire-and-forget email verification — if the client gave an email, send
    // them a magic link from vixcell.eg@gmail.com confirming they own it.
    // Doesn't block the submission flow; failures are logged silently.
    let verificationSent = false
    if (record.email) {
      try {
        await sendClientVerification(record.email, data.reference)
        verificationSent = true
      } catch (verifyErr) {
        console.warn('[Submissions] verification email failed:', verifyErr?.message || verifyErr)
      }
    }

    return { id: data.id, reference: data.reference, savedToCloud: true, verificationSent }
  } catch (err) {
    console.warn('[Submissions] Supabase insert failed, kept local copy:', err?.message || err)
    // Generate a local reference so the user still gets one
    const localRef = makeLocalReference()
    const updated = readLocal().map(r =>
      r.id === localRecord.id ? { ...r, reference: localRef } : r
    )
    writeLocal(updated)
    return { id: localRecord.id, reference: localRef, savedToCloud: false, verificationSent: false }
  }
}

// Local fallback reference generator (matches the DB function's alphabet)
function makeLocalReference() {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let out = 'VX-'
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)]
  return out
}

/**
 * List all submissions. Admin-only.
 * Merges Supabase data with any local-only (unsynced) records.
 */
export async function listAll() {
  let cloud = []
  let cloudError = null
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)
    if (error) throw error
    cloud = (data || []).map(normalizeRow)
  } catch (err) {
    cloudError = err
    console.warn('[Submissions] Supabase list failed:', err?.message || err)
  }

  // Include only local records that haven't been synced
  const local = readLocal()
  const localOnly = local
    .filter(r => !r.syncedToCloud)
    .map(normalizeRow)

  const merged = [...cloud, ...localOnly]
  merged.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  return { items: merged, cloudError: cloudError ? String(cloudError.message || cloudError) : null }
}

function normalizeRow(r) {
  return {
    id:          r.id,
    reference:   r.reference || null,
    type:        r.type,
    name:        r.name,
    whatsapp:    r.whatsapp,
    email:       r.email,
    brief:       r.brief,
    message:     r.message,
    rating:      r.rating,
    source:      r.source,
    read:        !!r.read,
    metadata:    r.metadata || {},
    createdAt:   r.created_at ? new Date(r.created_at).getTime() : Date.now(),
    syncedToCloud: r.syncedToCloud !== false,
  }
}

/** Mark a submission as read/unread (admin-only via RLS) */
export async function markRead(id, read = true) {
  if (!String(id).startsWith('local-')) {
    const { error } = await supabase.from(TABLE).update({ read }).eq('id', id)
    if (error) console.warn('[Submissions] markRead failed:', error.message)
  }
  // Also update local cache
  const local = readLocal().map(r => r.id === id || r.cloudId === id ? { ...r, read } : r)
  writeLocal(local)
}

/** Delete a submission (admin-only via RLS) */
export async function remove(id) {
  if (!String(id).startsWith('local-')) {
    const { error } = await supabase.from(TABLE).delete().eq('id', id)
    if (error) console.warn('[Submissions] delete failed:', error.message)
  }
  const local = readLocal().filter(r => r.id !== id && r.cloudId !== id)
  writeLocal(local)
}
