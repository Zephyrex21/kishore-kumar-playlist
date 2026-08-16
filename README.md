# Kishore Kumar — playlist

Single-page player, styled after the Raju Mistri playlist site. React +
Vite + Tailwind v4, songs served from a Supabase Storage bucket — no
Spotify, no third-party player chrome.

## Set up Supabase

1. Create a project at supabase.com (free tier is enough).
2. Storage → New bucket → name it `songs` → make it **public**.
3. Upload your audio files (mp3/wav/m4a/ogg/flac) directly into that
   bucket — no folders needed, root level is fine.
4. Project Settings → API → copy your Project URL and anon public key.
5. Copy `.env.example` to `.env` and paste those two values in.

Track titles are auto-generated from filenames — `roop-tera-mastana.mp3`
becomes "Roop Tera Mastana" in the queue. Rename files before uploading
if you want cleaner titles, or tell Claude and we'll add a metadata
manifest instead of relying on filenames.

## Run it

    npm install
    npm run dev

## Structure

- `src/lib/supabase.ts` — Supabase client + bucket name constant
- `src/hooks/useSupabaseQueue.ts` — lists the bucket, builds the track queue
- `src/hooks/useAudioQueue.ts` — real `<audio>` element playback: play,
  pause, seek, next, prev, auto-advance on track end
- `src/components/PlayerBar.tsx` — the floating glass player + queue list
- `src/utils/halftone.ts` — canvas-based dot-screen image converter
- `src/components/HalftonePortrait.tsx` — wraps the halftone converter,
  reads from `public/images/hero.jpg`

## Still to do

1. Drop a real photo at `public/images/hero.jpg` (see public/images/README.md)
2. Create the Supabase project + bucket + `.env` (see above)
3. Deploy to Vercel — remember to add the two `VITE_SUPABASE_*` env vars
   in the Vercel project settings too, not just locally
