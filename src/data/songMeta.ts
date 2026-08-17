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
 * Static metadata lookup. This is v1 — a plain JSON-shaped file, zero
 * infrastructure, ships immediately.
 *
 * Upgrade path if you later want to edit this without redeploying code:
 * move it into a `song_metadata` table in your EXISTING Supabase project
 * (you already have the client + credentials wired up) rather than adding
 * a separate database. Same shape, just fetched instead of imported.
 *
 * Lookup is normalized (see lookupSongMeta below) — case, hyphens, and
 * parentheses in the key don't need to match the runtime title exactly,
 * since real filenames are inconsistent about these (e.g. some include
 * the year, some don't; some use "-" as a separator, some just a space).
 */
export const songMeta: Record<string, SongMeta> = {
  'Zindagi Pyar Ka Geet Haimale Souten (1983)': {
    film: 'Souten',
    year: 1983,
    composer: 'Usha Khanna',
    poeticLine: 'A brave little philosophy — that life is a song worth singing, even through the tears.',
  },
  'Yeh Sham Mastani (1971)': {
    film: 'Kati Patang',
    year: 1970,
    composer: 'R. D. Burman',
    poeticLine: 'Golden-hour intoxication, when the evening itself seems to be falling in love.',
  },
  'Panna Ki Tamanna Hai Heera Panna (1973)': {
    film: 'Heera Panna',
    year: 1973,
    composer: 'R. D. Burman',
    poeticLine: 'A playful game of hide-and-seek, dressed up in the language of jewels.',
  },
  'Pal Pal Dil Ke Paas': {
    film: 'Blackmail',
    year: 1973,
    composer: 'Kalyanji–Anandji',
    poeticLine: 'A quiet promise of nearness, moment by moment, unwavering.',
  },
  'O Saathi Re Male Muqaddar Ka Sikandar (1978)': {
    film: 'Muqaddar Ka Sikandar',
    year: 1978,
    composer: 'Kalyanji–Anandji',
    poeticLine: 'A lament to a companion lost to fate, tender even in its heartbreak.',
  },
  'O Mere Dil Ke Chain Mere Jeevan Saathi (1972)': {
    film: 'Mere Jeevan Saathi',
    year: 1972,
    composer: 'R. D. Burman',
    poeticLine: 'The gentlest kind of devotion — a heart asking only for peace, not promises.',
  },
  'Neele Neele Ambar Par (1983)': {
    film: 'Kalaakaar',
    year: 1983,
    composer: 'Kalyanji–Anandji',
    poeticLine: 'A monsoon serenade to the moon — soft blue longing and rain-washed romance.',
  },
  'Meri Bheegi Bheegi Si Palko Pe Reh Gaye (1973)': {
    film: 'Anamika',
    year: 1973,
    composer: 'R. D. Burman',
    poeticLine: 'Rain-soaked longing, sung in the hush that follows heartbreak.',
  },
  'Mere Samnewali Khidki Mein (1968)': {
    film: 'Padosan',
    year: 1968,
    composer: 'R. D. Burman',
    poeticLine: 'A mischievous serenade to the girl next door, sung across a windowsill.',
  },
  'Intaha Ho Gai Intezar Ki - Sharaabi (1984)': {
    film: 'Sharaabi',
    year: 1984,
    composer: 'Bappi Lahiri',
    poeticLine: 'The exact moment patience runs out and heartbreak takes over.',
  },
  'Haal Kya Hai Dilon Ka (1973)': {
    film: 'Anokhi Ada',
    year: 1973,
    composer: 'Laxmikant–Pyarelal',
    poeticLine: 'A cheeky qawwali confession, half tease, half surrender.',
  },
  'Ek Ladki Bheegi Bhagi Si - Chalti Ka Naam Gaadi (1958)': {
    film: 'Chalti Ka Naam Gaadi',
    year: 1958,
    composer: 'S. D. Burman',
    poeticLine: 'A chance meeting in the rain, told with the shy delight of it happening for the first time.',
  },
  'Ek Hasina Thi Ek Diwana Tha - Karz (1980)': {
    film: 'Karz',
    year: 1980,
    composer: 'Laxmikant–Pyarelal',
    poeticLine: 'A love story told like a legend already being retold — larger than the two people living it.',
  },
  'Dream Girl - Dream Girl (1977)': {
    film: 'Dream Girl',
    year: 1977,
    composer: 'Laxmikant–Pyarelal',
    poeticLine: 'An ode to the woman every song seems to be searching for.',
  },
  'Chala Jata Hoon Mere Jeevan Saathi (1972)': {
    film: 'Mere Jeevan Saathi',
    year: 1972,
    composer: 'R. D. Burman',
    poeticLine: "A restless wanderer's tune, half yodel and half heartbeat, forever chasing the horizon.",
  },
  'Bheegi Bheegi Raaton Mein - Ajanabee (1974)': {
    film: 'Ajnabee',
    year: 1974,
    composer: 'R. D. Burman',
    poeticLine: 'Rain as an excuse for closeness, and closeness as its own kind of weather.',
  },
  'Aanewala Pal Janewala Hai (1978)': {
    film: 'Gol Maal',
    year: 1979,
    composer: 'R. D. Burman',
    poeticLine: 'A meditation on time slipping through open hands, sung like a lullaby to the present moment.',
  },
  // No year in this file's actual name (confirmed from the live player) —
  // unlike every other track here, so it's kept year-less on purpose.
  'Mere Mehboob Qayamat Hogi': {
    film: 'Mr. X in Bombay',
    year: 1964,
    composer: 'Laxmikant–Pyarelal',
    poeticLine: "A lover's dramatic vow, equal parts devotion and delicious threat.",
  },
}

function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/[()\-_.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const normalizedMeta: Record<string, SongMeta> = Object.fromEntries(
  Object.entries(songMeta).map(([k, v]) => [normalizeKey(k), v]),
)

/**
 * Looks up metadata by track title, ignoring case/hyphen/parenthesis
 * differences between the stored key and the runtime title (which comes
 * from a raw filename and can vary in punctuation). Falls back to
 * stripping a trailing "(YYYY)" year if the exact normalized form isn't
 * found, since a few files include the year and a few don't.
 */
export function lookupSongMeta(trackName: string): SongMeta | undefined {
  const direct = normalizedMeta[normalizeKey(trackName)]
  if (direct) return direct
  const withoutYear = trackName.replace(/\(?\b(19|20)\d{2}\)?\s*$/, '').trim()
  return normalizedMeta[normalizeKey(withoutYear)]
}
