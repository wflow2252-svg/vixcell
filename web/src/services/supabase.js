// Supabase client — single source of truth for auth + db.
// The publishable key is *designed* to be exposed in client code —
// security is enforced by Row Level Security policies on the database.

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ||
  'https://ilrxkhgdsirqppgqavjs.supabase.co'

const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY ||
  'sb_publishable_iZQSdyDK6nC6NFynVTwAmQ_vXgN9cX-'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// ─── Auth helpers ──────────────────────────────────────────────────
// Magic-link only. Works out of the box with Supabase's default email
// service — zero dashboard configuration required. Rate limit on the
// free tier: ~4 emails/hour per user.

/**
 * Send a sign-in magic link to an admin's email. They click it and land
 * back on /admin with a session attached.
 */
export async function signInWithMagicLink(email) {
  const redirectTo = typeof window !== 'undefined'
    ? `${window.location.origin}/admin`
    : undefined

  const { data, error } = await supabase.auth.signInWithOtp({
    email: (email || '').trim().toLowerCase(),
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser: true,
    },
  })
  if (error) throw error
  return data
}

/**
 * Send a verification magic link to a client who just submitted a form.
 * Confirms they own the email they entered. Same Supabase email service,
 * just redirects back to the homepage so they see a "verified" state.
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

// Deprecated — kept so old imports don't break. Throws to make the migration loud.
export const signInWithGoogle = () => {
  throw new Error('Google OAuth removed — use signInWithMagicLink(email) instead.')
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user ? toAppUser(user) : null
}

/**
 * Subscribe to auth state changes.
 * Callback fires with either a user object or null.
 * Returns an unsubscribe function.
 */
export function onAuthChange(callback) {
  // Fire once with current state
  getCurrentUser().then(callback)
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ? toAppUser(session.user) : null)
  })
  return () => data.subscription.unsubscribe()
}

function toAppUser(user) {
  return {
    uid:     user.id,
    email:   user.email,
    name:    user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
    picture: user.user_metadata?.avatar_url || null,
  }
}
