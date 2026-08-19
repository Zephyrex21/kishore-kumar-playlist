import { useEffect, useState } from 'react'

// Module-level cache — persists across track switches within the session,
// so returning to a song you've already played doesn't re-download and
// re-decode it. Keyed by track URL.
const cache = new Map<string, number[]>()
const BAR_COUNT = 80

/**
 * Computes real waveform peaks for a track by fetching the full audio file
 * and decoding it with the Web Audio API — there's no backend here to
 * precompute this server-side, so this is a genuine trade-off: it means an
 * extra full download of whatever's currently playing, on top of the
 * <audio> element's own streaming download for playback. Mitigated by:
 * only ever computing for the CURRENTLY ACTIVE track (never prefetching
 * the whole queue), and caching per-track for the session.
 *
 * Fails silently — if fetch/decode fails for any reason (CORS, network,
 * unsupported format), peaks stays null and the caller falls back to a
 * plain seek bar instead of breaking anything.
 */
export function useWaveform(url: string | undefined, getAudioContext: () => AudioContext | null) {
  const [peaks, setPeaks] = useState<number[] | null>(url ? cache.get(url) ?? null : null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!url) {
      setPeaks(null)
      return
    }
    const cached = cache.get(url)
    if (cached) {
      setPeaks(cached)
      setIsLoading(false)
      return
    }

    let cancelled = false
    setPeaks(null)
    setIsLoading(true)

    async function run() {
      try {
        const ctx = getAudioContext()
        if (!ctx) throw new Error('No AudioContext available')

        const res = await fetch(url as string)
        if (!res.ok) throw new Error('Fetch failed')
        const arrayBuffer = await res.arrayBuffer()
        if (cancelled) return

        // decodeAudioData detaches/consumes the buffer, but we already have
        // our own copy from arrayBuffer() so that's fine.
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
        if (cancelled) return

        const raw = audioBuffer.getChannelData(0)
        const blockSize = Math.max(1, Math.floor(raw.length / BAR_COUNT))
        const rawPeaks: number[] = []
        for (let i = 0; i < BAR_COUNT; i++) {
          let sum = 0
          const start = i * blockSize
          for (let j = 0; j < blockSize; j++) sum += Math.abs(raw[start + j] || 0)
          rawPeaks.push(sum / blockSize)
        }
        const max = Math.max(...rawPeaks, 0.0001)
        const normalized = rawPeaks.map((v) => v / max)

        if (url) cache.set(url, normalized)
        if (!cancelled) setPeaks(normalized)
      } catch {
        // Silent — the caller renders a plain seek bar when peaks is null.
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [url, getAudioContext])

  return { peaks, isLoading }
}
