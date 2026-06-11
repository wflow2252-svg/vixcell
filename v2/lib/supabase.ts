import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ilrxkhgdsirqppgqavjs.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlscnhraGdkc2lycXBwZ3FhdmpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5OTQ3MjIsImV4cCI6MjA5MDU3MDcyMn0.PcskF1v9PboxO3mdnmqq9p1mW0hsef1I32bUtFVp0f4'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
