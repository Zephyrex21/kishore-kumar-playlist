import { useEffect, useRef } from 'react'
import { songMeta } from '../data/songMeta'

const ACCENT = '#E8A25A'
const INK = '#fdf6ec'

type Props = {
  trackName: string
  onClose: () => void
}

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
      className="fixed inset-0 z-[60] flex items-center justify-center px-6"
      style={{ background: 'rgba(10,5,2,0.55)' }}
    >
      <div
        ref={cardRef}
        className="w-full max-w-xs rounded-2xl backdrop-blur-2xl border p-6 shadow-2xl fade-in-up"
        style={{ background: 'rgba(22,12,5,0.95)', borderColor: 'rgba(255,255,255,0.14)' }}
      >
        <p className="text-[10px] font-medium tracking-wider uppercase mb-2" style={{ color: `${ACCENT}bb` }}>
          Now Playing
        </p>
        <h3 className="text-lg font-medium mb-4" style={{ color: INK, fontFamily: 'var(--font-voice)' }}>
          {trackName}
        </h3>

        {meta ? (
          <dl className="space-y-2.5">
            <div className="flex justify-between text-sm">
              <dt style={{ color: `${INK}88` }}>Film</dt>
              <dd style={{ color: INK }}>{meta.film}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt style={{ color: `${INK}88` }}>Year</dt>
              <dd style={{ color: INK }}>{meta.year}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm" style={{ color: `${INK}77` }}>
            Details for this song haven't been added yet.
          </p>
        )}

        <button
          onClick={onClose}
          className="mt-5 w-full text-center text-xs py-2 rounded-full transition-colors hover:bg-white/10"
          style={{ color: `${INK}aa`, border: '1px solid rgba(255,255,255,0.12)' }}
        >
          Close
        </button>
      </div>
    </div>
  )
}
