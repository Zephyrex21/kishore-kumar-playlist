import { useEffect, useRef, useState } from 'react'
import type { Track } from './useSupabaseQueue'

const ERROR_MESSAGES: Record<number, string> = {
  1: 'Playback was aborted.',
  2: 'Network error while loading the audio file.',
  3: 'The file could not be decoded — check that it\u2019s a valid audio format.',
  4: 'This audio source is not supported or could not be reached (check the file URL / bucket permissions).',
}

export function useAudioQueue(tracks: Track[]) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const tracksRef = useRef<Track[]>(tracks)
  const [index, setIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(true)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const current = tracks[index]

  // Keep a ref in sync so the 'ended' listener (registered once, below)
  // always sees the latest queue instead of a stale closure over the
  // tracks array from whenever the audio element was first created.
  useEffect(() => {
    tracksRef.current = tracks
  }, [tracks])

  // Create the audio element exactly once — NOT tied to the tracks array,
  // so it never gets torn down and recreated (which was resetting playback
  // to 0:00 any time the queue changed).
  useEffect(() => {
    const audio = new Audio()
    audio.preload = 'auto'
    audioRef.current = audio

    const onTime = () => setPosition(audio.currentTime)
    const onLoaded = () => setDuration(audio.duration || 0)
    const onEnded = () => {
      const len = tracksRef.current.length
      if (len > 0) setIndex((i) => (i + 1) % len)
    }
    const onPlay = () => setIsPaused(false)
    const onPause = () => setIsPaused(true)
    const onError = () => {
      const code = audio.error?.code
      setError((code && ERROR_MESSAGES[code]) || 'Unknown playback error.')
    }

    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onLoaded)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('error', onError)

    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onLoaded)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('error', onError)
      audio.pause()
    }
  }, [])

  // Load whichever track is current whenever the index or queue changes.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !current) return
    setError(null)
    const wasPlaying = !audio.paused
    audio.src = current.url
    audio.load()
    setPosition(0)
    setDuration(0)
    if (wasPlaying) {
      audio.play().catch((e) => setError(e instanceof Error ? e.message : 'Could not start playback.'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.url])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play().catch((e) => setError(e instanceof Error ? e.message : 'Could not start playback.'))
    } else {
      audio.pause()
    }
  }

  const next = () => setIndex((i) => (tracks.length ? (i + 1) % tracks.length : i))
  const prev = () => setIndex((i) => (tracks.length ? (i - 1 + tracks.length) % tracks.length : i))
  const playAt = (i: number) => setIndex(i)

  const seek = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = seconds
    setPosition(seconds)
  }

  return { current, index, isPaused, position, duration, error, togglePlay, next, prev, playAt, seek }
}
