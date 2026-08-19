# Kishore Kumar — playlist

A tribute site: single-page player styled after the Raju Mistri playlist
site, songs served from a Supabase Storage bucket. React + Vite +
Tailwind v4. Installable as a PWA.

## Set up Supabase

1. Create a project at supabase.com (free tier is enough).
2. Storage → New bucket → name it `songs` → make it **public**.
3. Upload your audio files (mp3/wav/m4a/ogg/flac) directly into that
   bucket — no folders needed, root level is fine.
4. Project Settings → API → copy your Project URL and anon public key.
5. Copy `.env.example` to `.env` and paste those two values in.

Track titles are auto-generated from filenames — `roop-tera-mastana.mp3`
becomes "Roop Tera Mastana" in the queue.

## Run it

    npm install
    npm run dev

## Structure

- `src/lib/supabase.ts` — Supabase client + bucket name constant. Fails
  safely (doesn't crash the app) if `.env` is missing or invalid.
- `src/hooks/useSupabaseQueue.ts` — lists the bucket, builds the track queue
- `src/hooks/useAudioQueue.ts` — the real playback engine: dual `<audio>`
  elements for crossfading, shuffle/repeat, Media Session API (lock-screen
  controls), Web Audio analyser for the visualizer, volume + recently-played
  persistence via localStorage
- `src/hooks/useTrackDurations.ts` — preloads each track's duration
  (metadata only, not the full file) for the queue list
- `src/components/PlayerBar.tsx` — the floating glass player, queue/recent
  panel, volume popover, keyboard shortcuts (Space/arrows/M)
- `src/components/SongInfoModal.tsx` + `src/data/songMeta.ts` — the
  film/year/composer/poetic-line popup, keyed by track title. Static file
  for now — see the comment in `songMeta.ts` for the upgrade path to a
  Supabase table if you want to edit it without redeploying.
- `src/components/BioModal.tsx` — Kishore Kumar biography modal
- `src/components/LoadingScreen.tsx` — splash screen shown until the hero
  image loads (plus a minimum display time so it doesn't just flash)
- `public/images/hero.jpg` / `hero.webp` — background photo, served via
  `<picture>` (WebP first, JPEG fallback)
- `public/icons/` + `public/favicon.svg` — the disc-motif icon set (app
  icons, favicon, PWA manifest icons — all generated from one master design
  so they stay visually consistent)
- PWA support via `vite-plugin-pwa` (configured in `vite.config.ts`) —
  generates the manifest and service worker automatically at build time,
  precaching the app shell. Audio files are deliberately NOT precached
  (they're large and change independently via Supabase uploads).

## Deploying

Deploy to Vercel same as always. Remember to add the two
`VITE_SUPABASE_*` env vars in the Vercel project settings, not just
locally — the build will succeed either way (it fails safely), but the
player will show "not configured" until those are set in production too.
