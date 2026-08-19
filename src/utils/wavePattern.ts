export const WAVE_TILE_WIDTH = 48

/**
 * A tileable sine-wave SVG tile, used as a repeating background-image.
 * One smooth up-down cycle across 48px, symmetric start/end so repeat-x
 * tiles seamlessly with no visible seam.
 */
export function wavePatternDataUri(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WAVE_TILE_WIDTH}" height="16" viewBox="0 0 ${WAVE_TILE_WIDTH} 16"><path d="M0,8 C12,3 12,3 24,8 C36,13 36,13 48,8" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round"/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}
