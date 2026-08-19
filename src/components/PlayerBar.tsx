import { useEffect, useRef, useState } from 'react'
import { useAudioQueue } from '../hooks/useAudioQueue'
import { useTrackDurations } from '../hooks/useTrackDurations'
import type { Track } from '../hooks/useSupabaseQueue'
import {
  PlayIcon,
  PauseIcon,
  PrevIcon,
  NextIcon,
  QueueIcon,
  MusicNoteIcon,
  VolumeHighIcon,
  VolumeMuteIcon,
  ShuffleIcon,
  RepeatIcon,
  RepeatOneIcon,
  HistoryIcon,
  TrendingIcon,
} from './icons'
import SquigglySeekBar from './SquigglySeekBar'
import SongInfoModal from './SongInfoModal'

const ACCENT = '#E8A25A'
const INK = '#fdf6ec'

function EqualizerBars({
  active,
  getAnalyser,
}: {
  active: boolean
  getAnalyser?: () => AnalyserNode | null
}) {
  const barRefs = useRef<(HTMLSpanElement | null)[]>([])

  const fallback = [
    { anim: 'eqA', duration: '0.8s' },
    { anim: 'eqB', duration: '1.1s' },
    { anim: 'eqC', duration: '0.9s' },
    { anim: 'eqD', duration: '1.3s' },
  ]

  // Drive real bar heights from actual frequency data when a Web Audio
  // analyser is available and returning non-silent data. We probe for up
  // to ~1.5s first — if the analyser is CORS-blocked (Supabase bucket
  // lacking permissive CORS, etc.) it returns all-zero data forever, and
  // we must NOT touch bar heights in that case, or we'd freeze them at the
  // floor value instead of leaving the CSS keyframe animation running.
  useEffect(() => {
    if (!active || !getAnalyser) return
    const analyser = getAnalyser()
    if (!analyser) return

    const data = new Uint8Array(analyser.frequencyBinCount)
    const barCount = barRefs.current.length
    const groupSize = Math.max(1, Math.floor(data.length / barCount))
    const MAX_PROBE_FRAMES = 90 // ~1.5s at 60fps — covers a quiet track intro
    let probeFrames = 0
    let confirmed = false
    let raf: number

    function paint() {
      for (let i = 0; i < barCount; i++) {
        let sum = 0
        for (let j = 0; j < groupSize; j++) sum += data[i * groupSize + j] || 0
        const avg = sum / groupSize / 255
        const el = barRefs.current[i]
        if (el) el.style.height = `${Math.max(12, avg * 100)}%`
      }
    }

    function tick() {
      const a = getAnalyser?.()
      if (!a) {
        raf = requestAnimationFrame(tick)
        return
      }
      a.getByteFrequencyData(data)

      if (!confirmed) {
        const anyNonZero = data.some((v) => v > 2)
        if (anyNonZero) {
          confirmed = true
          barRefs.current.forEach((el) => {
            if (el) el.style.animation = 'none'
          })
          paint()
        } else if (++probeFrames > MAX_PROBE_FRAMES) {
          // Gave it a fair chance — genuinely no data coming through.
          // Stop the loop entirely and leave the CSS animation untouched.
          return
        }
      } else {
        paint()
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      barRefs.current.forEach((el) => {
        if (el) {
          el.style.animation = ''
          el.style.height = ''
        }
      })
    }
  }, [active, getAnalyser])

  return (
    <div className="flex items-end gap-[2.5px] h-3 flex-shrink-0" aria-hidden="true">
      {fallback.map((bar, i) => (
        <span
          key={i}
          ref={(el) => {
            barRefs.current[i] = el
          }}
          className="w-[3px] rounded-full"
          style={{
            background: ACCENT,
            height: active ? undefined : '3px',
            animation: active ? `${bar.anim} ${bar.duration} ease-in-out infinite` : 'none',
          }}
        />
      ))}
    </div>
  )
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function PlayerBar({ tracks }: { tracks: Track[] }) {
  const {
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
  } = useAudioQueue(tracks)
  const trackDurations = useTrackDurations(tracks)
  const [showQueue, setShowQueue] = useState(false)
  const [showVolume, setShowVolume] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [queueTab, setQueueTab] = useState<'queue' | 'recent' | 'most'>('queue')
  const panelRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const volumePanelRef = useRef<HTMLDivElement>(null)
  const volumeToggleRef = useRef<HTMLButtonElement>(null)

  // Click outside the queue panel (and not on the toggle button itself,
  // which has its own open/close handler) closes it. Same for the volume
  // popover. Escape closes whichever is open.
  useEffect(() => {
    if (!showQueue && !showVolume) return

    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node
      if (showQueue && !panelRef.current?.contains(target) && !toggleRef.current?.contains(target)) {
        setShowQueue(false)
      }
      if (
        showVolume &&
        !volumePanelRef.current?.contains(target) &&
        !volumeToggleRef.current?.contains(target)
      ) {
        setShowVolume(false)
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowQueue(false)
        setShowVolume(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKey)
    }
  }, [showQueue, showVolume])

  // Keyboard shortcuts — ignored while typing in an input/textarea so they
  // don't hijack normal text entry elsewhere on the page.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowRight':
          e.preventDefault()
          seek(Math.min(duration, position + 5))
          break
        case 'ArrowLeft':
          e.preventDefault()
          seek(Math.max(0, position - 5))
          break
        case 'ArrowUp':
          e.preventDefault()
          setVolume(volume + 0.1)
          break
        case 'ArrowDown':
          e.preventDefault()
          setVolume(volume - 0.1)
          break
        case 'KeyM':
          toggleMute()
          break
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [togglePlay, seek, position, duration, volume, setVolume, toggleMute])

  if (tracks.length === 0) return null

  const progressPct = duration > 0 ? (position / duration) * 100 : 0

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[94vw] max-w-2xl">
      {error && (
        <div
          className="mb-2 rounded-lg px-3 py-2 text-xs"
          style={{ background: 'rgba(200,60,60,0.15)', color: '#f2b8b8', border: '1px solid rgba(200,60,60,0.3)' }}
        >
          Couldn't play this track: {error}
        </div>
      )}

      {showQueue && (
        <div
          ref={panelRef}
          className="queue-scroll mb-2 rounded-2xl backdrop-blur-2xl border max-h-64 overflow-y-auto shadow-2xl"
          style={{ background: 'rgba(18,8,3,0.92)', borderColor: 'rgba(255,255,255,0.1)' }}
        >
          <div className="flex gap-1 px-3 pt-3 pb-1 sticky top-0 items-center justify-between" style={{ background: 'rgba(18,8,3,0.92)' }}>
            <div className="flex gap-1">
              <button
                onClick={() => setQueueTab('queue')}
                className="text-[11px] px-3 py-1 rounded-full transition-colors"
                style={{
                  color: queueTab === 'queue' ? '#160D08' : `${INK}99`,
                  background: queueTab === 'queue' ? ACCENT : 'transparent',
                }}
              >
                Queue
              </button>
              <button
                onClick={() => setQueueTab('recent')}
                className="text-[11px] px-3 py-1 rounded-full transition-colors flex items-center gap-1"
                style={{
                  color: queueTab === 'recent' ? '#160D08' : `${INK}99`,
                  background: queueTab === 'recent' ? ACCENT : 'transparent',
                }}
              >
                <HistoryIcon size={11} />
                Recent
              </button>
              <button
                onClick={() => setQueueTab('most')}
                className="text-[11px] px-3 py-1 rounded-full transition-colors flex items-center gap-1"
                style={{
                  color: queueTab === 'most' ? '#160D08' : `${INK}99`,
                  background: queueTab === 'most' ? ACCENT : 'transparent',
                }}
              >
                <TrendingIcon size={11} />
                Most Played
              </button>
            </div>
            {/* Mobile-only — the main bar hides these below `sm` for space. */}
            <div className="flex sm:hidden gap-1">
              <button
                onClick={() => setShuffle(!shuffle)}
                aria-label={shuffle ? 'Disable shuffle' : 'Enable shuffle'}
                aria-pressed={shuffle}
                className="w-7 h-7 flex items-center justify-center rounded-full"
                style={{ color: shuffle ? ACCENT : `${INK}88` }}
              >
                <ShuffleIcon size={13} />
              </button>
              <button
                onClick={cycleRepeatMode}
                aria-label={`Repeat: ${repeatMode}`}
                className="w-7 h-7 flex items-center justify-center rounded-full"
                style={{ color: repeatMode !== 'off' ? ACCENT : `${INK}88` }}
              >
                {repeatMode === 'one' ? <RepeatOneIcon size={13} /> : <RepeatIcon size={13} />}
              </button>
            </div>
          </div>

          {queueTab === 'queue' &&
            tracks.map((t, i) => (
              <button
                key={t.path}
                onClick={() => playAt(i)}
                className="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-3 transition-colors hover:bg-white/5"
                style={{ color: i === index ? ACCENT : `${INK}cc` }}
              >
                <span className="truncate flex items-center gap-2 min-w-0">
                  <span className="text-[10px] tabular-nums opacity-50 w-4 flex-shrink-0">{i + 1}</span>
                  <span className="truncate">{t.name}</span>
                </span>
                <span className="flex items-center gap-2 flex-shrink-0">
                  {i === index && <EqualizerBars active={!isPaused} />}
                  <span className="text-[10px] tabular-nums opacity-50">
                    {trackDurations[t.path] ? formatTime(trackDurations[t.path]) : '--:--'}
                  </span>
                </span>
              </button>
            ))}

          {queueTab === 'recent' &&
            (recentlyPlayed.length === 0 ? (
              <p className="px-4 py-4 text-xs" style={{ color: `${INK}66` }}>
                Nothing played yet this visit.
              </p>
            ) : (
              recentlyPlayed.map((entry) => {
                const trackIdx = tracks.findIndex((t) => t.name === entry.name)
                return (
                  <button
                    key={entry.playedAt}
                    onClick={() => trackIdx >= 0 && playAt(trackIdx)}
                    disabled={trackIdx < 0}
                    className="w-full text-left px-4 py-2.5 text-sm truncate transition-colors hover:bg-white/5 disabled:opacity-40"
                    style={{ color: `${INK}cc` }}
                  >
                    {entry.name}
                  </button>
                )
              })
            ))}

          {queueTab === 'most' &&
            (mostPlayed.length === 0 ? (
              <p className="px-4 py-4 text-xs" style={{ color: `${INK}66` }}>
                Nothing played yet this visit.
              </p>
            ) : (
              mostPlayed.map((entry) => {
                const trackIdx = tracks.findIndex((t) => t.name === entry.name)
                return (
                  <button
                    key={entry.name}
                    onClick={() => trackIdx >= 0 && playAt(trackIdx)}
                    disabled={trackIdx < 0}
                    className="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-3 transition-colors hover:bg-white/5 disabled:opacity-40"
                    style={{ color: `${INK}cc` }}
                  >
                    <span className="truncate">{entry.name}</span>
                    <span className="text-[10px] tabular-nums flex-shrink-0" style={{ color: `${ACCENT}bb` }}>
                      {entry.count}×
                    </span>
                  </button>
                )
              })
            ))}
        </div>
      )}

      <div
        className="relative rounded-[28px] backdrop-blur-2xl border px-4 py-3.5 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 shadow-[0_8px_40px_rgba(0,0,0,0.45)]"
        style={{
          background: 'linear-gradient(180deg, rgba(28,14,6,0.85), rgba(18,8,3,0.85))',
          borderColor: 'rgba(255,255,255,0.14)',
        }}
      >
        {/* subtle top highlight for a glass-edge feel */}
        <div
          className="absolute inset-x-0 top-0 h-px rounded-t-[28px]"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)' }}
        />

        {/* Row 1 (always): disc + title/seekbar. On mobile this is its own
            row; on sm+ it sits inline with the controls row below. */}
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto sm:flex-1 min-w-0">
          <button
            onClick={() => setShowInfo(true)}
            aria-label="Song info"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex-shrink-0 flex items-center justify-center relative cursor-pointer"
            style={{
              background: 'radial-gradient(circle at 35% 30%, #4a2712, #1c0d05 70%)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: 'inset 0 0 12px rgba(0,0,0,0.5)',
              animation: isPaused ? 'none' : 'spin 6s linear infinite',
            }}
          >
            {!isPaused && (
              <>
                <span
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{ border: `1px solid ${ACCENT}66`, animation: 'pulse-ring 2.2s ease-out infinite' }}
                />
                <span
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{ border: `1px solid ${ACCENT}44`, animation: 'pulse-ring 2.2s ease-out infinite 1.1s' }}
                />
              </>
            )}
            <MusicNoteIcon size={18} color={`${ACCENT}cc`} />
            <div className="absolute w-2 h-2 rounded-full" style={{ background: '#12080399' }} />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2 mb-1">
              <p className="text-[10px] font-medium tracking-wider uppercase" style={{ color: `${ACCENT}bb` }}>
                {isPaused ? 'Paused' : 'Now Playing'}
              </p>
              <p className="text-[10px] tabular-nums" style={{ color: `${INK}55` }}>
                {index + 1} / {tracks.length}
              </p>
              <EqualizerBars active={!isPaused} getAnalyser={getActiveAnalyser} />
            </div>
            <p className="text-[14px] sm:text-[15px] font-medium truncate mb-2" style={{ color: INK }}>
              {current?.name ?? 'No track'}
            </p>

            <div className="flex items-center gap-2.5">
              <span className="text-[10px] tabular-nums w-8" style={{ color: `${INK}77` }}>
                {formatTime(position)}
              </span>
              <SquigglySeekBar
                pct={progressPct}
                accent={ACCENT}
                playing={!isPaused}
                onChange={(pct) => duration > 0 && seek((pct / 100) * duration)}
              />
              <span className="text-[10px] tabular-nums w-8 text-right" style={{ color: `${INK}77` }}>
                {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>

        {/* Row 2 on mobile / inline on sm+: transport controls, centered
            so they don't hug one edge when they're on their own row. */}
        <div className="flex items-center justify-center sm:justify-end gap-1 flex-shrink-0 w-full sm:w-auto">
          <button
            onClick={() => setShuffle(!shuffle)}
            aria-label={shuffle ? 'Disable shuffle' : 'Enable shuffle'}
            aria-pressed={shuffle}
            className="hidden sm:flex w-7 h-7 items-center justify-center rounded-full transition-colors hover:bg-white/10"
            style={{ color: shuffle ? ACCENT : `${INK}88` }}
          >
            <ShuffleIcon size={14} />
          </button>
          <button
            onClick={prev}
            disabled={tracks.length < 2}
            aria-label="Previous track"
            className="w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-white/10 disabled:opacity-25"
            style={{ color: `${INK}cc` }}
          >
            <PrevIcon />
          </button>
          <button
            onClick={togglePlay}
            aria-label={isPaused ? 'Play' : 'Pause'}
            className="w-12 h-12 flex items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95"
            style={{ background: `linear-gradient(155deg, ${ACCENT}, #C97A3A)`, color: '#160D08', boxShadow: `0 4px 16px ${ACCENT}55` }}
          >
            {isPaused ? <PlayIcon size={20} /> : <PauseIcon size={20} />}
          </button>
          <button
            onClick={next}
            disabled={tracks.length < 2}
            aria-label="Next track"
            className="w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-white/10 disabled:opacity-25"
            style={{ color: `${INK}cc` }}
          >
            <NextIcon />
          </button>
          <button
            onClick={cycleRepeatMode}
            aria-label={`Repeat: ${repeatMode}`}
            className="hidden sm:flex w-7 h-7 items-center justify-center rounded-full transition-colors hover:bg-white/10"
            style={{ color: repeatMode !== 'off' ? ACCENT : `${INK}88` }}
          >
            {repeatMode === 'one' ? <RepeatOneIcon size={14} /> : <RepeatIcon size={14} />}
          </button>
          <button
            ref={volumeToggleRef}
            onClick={() => setShowVolume((s) => !s)}
            aria-label={volume === 0 ? 'Unmute' : 'Volume'}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-white/10 relative"
            style={{ color: showVolume ? ACCENT : `${INK}cc`, background: showVolume ? 'rgba(255,255,255,0.08)' : 'transparent' }}
          >
            {volume === 0 ? <VolumeMuteIcon /> : <VolumeHighIcon />}
            {showVolume && (
              <div
                ref={volumePanelRef}
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-11 left-1/2 -translate-x-1/2 rounded-full backdrop-blur-2xl border px-3 py-3 shadow-2xl"
                style={{ background: 'rgba(18,8,3,0.92)', borderColor: 'rgba(255,255,255,0.1)' }}
              >
                <div className="h-24 w-6 flex items-center justify-center">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={volume * 100}
                    onChange={(e) => setVolume(Number(e.target.value) / 100)}
                    aria-label="Volume"
                    style={{
                      writingMode: 'vertical-lr' as const,
                      direction: 'rtl',
                      width: 4,
                      height: 88,
                      accentColor: ACCENT,
                    }}
                  />
                </div>
              </div>
            )}
          </button>
          <button
            ref={toggleRef}
            onClick={() => setShowQueue((s) => !s)}
            aria-label="Toggle queue"
            className="w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-white/10 ml-0.5"
            style={{ color: showQueue ? ACCENT : `${INK}cc`, background: showQueue ? 'rgba(255,255,255,0.08)' : 'transparent' }}
          >
            <QueueIcon />
          </button>
        </div>
      </div>

      {showInfo && current && <SongInfoModal trackName={current.name} onClose={() => setShowInfo(false)} />}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(1.7); opacity: 0; }
        }
        @keyframes eqA { 0%, 100% { height: 30%; } 50% { height: 100%; } }
        @keyframes eqB { 0%, 100% { height: 60%; } 50% { height: 20%; } }
        @keyframes eqC { 0%, 100% { height: 40%; } 50% { height: 90%; } }
        @keyframes eqD { 0%, 100% { height: 80%; } 50% { height: 35%; } }
        @media (prefers-reduced-motion: reduce) {
          div[style*="animation"], span[style*="animation"] { animation: none !important; }
        }
      `}</style>
    </div>
  )
}
