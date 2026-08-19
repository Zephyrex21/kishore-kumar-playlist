type Props = {
  peaks: number[]
  pct: number // 0–100
  onChange: (pct: number) => void
  accent: string
}

/**
 * Same interaction pattern as SeekBar (visual bars + an invisible range
 * input handling the actual drag/click), but rendering real amplitude
 * data instead of a plain line.
 */
export default function WaveformSeekBar({ peaks, pct, onChange, accent }: Props) {
  const playedCount = Math.round((pct / 100) * peaks.length)

  return (
    <div className="relative w-full h-4 flex items-end gap-[1.5px] group">
      {peaks.map((p, i) => (
        <div
          key={i}
          className="flex-1 rounded-full transition-colors duration-150"
          style={{
            height: `${Math.max(14, p * 100)}%`,
            background: i < playedCount ? accent : 'rgba(255,255,255,0.22)',
          }}
        />
      ))}
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
