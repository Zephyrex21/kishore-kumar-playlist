type Props = {
  pct: number // 0–100
  onChange: (pct: number) => void
  accent: string
}

/**
 * Custom seek bar — a native <input type="range"> alone renders as a plain
 * OS-styled slider that looks cheap no matter what CSS you throw at it
 * cross-browser. This layers a styled track + fill + thumb visually, with
 * a fully transparent range input on top handling the actual drag/click.
 */
export default function SeekBar({ pct, onChange, accent }: Props) {
  return (
    <div className="relative w-full h-4 flex items-center group">
      <div className="absolute inset-x-0 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.18)' }} />
      <div
        className="absolute left-0 h-1 rounded-full transition-[width] duration-100"
        style={{ width: `${pct}%`, background: accent }}
      />
      <div
        className="absolute w-3 h-3 rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.5)] scale-0 group-hover:scale-100 transition-transform pointer-events-none"
        style={{ left: `calc(${pct}% - 6px)`, background: accent }}
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
