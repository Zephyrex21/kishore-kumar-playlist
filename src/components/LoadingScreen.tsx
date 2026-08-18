import { MusicNoteIcon } from './icons'

const ACCENT = '#E8A25A'

/**
 * Full-screen splash shown until the hero image is ready (plus a minimum
 * display time so it doesn't just flash on fast connections — see App.tsx).
 * Reuses the same spinning-disc visual language as the player bar's icon
 * so the loading state feels like part of the same object, not a generic
 * spinner bolted on.
 */
export default function LoadingScreen({ fading }: { fading: boolean }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-500"
      style={{
        background: 'radial-gradient(circle at 50% 42%, #C4491A 0%, #7a2012 65%, #3d0f09 100%)',
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      <div className="relative w-20 h-20 mb-7">
        <span
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ border: `1px solid ${ACCENT}66`, animation: 'pulse-ring 2s ease-out infinite' }}
        />
        <span
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ border: `1px solid ${ACCENT}44`, animation: 'pulse-ring 2s ease-out infinite 1s' }}
        />
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center relative"
          style={{
            background: 'radial-gradient(circle at 35% 30%, #4a2712, #1c0d05 70%)',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: 'inset 0 0 16px rgba(0,0,0,0.5)',
            animation: 'spin 2.4s linear infinite',
          }}
        >
          <MusicNoteIcon size={28} color={`${ACCENT}dd`} />
          <div className="absolute w-2.5 h-2.5 rounded-full" style={{ background: '#12080399' }} />
        </div>
      </div>

      <p className="text-2xl mb-1" style={{ fontFamily: 'var(--font-devanagari)', color: '#fdf6ec' }}>
        किशोर कुमार
      </p>
      <p className="text-[11px] tracking-[0.2em] uppercase" style={{ color: `${ACCENT}aa` }}>
        Loading
      </p>
    </div>
  )
}
