import { useEffect, useRef, useState } from 'react'
import { useAudioQueue } from '../hooks/useAudioQueue'
import type { Track } from '../hooks/useSupabaseQueue'
import { PlayIcon, PauseIcon, PrevIcon, NextIcon, QueueIcon, MusicNoteIcon } from './icons'
import SeekBar from './SeekBar'

const ACCENT = '#E8A25A'
const INK = '#fdf6ec'

function EqualizerBars({ active }: { active: boolean }) {
  const bars = [
    { anim: 'eqA', duration: '0.8s' },
    { anim: 'eqB', duration: '1.1s' },
    { anim: 'eqC', duration: '0.9s' },
    { anim: 'eqD', duration: '1.3s' },
  ]
  return (
    <div className="flex items-end gap-[2.5px] h-3 flex-shrink-0" aria-hidden="true">
      {bars.map((bar, i) => (
        <span
          key={i}
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
  const { current, index, isPaused, position, duration, error, togglePlay, next, prev, playAt, seek } =
    useAudioQueue(tracks)
  const [showQueue, setShowQueue] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  // Click outside the queue panel (and not on the toggle button itself,
  // which has its own open/close handler) closes it. Escape does too.
  useEffect(() => {
    if (!showQueue) return

    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node
      if (panelRef.current?.contains(target)) return
      if (toggleRef.current?.contains(target)) return
      setShowQueue(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowQueue(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKey)
    }
  }, [showQueue])

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
          className="queue-scroll mb-2 rounded-2xl backdrop-blur-2xl border max-h-56 overflow-y-auto shadow-2xl"
          style={{ background: 'rgba(18,8,3,0.92)', borderColor: 'rgba(255,255,255,0.1)' }}
        >
          {tracks.map((t, i) => (
            <button
              key={t.path}
              onClick={() => playAt(i)}
              className="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors hover:bg-white/5"
              style={{ color: i === index ? ACCENT : `${INK}cc` }}
            >
              <span className="truncate flex items-center gap-2">
                <span className="text-[10px] tabular-nums opacity-50 w-4">{i + 1}</span>
                {t.name}
              </span>
              {i === index && <EqualizerBars active={!isPaused} />}
            </button>
          ))}
        </div>
      )}

      <div
        className="relative rounded-[28px] backdrop-blur-2xl border px-5 py-4 flex items-center gap-4 shadow-[0_8px_40px_rgba(0,0,0,0.45)]"
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

        <div
          className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center relative"
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
          <MusicNoteIcon size={20} color={`${ACCENT}cc`} />
          <div className="absolute w-2 h-2 rounded-full" style={{ background: '#12080399' }} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 mb-1">
            <p className="text-[10px] font-medium tracking-wider uppercase" style={{ color: `${ACCENT}bb` }}>
              {isPaused ? 'Paused' : 'Now Playing'}
            </p>
            <p className="text-[10px] tabular-nums" style={{ color: `${INK}55` }}>
              {index + 1} / {tracks.length}
            </p>
            <EqualizerBars active={!isPaused} />
          </div>
          <p className="text-[15px] font-medium truncate mb-2" style={{ color: INK }}>
            {current?.name ?? 'No track'}
          </p>

          <div className="flex items-center gap-2.5">
            <span className="text-[10px] tabular-nums w-8" style={{ color: `${INK}77` }}>
              {formatTime(position)}
            </span>
            <SeekBar
              pct={progressPct}
              accent={ACCENT}
              onChange={(pct) => duration > 0 && seek((pct / 100) * duration)}
            />
            <span className="text-[10px] tabular-nums w-8 text-right" style={{ color: `${INK}77` }}>
              {formatTime(duration)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
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
