import { useEffect, useRef, useState } from 'react'
import type { Track } from './useSupabaseQueue'

const ERROR_MESSAGES: Record<number, string> = {
  1: 'Playback was aborted.',
  2: 'Network error while loading the audio file.',
  3: 'The file could not be decoded — check that it\u2019s a valid audio format.',
  4: 'This audio source is not supported or could not be reached (check the file URL / bucket permissions).',
}

const CROSSFADE_SECONDS = 5
const FADE_STEP_MS = 100

/**
 * Two audio elements, alternating as "active". When the active track has
 * <= CROSSFADE_SECONDS left, the other element starts loading + playing
 * the next track at volume 0, and both cross-fade over the remaining time.
 * The "active" pointer and the displayed index flip the moment the fade
 * starts — the outgoing element keeps playing quietly in the background
 * until it fades to silence, decoupled from anything the UI shows.
 */
export function useAudioQueue(tracks: Track[]) {
  const audiosRef = useRef<[HTMLAudioElement, HTMLAudioElement]>([new Audio(), new Audio()])
  const activeSlot = useRef<0 | 1>(0)
  const tracksRef = useRef<Track[]>(tracks)
  const indexRef = useRef(0)
  const crossfading = useRef(false)
  const fadeTimer = useRef<number | null>(null)
  const skipNextLoad = useRef(false)

  const [index, setIndexState] = useState(0)
  const [isPaused, setIsPaused] = useState(true)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

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
    inactive.volume = 1
    activeEl().volume = 1
  }

  function startCrossfade(outgoing: HTMLAudioElement, remainingSeconds: number) {
    const len = tracksRef.current.length
    if (len < 2) return
    crossfading.current = true

    const nextIndex = (indexRef.current + 1) % len
    const nextTrack = tracksRef.current[nextIndex]
    const incoming = inactiveEl()

    incoming.src = nextTrack.url
    incoming.currentTime = 0
    incoming.volume = 0
    incoming.play().catch(() => {})

    // Flip active slot + displayed index immediately — the UI now shows the
    // incoming track while the outgoing one quietly finishes in the background.
    skipNextLoad.current = true
    activeSlot.current = activeSlot.current === 0 ? 1 : 0
    setIndex(nextIndex)
    setPosition(0)
    setDuration(incoming.duration || 0)

    outgoing.volume = 1
    const fadeMs = Math.max(300, remainingSeconds * 1000)
    const steps = Math.ceil(fadeMs / FADE_STEP_MS)
    let step = 0
    fadeTimer.current = window.setInterval(() => {
      step++
      const t = Math.min(1, step / steps)
      outgoing.volume = Math.max(0, 1 - t)
      incoming.volume = Math.min(1, t)
      if (t >= 1) {
        if (fadeTimer.current) window.clearInterval(fadeTimer.current)
        fadeTimer.current = null
        outgoing.pause()
        outgoing.currentTime = 0
        outgoing.volume = 1
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

    function bind(el: HTMLAudioElement) {
      const isActive = () => audiosRef.current[activeSlot.current] === el

      const onTime = () => {
        if (!isActive()) return
        setPosition(el.currentTime)
        if (
          !crossfading.current &&
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
        if (isActive()) setIsPaused(false)
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
        const len = tracksRef.current.length
        if (len > 0) setIndex((i) => (i + 1) % len)
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
    el.volume = 1
    el.load()
    setPosition(0)
    setDuration(0)
    if (wasPlaying) {
      el.play().catch((e) => setError(e instanceof Error ? e.message : 'Could not start playback.'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.url])

  const togglePlay = () => {
    const el = activeEl()
    if (el.paused) {
      el.play().catch((e) => setError(e instanceof Error ? e.message : 'Could not start playback.'))
    } else {
      el.pause()
    }
  }

  const next = () => {
    cancelCrossfade()
    setIndex((i) => (tracks.length ? (i + 1) % tracks.length : i))
  }
  const prev = () => {
    cancelCrossfade()
    setIndex((i) => (tracks.length ? (i - 1 + tracks.length) % tracks.length : i))
  }
  const playAt = (i: number) => {
    cancelCrossfade()
    setIndex(i)
  }

  const seek = (seconds: number) => {
    const el = activeEl()
    el.currentTime = seconds
    setPosition(seconds)
  }

  return { current, index, isPaused, position, duration, error, togglePlay, next, prev, playAt, seek }
}
