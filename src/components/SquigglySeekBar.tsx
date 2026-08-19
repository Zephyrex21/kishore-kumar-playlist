import { wavePatternDataUri, WAVE_TILE_WIDTH } from '../utils/wavePattern'

type Props = {
  pct: number // 0–100
  onChange: (pct: number) => void
  accent: string
  playing: boolean
}

/**
 * A continuously-undulating wavy line, the way most premium music apps
 * render "sound is moving" without needing real audio data — two identical
 * tiled wave patterns stacked (dim base + accent), the accent one cropped
 * to the played portion via clip-path (not width%, which would squash the
 * pattern as progress changes). Both share the same scrolling animation so
 * they stay perfectly in sync.
 */
export default function SquigglySeekBar({ pct, onChange, accent, playing }: Props) {
  const sharedStyle = {
    backgroundRepeat: 'repeat-x' as const,
    backgroundSize: `${WAVE_TILE_WIDTH}px 100%`,
    animation: playing ? 'wave-scroll 1.4s linear infinite' : 'none',
  }

  return (
    <div className="relative w-full h-4 flex items-center group">
      <div
        className="absolute inset-0"
        style={{ backgroundImage: wavePatternDataUri('rgba(255,255,255,0.28)'), ...sharedStyle }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: wavePatternDataUri(accent),
          ...sharedStyle,
          clipPath: `inset(0 ${100 - pct}% 0 0)`,
        }}
      />
      <input
        type="range"
        min={0}
        max={100}
        step={0.1}
        value={pct}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Seek"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
    </div>
  )
}
