export type SongMeta = {
  film: string
  year: number
  composer: string
  /**
   * An original, evocative one-liner capturing the song's mood — written
   * fresh, NOT a translation or quotation of the actual lyrics (copyright).
   */
  poeticLine: string
}

/**
 * Static metadata lookup, keyed by the exact track title as it appears in
 * the player (derived from the Supabase filename). This is v1 — a plain
 * JSON-shaped file, zero infrastructure, ships immediately.
 *
 * Upgrade path if you later want to edit this without redeploying code:
 * move it into a `song_metadata` table in your EXISTING Supabase project
 * (you already have the client + credentials wired up) rather than adding
 * a separate database. Same shape, just fetched instead of imported.
 *
 * Keys must match the track title exactly as shown in the player. If a
 * song's title isn't in here, the info modal shows a friendly "not added
 * yet" message instead of guessing — add more entries as you confirm them.
 */
export const songMeta: Record<string, SongMeta> = {
  'Aanewala Pal Janewala Hai (1978)': {
    film: 'Gol Maal',
    year: 1979,
    composer: 'R. D. Burman',
    poeticLine: 'A meditation on time slipping through open hands, sung like a lullaby to the present moment.',
  },
  'Chala Jata Hoon Mere Jeevan Saathi (1972)': {
    film: 'Mere Jeevan Saathi',
    year: 1972,
    composer: 'R. D. Burman',
    poeticLine: "A restless wanderer's tune, half yodel and half heartbeat, forever chasing the horizon.",
  },
  'Mere Mehboob Qayamat Hogi (1964)': {
    film: 'Mr. X in Bombay',
    year: 1964,
    composer: 'Laxmikant–Pyarelal',
    poeticLine: "A lover's dramatic vow, equal parts devotion and delicious threat.",
  },
  'Meri Bheegi Bheegi Si Palko Pe Reh Gaye (1973)': {
    film: 'Anamika',
    year: 1973,
    composer: 'R. D. Burman',
    poeticLine: 'Rain-soaked longing, sung in the hush that follows heartbreak.',
  },
  'Neele Neele Ambar Par (1983)': {
    film: 'Kalaakaar',
    year: 1983,
    composer: 'Kalyanji–Anandji',
    poeticLine: 'A monsoon serenade to the moon — soft blue longing and rain-washed romance.',
  },
  'O Mere Dil Ke Chain Mere Jeevan Saathi (1972)': {
    film: 'Mere Jeevan Saathi',
    year: 1972,
    composer: 'R. D. Burman',
    poeticLine: 'The gentlest kind of devotion — a heart asking only for peace, not promises.',
  },
}
