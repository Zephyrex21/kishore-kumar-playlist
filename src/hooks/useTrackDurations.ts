import { useEffect, useState } from 'react'
import type { Track } from './useSupabaseQueue'

/**
 * Loads each track's duration in the background (preload='metadata' only —
 * this reads just enough of the file to get duration, not the whole song)
 * so the queue list can show song length without waiting for anyone to
 * actually play each track first.
 */
export function useTrackDurations(tracks: Track[]) {
  const [durations, setDurations] = useState<Record<string, number>>({})

  useEffect(() => {
    if (tracks.length === 0) return
    let cancelled = false
    const probes: HTMLAudioElement[] = []

    tracks.forEach((track) => {
      const probe = new Audio()
      probe.preload = 'metadata'
      probe.src = track.url
      const onLoaded = () => {
        if (cancelled) return
        setDurations((prev) => ({ ...prev, [track.path]: probe.duration || 0 }))
      }
      probe.addEventListener('loadedmetadata', onLoaded)
      probes.push(probe)
    })

    return () => {
      cancelled = true
      probes.forEach((p) => {
        p.src = ''
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks.map((t) => t.path).join(',')])

  return durations
}
