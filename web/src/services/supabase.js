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

/**
 * Sign in with Google. Redirects to Google's consent screen, then back to /admin.
 *
 * Setup (one-time, in Supabase Dashboard):
 *   Authentication → Providers → Google → Enable
 *   Client ID:     5348700581-6bq9f3lmvnru013qf4ipljedt7u839bm.apps.googleusercontent.com
 *   Client Secret: (from client_secret JSON file at project root)
 *
 * Also add to the Google OAuth client's Authorized redirect URIs:
 *   https://ilrxkhgdsirqppgqavjs.supabase.co/auth/v1/callback
 */
export async function signInWithGoogle() {
  const redirectTo = typeof window !== 'undefined'
    ? `${window.location.origin}/admin`
    : undefined

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: { prompt: 'select_account' },
    },
  })
  if (error) throw error
  return data
}

/**
 * Send a verification magic link to a client who just submitted the contact form.
 * Used to confirm they actually own the email address they entered. The link
 * arrives from vixcell.eg@gmail.com (configured as Supabase SMTP sender) and
 * redirects them back to the site so they get visual confirmation.
 *
 * Configure SMTP in Supabase Dashboard → Auth → SMTP Settings:
 *   Host:     smtp.gmail.com
 *   Port:     587
 *   Username: vixcell.eg@gmail.com
 *   Password: (Gmail App Password — generate in Google Account → Security)
 *   Sender:   vixcell.eg@gmail.com
 *   Name:     VIXCELL
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

// Kept as a deprecated alias for backwards compatibility with older imports.
export const signInWithMagicLink = sendClientVerification

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
