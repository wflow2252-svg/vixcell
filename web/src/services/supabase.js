// Supabase client — single source of truth for auth + db.
// The publishable key is *designed* to be exposed in client code —
// security is enforced by Row Level Security policies on the database.

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ||
  'https://ilrxkhgdsirqppgqavjs.supabase.co'

const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlscnhraGdkc2lycXBwZ3FhdmpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5OTQ3MjIsImV4cCI6MjA5MDU3MDcyMn0.PcskF1v9PboxO3mdnmqq9p1mW0hsef1I32bUtFVp0f4'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// ─── Auth helpers ──────────────────────────────────────────────────
// Custom Google OAuth via our own Vercel API routes (no Supabase Auth
// involved, so no dashboard URL config to worry about).
//
//   /api/auth/google/login        → redirects browser to Google consent
//   /__/auth/handler              → Google calls back here, we set our cookie
//   /api/auth/me                  → read current user from cookie
//   /api/auth/logout              → clear cookie

/** Kick off Google OAuth. Redirects the browser away. */
export function signInWithGoogle() {
  if (typeof window === 'undefined') return
  const returnTo = encodeURIComponent(window.location.pathname || '/admin')
  window.location.href = `/api/auth/google/login?return_to=${returnTo}`
}

/** Sign out — clears the session cookie, then redirects home. */
export async function signOut() {
  if (typeof window !== 'undefined') {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      })
    } catch (_) {}
    window.location.href = '/'
  }
}

/** Returns the currently signed-in user, or null. */
export async function getCurrentUser() {
  if (typeof window === 'undefined') return null
  try {
    const res = await fetch('/api/auth/me', {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
      cache: 'no-store',
    })
    if (!res.ok) return null
    const { user } = await res.json()
    return user || null
  } catch (_) {
    return null
  }
}

/**
 * Subscribe to auth changes. We poll /api/auth/me every 30s because we don't
 * have a push channel — good enough for an admin dashboard. Also fires once
 * immediately and listens for `focus` so sign-in is reflected on tab switch.
 */
export function onAuthChange(callback) {
  let active = true
  let lastJson = ''

  async function tick() {
    if (!active) return
    const u = await getCurrentUser()
    const json = JSON.stringify(u)
    if (json !== lastJson) {
      lastJson = json
      callback(u)
    }
  }

  tick()
  const interval = setInterval(tick, 30000)
  const onFocus = () => tick()
  if (typeof window !== 'undefined') window.addEventListener('focus', onFocus)

  return () => {
    active = false
    clearInterval(interval)
    if (typeof window !== 'undefined') window.removeEventListener('focus', onFocus)
  }
}

/**
 * Send a verification magic link to a client who just submitted a form.
 * Still uses Supabase Auth for this — it only needs to send the email, not
 * actually establish a session. Default Supabase email works without SMTP setup.
 */
export async function sendClientVerification(email, reference) {
  const redirectTo = typeof window !== 'undefined'
    ? `${window.location.origin}/?verified=${encodeURIComponent(reference || 'ok')}`
    : undefined

  const { data, error } = await supabase.auth.signInWithOtp({
    email: (email || '').trim().toLowerCase(),
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser: true,
      data: { reference, source: 'client_intake' },
    },
  })
  if (error) throw error
  return data
}

// Deprecated alias — kept so older imports don't break.
export const signInWithMagicLink = sendClientVerification
