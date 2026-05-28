import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

export const supabase = {
  from(table: string) {
    if (!_supabase) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      _supabase = createClient(url, key)
    }
    return _supabase.from(table)
  },
  storage: {
    from(bucket: string) {
      if (!_supabase) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        _supabase = createClient(url, key)
      }
      return _supabase.storage.from(bucket)
    }
  }
}
