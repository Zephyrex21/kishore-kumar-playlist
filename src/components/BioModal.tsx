import { useEffect, useRef } from 'react'

const ACCENT = '#E8A25A'
const INK = '#fdf6ec'

type SectionProps = { title: string; children: React.ReactNode }
function Section({ title, children }: SectionProps) {
  return (
    <div className="mb-5 break-inside-avoid">
      <p className="text-[10px] font-medium tracking-wider uppercase mb-1.5" style={{ color: `${ACCENT}bb` }}>
        {title}
      </p>
      <p className="text-[13.5px] leading-relaxed" style={{ color: `${INK}dd` }}>
        {children}
      </p>
    </div>
  )
}

export default function BioModal({ onClose }: { onClose: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      if (!cardRef.current?.contains(e.target as Node)) onClose()
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-8" style={{ background: 'rgba(10,5,2,0.65)' }}>
      <div
        ref={cardRef}
        className="queue-scroll w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl backdrop-blur-2xl border shadow-2xl fade-in-up"
        style={{ background: 'rgba(20,11,5,0.97)', borderColor: 'rgba(255,255,255,0.14)' }}
      >
        <div className="relative h-36 overflow-hidden rounded-t-3xl">
          <img
            src="/images/hero.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: '32% 22%' }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(20,11,5,0.2), rgba(20,11,5,0.97))' }} />
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md"
            style={{ background: 'rgba(0,0,0,0.4)', color: INK }}
          >
            ×
          </button>
        </div>

        <div className="px-8 pb-6 -mt-8 relative">
          <h2 className="text-3xl mb-0.5" style={{ fontFamily: 'var(--font-devanagari)', color: INK }}>
            किशोर कुमार
          </h2>
          <p className="text-sm italic mb-5" style={{ fontFamily: 'var(--font-voice)', color: `${ACCENT}dd` }}>
            4 August 1929 — 13 October 1987
          </p>

          <div className="columns-1 sm:columns-2 sm:gap-x-10">
            <Section title="The Basics">
              Born Abhas Kumar Ganguly in Khandwa, the youngest of four children in a Bengali family — his father a
              lawyer, his mother from a landowning family. He renamed himself Kishore Kumar early in his career, and
              the name became one of the most recognized in Indian film history.
            </Section>

            <Section title="An Accidental Singer">
              He never had formal musical training. As a boy he idolized the singer K. L. Saigal and mimicked his
              style before finding a voice entirely his own. Singing was always what he actually wanted to do —
              acting was closer to an obligation, one his family and the industry kept pulling him back into. S. D.
              Burman heard him singing informally and signed him for playback work; years later, S. D.'s son R. D.
              Burman built some of the era's biggest hits specifically around his voice.
            </Section>

            <Section title="The Voice That Did Everything">
              Across more than 2,500 recorded songs in over a dozen Indian languages, he moved between heartbroken
              ballads, chaotic comic numbers, and yodel-laced disco-pop without ever sounding like he was performing
              a different person each time. He's widely credited with bringing yodeling into Hindi film music —
              nobody else was doing it quite like him. He holds the record for the most Filmfare Awards for Best
              Male Playback Singer: eight.
            </Section>

            <Section title="More Than a Voice">
              He also acted, composed, wrote, produced, and directed — a rare multi-hyphenate career, almost all of
              it self-taught. His comic film roles, chaotic and physical and often half-improvised, remain some of
              Hindi cinema's most fondly remembered performances.
            </Section>

            <Section title="The Man Behind the Mic">
              He was genuinely eccentric in ways people still tell stories about — he gave the trees in his garden
              human names and reportedly introduced them to guests as his closest friends. He played tennis, read
              constantly, never smoked or drank, and was famously devoted to his tea. He married four times; his
              second marriage was to the actress Madhubala.
            </Section>

            <Section title="The Last Song">
              He died of a heart attack on 13 October 1987 — the same date as his elder brother Ashok Kumar's
              birthday. His final recording, a duet with Asha Bhosle, was made just a day before he passed. He was
              taken home to Khandwa, the town he had always meant to retire to.
            </Section>
          </div>

          <p
            className="text-sm italic leading-relaxed pt-4 mt-1 border-t"
            style={{ color: `${INK}cc`, fontFamily: 'var(--font-voice)', borderColor: 'rgba(255,255,255,0.1)' }}
          >
            Not a trained musician, not a conventional star — just a voice that decided, one song at a time, what
            Hindi film music could sound like.
          </p>
        </div>
      </div>
    </div>
  )
}
