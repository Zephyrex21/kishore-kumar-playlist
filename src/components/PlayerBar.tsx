import { useState } from 'react'
import { useAudioQueue } from '../hooks/useAudioQueue'
import type { Track } from '../hooks/useSupabaseQueue'
import { PlayIcon, PauseIcon, PrevIcon, NextIcon, QueueIcon, MusicNoteIcon } from './icons'

const ACCENT = '#E8A25A'
const INK = '#f2ece2'

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

  if (tracks.length === 0) return null

  const progressPct = duration > 0 ? (position / duration) * 100 : 0

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (duration === 0) return
    seek((Number(e.target.value) / 100) * duration)
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92vw] max-w-xl">
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
          className="mb-2 rounded-xl backdrop-blur-xl border max-h-56 overflow-y-auto"
          style={{ background: 'rgba(22,13,8,0.9)', borderColor: 'rgba(255,255,255,0.1)' }}
        >
          {tracks.map((t, i) => (
            <button
              key={t.path}
              onClick={() => playAt(i)}
              className="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors"
              style={{ color: i === index ? ACCENT : `${INK}cc` }}
            >
              <span className="truncate">{t.name}</span>
              {i === index && <PlayIcon size={12} color={ACCENT} />}
            </button>
          ))}
        </div>
      )}

      <div
        className="rounded-2xl backdrop-blur-xl border px-4 py-3.5 flex items-center gap-4 shadow-2xl"
        style={{ background: 'rgba(22,13,8,0.8)', borderColor: 'rgba(255,255,255,0.12)' }}
      >
        <div
          className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #3d1f0f, #1c110a)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <MusicNoteIcon size={18} color={`${ACCENT}aa`} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate" style={{ color: INK }}>
            {current?.name ?? 'No track'}
          </p>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] tabular-nums w-8" style={{ color: `${INK}77` }}>
              {formatTime(position)}
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={progressPct}
              onChange={handleScrub}
              step={0.1}
              aria-label="Seek"
              style={{ flex: 1, height: 4, accentColor: ACCENT }}
            />
            <span className="text-[10px] tabular-nums w-8 text-right" style={{ color: `${INK}77` }}>
              {formatTime(duration)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={prev}
            disabled={tracks.length < 2}
            aria-label="Previous track"
            className="w-8 h-8 flex items-center justify-center rounded-full disabled:opacity-30"
            style={{ color: `${INK}bb` }}
          >
            <PrevIcon />
          </button>
          <button
            onClick={togglePlay}
            aria-label={isPaused ? 'Play' : 'Pause'}
            className="w-11 h-11 flex items-center justify-center rounded-full"
            style={{ background: ACCENT, color: '#160D08' }}
          >
            {isPaused ? <PlayIcon size={18} /> : <PauseIcon size={18} />}
          </button>
          <button
            onClick={next}
            disabled={tracks.length < 2}
            aria-label="Next track"
            className="w-8 h-8 flex items-center justify-center rounded-full disabled:opacity-30"
            style={{ color: `${INK}bb` }}
          >
            <NextIcon />
          </button>
          <button
            onClick={() => setShowQueue((s) => !s)}
            aria-label="Toggle queue"
            className="w-8 h-8 flex items-center justify-center rounded-full ml-1"
            style={{ color: showQueue ? ACCENT : `${INK}bb` }}
          >
            <QueueIcon />
          </button>
        </div>
      </div>
    </div>
  )
}
