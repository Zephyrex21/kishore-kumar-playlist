import { useEffect, useState } from 'react'
import { useSupabaseQueue } from './hooks/useSupabaseQueue'
import PlayerBar from './components/PlayerBar'
import BioModal from './components/BioModal'
import LoadingScreen from './components/LoadingScreen'
import { GithubIcon, InfoIcon } from './components/icons'

const GITHUB_URL = 'https://github.com/Zephyrex21/kishore-kumar-playlist'
const SPLASH_MIN_MS = 900 // keeps the splash from just flashing on fast connections
const SPLASH_FADE_MS = 550 // must be >= LoadingScreen's CSS transition duration

export default function App() {
  const { tracks, isLoading, error } = useSupabaseQueue()
  const [showBio, setShowBio] = useState(false)
  const [imageReady, setImageReady] = useState(false)
  const [minTimeElapsed, setMinTimeElapsed] = useState(false)
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setMinTimeElapsed(true), SPLASH_MIN_MS)
    return () => clearTimeout(t)
  }, [])

  const splashDone = imageReady && minTimeElapsed

  useEffect(() => {
    if (!splashDone) return
    const t = setTimeout(() => setShowSplash(false), SPLASH_FADE_MS)
    return () => clearTimeout(t)
  }, [splashDone])

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
        className="absolute inset-0 w-full h-full object-cover fade-in-image"
        style={{ objectPosition: '32% 22%' }}
        onLoad={() => setImageReady(true)}
        onError={() => setImageReady(true)} // don't let a broken image lock the splash forever
      />

      {/* Darkens the lower band so the floating player bar stays legible
          regardless of what's behind it. */}
      <div
        className="absolute inset-x-0 bottom-0 h-56 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, transparent, #1c0c04cc)' }}
      />

      {/* Subtle film-grain texture — cinematic depth, kept faint enough to
          read as texture rather than noise. Self-generated SVG turbulence,
          not a stock asset. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'160\' height=\'160\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'2\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
          mixBlendMode: 'overlay',
          opacity: 0.05,
        }}
      />

      <div className="absolute top-10 right-6 md:top-16 md:right-16 text-right z-10 fade-in-up">
        <h1
          className="leading-[0.95] text-[15vw] md:text-[6.5rem]"
          style={{ fontFamily: 'var(--font-devanagari)', color: '#fdf6ec' }}
        >
          किशोर कुमार
        </h1>
        <p className="italic text-2xl md:text-4xl mt-1" style={{ fontFamily: 'var(--font-voice)', color: '#F4D9A8' }}>
          Playlist
        </p>
      </div>

      {isLoading && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[94vw] max-w-2xl animate-pulse">
          <div
            className="rounded-[28px] backdrop-blur-2xl border px-5 py-4 flex items-center gap-4"
            style={{
              background: 'linear-gradient(180deg, rgba(28,14,6,0.7), rgba(18,8,3,0.7))',
              borderColor: 'rgba(255,255,255,0.12)',
            }}
          >
            <div className="w-14 h-14 rounded-full flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="flex-1 space-y-2.5">
              <div className="h-2 w-28 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <div className="h-3 w-44 rounded-full" style={{ background: 'rgba(255,255,255,0.14)' }} />
              <div className="h-1 w-full rounded-full mt-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
            </div>
          </div>
        </div>
      )}

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

      <button
        onClick={() => setShowBio(true)}
        aria-label="About Kishore Kumar"
        className="fixed bottom-6 left-6 z-50 w-11 h-11 flex items-center justify-center rounded-full backdrop-blur-xl border transition-transform hover:scale-110"
        style={{ background: 'rgba(18,8,3,0.75)', borderColor: 'rgba(255,255,255,0.15)', color: '#fdf6ecdd' }}
      >
        <InfoIcon size={20} />
      </button>

      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="View source on GitHub"
        className="fixed bottom-6 right-6 z-50 w-11 h-11 flex items-center justify-center rounded-full backdrop-blur-xl border transition-transform hover:scale-110"
        style={{ background: 'rgba(18,8,3,0.75)', borderColor: 'rgba(255,255,255,0.15)', color: '#fdf6ecdd' }}
      >
        <GithubIcon size={20} />
      </a>

      {showBio && <BioModal onClose={() => setShowBio(false)} />}

      {showSplash && <LoadingScreen fading={splashDone} />}

      <PlayerBar tracks={tracks} />
    </main>
  )
}
