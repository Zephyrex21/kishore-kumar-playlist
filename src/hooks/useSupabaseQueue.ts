import { useEffect, useState } from 'react'
import { supabase, SONGS_BUCKET, isSupabaseConfigured } from '../lib/supabase'

export type Track = {
  name: string // display title, derived from filename
  path: string // storage path, used as a stable key
  url: string // public playback URL
}

const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.ogg', '.flac']

function titleFromFilename(filename: string) {
  const withoutExt = filename.replace(/\.[^/.]+$/, '')
  return withoutExt
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function useSupabaseQueue() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)

      if (!isSupabaseConfigured || !supabase) {
        setError('Supabase is not configured — check .env (see .env.example).')
        setIsLoading(false)
        return
      }
      const client = supabase

      const { data, error: listError } = await client.storage.from(SONGS_BUCKET).list('', {
        sortBy: { column: 'name', order: 'asc' },
      })

      if (cancelled) return

      if (listError) {
        setError(listError.message)
        setIsLoading(false)
        return
      }

      const audioFiles = (data ?? []).filter((f) =>
        AUDIO_EXTENSIONS.some((ext) => f.name.toLowerCase().endsWith(ext)),
      )

      const withUrls: Track[] = audioFiles.map((f) => {
        const { data: urlData } = client.storage.from(SONGS_BUCKET).getPublicUrl(f.name)
        return { name: titleFromFilename(f.name), path: f.name, url: urlData.publicUrl }
      })

      setTracks(withUrls)
      setIsLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { tracks, isLoading, error }
}
