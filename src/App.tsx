import { useSupabaseQueue } from './hooks/useSupabaseQueue'
import PlayerBar from './components/PlayerBar'

export default function App() {
  const { tracks, isLoading, error } = useSupabaseQueue()

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* Pre-styled image, used as-is — no filters or effects. object-cover
          fills the viewport with no empty bands; object-position is anchored
          toward the subject (roughly where his face sits in the source) so
          on narrower/taller windows the crop eats into empty background
          first, not his face. */}
      <img
        src="/images/hero.jpg"
        alt="Kishore Kumar"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: '32% center' }}
      />

      {/* Darkens the lower band so the floating player bar stays legible
          regardless of what's behind it. */}
      <div
        className="absolute inset-x-0 bottom-0 h-56 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, transparent, #1c0c04cc)' }}
      />

      <div className="absolute top-10 right-6 md:top-16 md:right-16 text-right z-10">
        <h1
          className="leading-[0.95] text-[15vw] md:text-[6.5rem] font-bold"
          style={{ fontFamily: 'var(--font-devanagari)', color: '#fdf6ec' }}
        >
          किशोर कुमार
        </h1>
        <p className="italic text-2xl md:text-4xl mt-1" style={{ fontFamily: 'var(--font-voice)', color: '#F4D9A8' }}>
          Playlist
        </p>
      </div>

      {error && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 text-xs px-4 py-2 rounded-lg"
          style={{ background: 'rgba(0,0,0,0.35)', color: '#f8d0c0', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          Couldn't load songs from Supabase: {error}
        </div>
      )}

      {!error && !isLoading && tracks.length === 0 && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 text-xs px-4 py-2 rounded-lg"
          style={{ background: 'rgba(0,0,0,0.3)', color: '#fdf6ecaa', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          No songs found yet — upload some audio files to your Supabase "songs" bucket.
        </div>
      )}

      <PlayerBar tracks={tracks} />
    </main>
  )
}
