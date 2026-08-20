import { useEffect, useRef, useState } from 'react'
import type { Track } from './useSupabaseQueue'

const ERROR_MESSAGES: Record<number, string> = {
  1: 'Playback was aborted.',
  2: 'Network error while loading the audio file.',
  3: 'The file could not be decoded — check that it\u2019s a valid audio format.',
  4: 'This audio source is not supported or could not be reached (check the file URL / bucket permissions).',
}

const CROSSFADE_SECONDS = 8
const FADE_STEP_MS = 100
const PAUSE_FADE_MS = 350
const PAUSE_FADE_STEP_MS = 30
const VOLUME_STORAGE_KEY = 'kishore-tribute:volume'
const RECENT_STORAGE_KEY = 'kishore-tribute:recent'
const RECENT_LIMIT = 20
const PLAYCOUNT_STORAGE_KEY = 'kishore-tribute:playcounts'

export type RepeatMode = 'off' | 'all' | 'one'
export type RecentEntry = { name: string; playedAt: number }
export type MostPlayedEntry = { name: string; count: number }

function loadStoredVolume(): number {
  try {
    const raw = localStorage.getItem(VOLUME_STORAGE_KEY)
    const parsed = raw !== null ? Number(raw) : 1
    return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : 1
  } catch {
    return 1
  }
}

function loadRecent(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(RECENT_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function pushRecent(name: string) {
  try {
    const list = loadRecent().filter((e) => e.name !== name)
    list.unshift({ name, playedAt: Date.now() })
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(list.slice(0, RECENT_LIMIT)))
  } catch {
    // Private browsing / storage disabled — recently-played just won't persist.
  }
}

function loadPlayCounts(): Record<string, number> {
  try {
    const raw = localStorage.getItem(PLAYCOUNT_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function incrementPlayCount(name: string): MostPlayedEntry[] {
  const counts = loadPlayCounts()
  counts[name] = (counts[name] || 0) + 1
  try {
    localStorage.setItem(PLAYCOUNT_STORAGE_KEY, JSON.stringify(counts))
  } catch {
    // Private browsing / storage disabled — play counts just won't persist.
  }
  return sortedPlayCounts(counts)
}

function sortedPlayCounts(counts: Record<string, number>): MostPlayedEntry[] {
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Two audio elements, alternating as "active". When the active track has
 * <= CROSSFADE_SECONDS left, the other element starts loading + playing
 * the next track at volume 0, and both cross-fade over the remaining time.
 * The "active" pointer and the displayed index flip the moment the fade
 * starts — the outgoing element keeps playing quietly in the background
 * until it fades to silence, decoupled from anything the UI shows.
 *
 * Also drives the Media Session API (lock-screen / hardware-key controls)
 * and persists volume across visits.
 */
export function useAudioQueue(tracks: Track[]) {
  const audiosRef = useRef<[HTMLAudioElement, HTMLAudioElement]>([new Audio(), new Audio()])
  const activeSlot = useRef<0 | 1>(0)
  const tracksRef = useRef<Track[]>(tracks)
  const indexRef = useRef(0)
  const crossfading = useRef(false)
  const fadeTimer = useRef<number | null>(null)
  const pauseFadeTimer = useRef<number | null>(null)
  const isPausing = useRef(false)
  const skipNextLoad = useRef(false)
  const masterVolume = useRef(loadStoredVolume())
  const lastNonZeroVolume = useRef(masterVolume.current || 1)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analysersRef = useRef<[AnalyserNode | null, AnalyserNode | null]>([null, null])
  const shuffleRef = useRef(false)
  const repeatModeRef = useRef<RepeatMode>('off')
  const lastLoggedTrack = useRef<string | null>(null)

  function resumeAudioCtx() {
    const ctx = audioCtxRef.current
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {})
  }

  function getActiveAnalyser() {
    return analysersRef.current[activeSlot.current]
  }

  function getAudioContext() {
    return audioCtxRef.current
  }

  // Given the current index, works out what "advance to the next track"
  // should mean right now — respecting shuffle and repeat. Returns null to
  // mean "don't advance, just stop" (repeat off + already at the last track).
  function computeAutoAdvanceIndex(cur: number, len: number): number | null {
    if (len === 0) return null
    if (repeatModeRef.current === 'one') return cur
    if (shuffleRef.current) {
      if (len === 1) return cur
      let candidate = cur
      while (candidate === cur) candidate = Math.floor(Math.random() * len)
      return candidate
    }
    const next = cur + 1
    if (next >= len) return repeatModeRef.current === 'all' ? 0 : null
    return next
  }

  const [index, setIndexState] = useState(0)
  const [isPaused, setIsPaused] = useState(true)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [volume, setVolumeState] = useState(masterVolume.current)
  const [shuffle, setShuffleState] = useState(false)
  const [repeatMode, setRepeatModeState] = useState<RepeatMode>('off')
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentEntry[]>(loadRecent)
  const [mostPlayed, setMostPlayed] = useState<MostPlayedEntry[]>(() => sortedPlayCounts(loadPlayCounts()))

  const setIndex = (updater: number | ((i: number) => number)) => {
    setIndexState((prev) => {
      const next = typeof updater === 'function' ? (updater as (i: number) => number)(prev) : updater
      indexRef.current = next
      return next
    })
  }

  const current = tracks[index]

  useEffect(() => {
    tracksRef.current = tracks
  }, [tracks])

  function activeEl() {
    return audiosRef.current[activeSlot.current]
  }
  function inactiveEl() {
    return audiosRef.current[activeSlot.current === 0 ? 1 : 0]
  }

  function cancelCrossfade() {
    if (fadeTimer.current) {
      window.clearInterval(fadeTimer.current)
      fadeTimer.current = null
    }
    crossfading.current = false
    const inactive = inactiveEl()
    inactive.pause()
    inactive.currentTime = 0
    inactive.volume = masterVolume.current
    activeEl().volume = masterVolume.current
  }

  function cancelPauseFade() {
    if (pauseFadeTimer.current) {
      window.clearInterval(pauseFadeTimer.current)
      pauseFadeTimer.current = null
    }
    isPausing.current = false
  }

  function startCrossfade(outgoing: HTMLAudioElement, remainingSeconds: number) {
    const len = tracksRef.current.length
    if (len < 2) return
    const nextIndex = computeAutoAdvanceIndex(indexRef.current, len)
    if (nextIndex === null) return
    crossfading.current = true

    const nextTrack = tracksRef.current[nextIndex]
    const incoming = inactiveEl()

    incoming.src = nextTrack.url
    incoming.currentTime = 0
    incoming.volume = 0
    resumeAudioCtx()
    incoming.play().catch(() => {})

    // Flip active slot + displayed index immediately — the UI now shows the
    // incoming track while the outgoing one quietly finishes in the background.
    skipNextLoad.current = true
    activeSlot.current = activeSlot.current === 0 ? 1 : 0
    setIndex(nextIndex)
    setPosition(0)
    setDuration(incoming.duration || 0)

    outgoing.volume = masterVolume.current
    const fadeMs = Math.max(300, remainingSeconds * 1000)
    const steps = Math.ceil(fadeMs / FADE_STEP_MS)
    let step = 0
    fadeTimer.current = window.setInterval(() => {
      step++
      const t = Math.min(1, step / steps)
      outgoing.volume = Math.max(0, (1 - t) * masterVolume.current)
      incoming.volume = Math.min(masterVolume.current, t * masterVolume.current)
      if (t >= 1) {
        if (fadeTimer.current) window.clearInterval(fadeTimer.current)
        fadeTimer.current = null
        outgoing.pause()
        outgoing.currentTime = 0
        outgoing.volume = masterVolume.current
        crossfading.current = false
      }
    }, FADE_STEP_MS)
  }

  // One-time setup: bind listeners to BOTH elements permanently. Each
  // listener only pushes to React state when its element is the currently
  // active one, so state always reflects "front" playback regardless of
  // which of the two underlying elements is producing it.
  useEffect(() => {
    const [a, b] = audiosRef.current
    a.preload = 'auto'
    b.preload = 'auto'
    a.volume = masterVolume.current
    b.volume = masterVolume.current
    // Needed for the Web Audio analyser below to actually receive frequency
    // data cross-origin (Supabase's public bucket URLs). If this — or
    // anything below — fails or the bucket lacks permissive CORS, playback
    // itself is entirely unaffected; only the real-time visualizer degrades
    // to its CSS fallback (handled in the component, not here).
    a.crossOrigin = 'anonymous'
    b.crossOrigin = 'anonymous'

    try {
      const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (AudioContextCtor) {
        const ctx = new AudioContextCtor()
        audioCtxRef.current = ctx
        const setupAnalyser = (el: HTMLAudioElement): AnalyserNode | null => {
          try {
            const source = ctx.createMediaElementSource(el)
            const analyser = ctx.createAnalyser()
            analyser.fftSize = 64
            analyser.smoothingTimeConstant = 0.75
            // IMPORTANT: createMediaElementSource reroutes the element's audio
            // through the Web Audio graph — it will go SILENT unless we
            // reconnect it to a destination ourselves.
            source.connect(analyser)
            analyser.connect(ctx.destination)
            return analyser
          } catch {
            return null
          }
        }
        analysersRef.current = [setupAnalyser(a), setupAnalyser(b)]
      }
    } catch {
      // Web Audio unavailable in this browser — visualizer falls back to CSS.
    }

    function bind(el: HTMLAudioElement) {
      const isActive = () => audiosRef.current[activeSlot.current] === el

      const onTime = () => {
        if (!isActive()) return
        setPosition(el.currentTime)
        if ('mediaSession' in navigator && el.duration && Number.isFinite(el.duration)) {
          try {
            navigator.mediaSession.setPositionState({
              duration: el.duration,
              position: Math.min(el.currentTime, el.duration),
              playbackRate: 1,
            })
          } catch {
            // Some browsers throw if called too rapidly during a seek — safe to ignore.
          }
        }
        if (
          !crossfading.current &&
          !isPausing.current &&
          el.duration &&
          Number.isFinite(el.duration) &&
          tracksRef.current.length > 1
        ) {
          const remaining = el.duration - el.currentTime
          if (remaining > 0 && remaining <= CROSSFADE_SECONDS) {
            startCrossfade(el, remaining)
          }
        }
      }
      const onLoaded = () => {
        if (isActive()) setDuration(el.duration || 0)
      }
      const onPlay = () => {
        if (!isActive()) return
        setIsPaused(false)
        const track = tracksRef.current[indexRef.current]
        if (track && track.name !== lastLoggedTrack.current) {
          lastLoggedTrack.current = track.name
          pushRecent(track.name)
          setRecentlyPlayed(loadRecent())
          setMostPlayed(incrementPlayCount(track.name))
        }
      }
      const onPause = () => {
        if (isActive()) setIsPaused(true)
      }
      const onError = () => {
        if (!isActive()) return
        const code = el.error?.code
        setError((code && ERROR_MESSAGES[code]) || 'Unknown playback error.')
      }
      // Fallback for very short tracks (< crossfade window) or single-track
      // queues, where the timeupdate-based crossfade never gets a chance to fire.
      const onEnded = () => {
        if (!isActive() || crossfading.current) return
        const nextIndex = computeAutoAdvanceIndex(indexRef.current, tracksRef.current.length)
        if (nextIndex !== null) setIndex(nextIndex)
      }

      el.addEventListener('timeupdate', onTime)
      el.addEventListener('loadedmetadata', onLoaded)
      el.addEventListener('play', onPlay)
      el.addEventListener('pause', onPause)
      el.addEventListener('error', onError)
      el.addEventListener('ended', onEnded)
      return () => {
        el.removeEventListener('timeupdate', onTime)
        el.removeEventListener('loadedmetadata', onLoaded)
        el.removeEventListener('play', onPlay)
        el.removeEventListener('pause', onPause)
        el.removeEventListener('error', onError)
        el.removeEventListener('ended', onEnded)
      }
    }

    const cleanupA = bind(a)
    const cleanupB = bind(b)
    return () => {
      cleanupA()
      cleanupB()
      a.pause()
      b.pause()
      if (pauseFadeTimer.current) window.clearInterval(pauseFadeTimer.current)
      audioCtxRef.current?.close().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load whichever track is current whenever the index changes — EXCEPT
  // right after a crossfade, which already loaded + started the incoming
  // element manually (reloading here would reset it back to 0:00).
  useEffect(() => {
    if (skipNextLoad.current) {
      skipNextLoad.current = false
      return
    }
    const el = activeEl()
    if (!current) return
    setError(null)
    const wasPlaying = !el.paused
    el.src = current.url
    el.currentTime = 0
    el.volume = masterVolume.current
    el.load()
    setPosition(0)
    setDuration(0)
    if (wasPlaying) {
      resumeAudioCtx()
      el.play().catch((e) => setError(e instanceof Error ? e.message : 'Could not start playback.'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.url])

  const togglePlay = () => {
    const el = activeEl()
    if (el.paused) {
      cancelPauseFade()
      el.volume = masterVolume.current
      resumeAudioCtx()
      el.play().catch((e) => setError(e instanceof Error ? e.message : 'Could not start playback.'))
    } else {
      if (pauseFadeTimer.current) return // already fading out — ignore a duplicate pause click
      if (crossfading.current) cancelCrossfade() // don't fight the crossfade's own volume ramps
      isPausing.current = true
      const startVolume = el.volume
      const steps = Math.max(1, Math.round(PAUSE_FADE_MS / PAUSE_FADE_STEP_MS))
      let step = 0
      pauseFadeTimer.current = window.setInterval(() => {
        step++
        const t = step / steps
        el.volume = Math.max(0, startVolume * (1 - t))
        if (t >= 1) {
          if (pauseFadeTimer.current) window.clearInterval(pauseFadeTimer.current)
          pauseFadeTimer.current = null
          isPausing.current = false
          el.pause()
          el.volume = masterVolume.current // restored so the next play() starts at full volume, not silent
        }
      }, PAUSE_FADE_STEP_MS)
    }
  }

  const next = () => {
    cancelCrossfade()
    cancelPauseFade()
    setIndex((i) => {
      if (!tracks.length) return i
      if (shuffleRef.current && tracks.length > 1) {
        let candidate = i
        while (candidate === i) candidate = Math.floor(Math.random() * tracks.length)
        return candidate
      }
      return (i + 1) % tracks.length
    })
  }
  const prev = () => {
    cancelCrossfade()
    cancelPauseFade()
    setIndex((i) => (tracks.length ? (i - 1 + tracks.length) % tracks.length : i))
  }
  const playAt = (i: number) => {
    cancelCrossfade()
    cancelPauseFade()
    setIndex(i)
  }

  const setShuffle = (value: boolean) => {
    shuffleRef.current = value
    setShuffleState(value)
  }
  const cycleRepeatMode = () => {
    const order: RepeatMode[] = ['off', 'all', 'one']
    const next = order[(order.indexOf(repeatModeRef.current) + 1) % order.length]
    repeatModeRef.current = next
    setRepeatModeState(next)
  }

  const seek = (seconds: number) => {
    const el = activeEl()
    el.currentTime = seconds
    setPosition(seconds)
  }

  const setVolume = (v: number) => {
    const clamped = Math.min(1, Math.max(0, v))
    masterVolume.current = clamped
    if (clamped > 0) lastNonZeroVolume.current = clamped
    setVolumeState(clamped)
    // Only touch the currently-audible element directly — during a crossfade
    // the fade interval owns both elements' volumes every 100ms anyway, so a
    // one-off correction here would just get overwritten on the next tick.
    if (!crossfading.current) activeEl().volume = clamped
    try {
      localStorage.setItem(VOLUME_STORAGE_KEY, String(clamped))
    } catch {
      // Private browsing / storage disabled — volume just won't persist, not fatal.
    }
  }

  const toggleMute = () => {
    if (volume > 0) setVolume(0)
    else setVolume(lastNonZeroVolume.current || 1)
  }

  // Media Session: real lock-screen / notification metadata + hardware
  // media-key support. Handlers are registered once — they call the
  // wrapper functions above, which read from refs internally, so they
  // stay correct even though this effect only runs on mount.
  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    try {
      navigator.mediaSession.setActionHandler('play', () => togglePlay())
      navigator.mediaSession.setActionHandler('pause', () => togglePlay())
      navigator.mediaSession.setActionHandler('previoustrack', () => prev())
      navigator.mediaSession.setActionHandler('nexttrack', () => next())
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (typeof details.seekTime === 'number') seek(details.seekTime)
      })
    } catch {
      // Older browsers may not support every action — safe to ignore.
    }
    return () => {
      if (!('mediaSession' in navigator)) return
      navigator.mediaSession.setActionHandler('play', null)
      navigator.mediaSession.setActionHandler('pause', null)
      navigator.mediaSession.setActionHandler('previoustrack', null)
      navigator.mediaSession.setActionHandler('nexttrack', null)
      navigator.mediaSession.setActionHandler('seekto', null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!('mediaSession' in navigator) || !current) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.name,
      artist: 'Kishore Kumar',
      album: 'Kishore Kumar Playlist',
      artwork: [{ src: '/images/hero.jpg', sizes: '1648x954', type: 'image/jpeg' }],
    })
  }, [current?.name])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.playbackState = isPaused ? 'paused' : 'playing'
  }, [isPaused])

  return {
    current,
    index,
    isPaused,
    position,
    duration,
    error,
    volume,
    shuffle,
    repeatMode,
    recentlyPlayed,
    mostPlayed,
    togglePlay,
    next,
    prev,
    playAt,
    seek,
    setVolume,
    toggleMute,
    setShuffle,
    cycleRepeatMode,
    getActiveAnalyser,
    getAudioContext,
  }
}
