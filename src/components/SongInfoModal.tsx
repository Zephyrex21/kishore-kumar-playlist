import { useEffect, useRef } from 'react'
import { songMeta } from '../data/songMeta'

const ACCENT = '#E8A25A'
const INK = '#fdf6ec'

type Props = {
  trackName: string
  onClose: () => void
}

/**
 * Anchored popover, not a full-screen modal — sits just above the player
 * bar's disc icon (the outer PlayerBar wrapper is `fixed`, which is what
 * makes this `absolute` positioning work relative to it).
 */
export default function SongInfoModal({ trackName, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const meta = songMeta[trackName]

  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      if (!cardRef.current?.contains(e.target as Node)) onClose()
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  return (
    <div
      ref={cardRef}
      className="absolute bottom-full left-5 mb-3 w-[calc(100vw-2.5rem)] max-w-[300px] rounded-2xl backdrop-blur-2xl border p-5 shadow-2xl fade-in-up z-50"
      style={{ background: 'rgba(22,12,5,0.96)', borderColor: 'rgba(255,255,255,0.14)' }}
    >
      {/* Small pointer connecting the card back down to the disc icon */}
      <div
        className="absolute -bottom-[7px] left-8 w-3.5 h-3.5 rotate-45 border-r border-b"
        style={{ background: 'rgba(22,12,5,0.96)', borderColor: 'rgba(255,255,255,0.14)' }}
      />

      <p className="text-[10px] font-medium tracking-wider uppercase mb-2" style={{ color: `${ACCENT}bb` }}>
        Now Playing
      </p>
      <h3 className="text-lg leading-snug mb-4" style={{ color: INK, fontFamily: 'var(--font-voice)' }}>
        {trackName}
      </h3>

      {meta ? (
        <>
          <dl className="space-y-2.5 mb-4">
            <div className="flex justify-between text-sm gap-4">
              <dt style={{ color: `${INK}88` }}>Film</dt>
              <dd className="text-right" style={{ color: INK }}>{meta.film}</dd>
            </div>
            <div className="flex justify-between text-sm gap-4">
              <dt style={{ color: `${INK}88` }}>Year</dt>
              <dd style={{ color: INK }}>{meta.year}</dd>
            </div>
            <div className="flex justify-between text-sm gap-4">
              <dt style={{ color: `${INK}88` }}>Composer</dt>
              <dd className="text-right" style={{ color: INK }}>{meta.composer}</dd>
            </div>
          </dl>
          <p
            className="text-sm italic leading-relaxed pt-3 border-t"
            style={{ color: `${INK}cc`, fontFamily: 'var(--font-voice)', borderColor: 'rgba(255,255,255,0.1)' }}
          >
            {meta.poeticLine}
          </p>
        </>
      ) : (
        <p className="text-sm" style={{ color: `${INK}77` }}>
          Details for this song haven't been added yet.
        </p>
      )}
    </div>
  )
}
