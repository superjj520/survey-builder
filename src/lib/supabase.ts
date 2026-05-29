'use client'

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ybyputkhtrejnqyblvdc.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieXB1dGtodHJlam5xeWJsdmRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NDMyNTYsImV4cCI6MjA5NTUxOTI1Nn0.apZ2EDTGDt1TeFsHcVDjWCSeLPjVf9sPs74SreuB4yk'

let _supabase: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  }
  return _supabase
}

// Export the full client for auth operations
export const supabaseClient = {
  get client() {
    return getClient()
  }
}

// Convenience wrappers (backwards compatible)
export const supabase = {
  from(table: string) {
    return getClient().from(table)
  },
  storage: {
    from(bucket: string) {
      return getClient().storage.from(bucket)
    }
  }
}
