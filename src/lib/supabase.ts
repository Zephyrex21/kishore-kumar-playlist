import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Name of the public Storage bucket holding the songs. Change if you name yours differently.
export const SONGS_BUCKET = 'songs'

function isValidUrl(value: string | undefined): value is string {
  if (!value) return false
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

export const isSupabaseConfigured = isValidUrl(url) && Boolean(anonKey)

// IMPORTANT: createClient() throws immediately if given an empty/invalid
// URL — and this file runs at module-load time, before React even mounts.
// A bad or missing .env used to take down the entire page with a blank
// screen and no error shown. Now we just skip creating a real client and
// let anything that uses `supabase` check `isSupabaseConfigured` first.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string)
  : (() => {
      console.warn(
        'Missing or invalid VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — copy .env.example to .env and fill in your project values. The player will show a config error instead of a track list until this is set.',
      )
      return null
    })()
