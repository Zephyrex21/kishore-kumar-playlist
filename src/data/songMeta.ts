export type SongMeta = {
  film: string
  year: number
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
  'Aanewala Pal Janewala Hai (1978)': { film: 'Gol Maal', year: 1979 },
  'Chala Jata Hoon Mere Jeevan Saathi (1972)': { film: 'Mere Jeevan Saathi', year: 1972 },
  'Mere Mehboob Qayamat Hogi (1964)': { film: 'Mr. X in Bombay', year: 1964 },
  'Meri Bheegi Bheegi Si Palko Pe Reh Gaye (1973)': { film: 'Anamika', year: 1973 },
  'Neele Neele Ambar Par (1983)': { film: 'Kalaakaar', year: 1983 },
  'O Mere Dil Ke Chain Mere Jeevan Saathi (1972)': { film: 'Mere Jeevan Saathi', year: 1972 },
}
