import { useEffect, useMemo, useRef, useState } from 'react'
import { moments } from '../data/moments'
import { projects } from '../data/projects'
import { filterAvailableLocalAssets, hasLocalAsset } from '../lib/assets'
import { usePrefersReducedMotion } from '../lib/motion'

interface MarqueeMedia {
  src: string
  alt: string
}

export function MarqueeSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [offset, setOffset] = useState(0)
  const prefersReduced = usePrefersReducedMotion()

  const mediaItems = useMemo<MarqueeMedia[]>(() => {
    const projectShots: MarqueeMedia[] = projects.flatMap((p) =>
      filterAvailableLocalAssets(p.screenshots).map((src, idx) => ({
        src,
        alt: `${p.title} screen ${idx + 1}`,
      }))
    )
    const momentShots: MarqueeMedia[] = moments
      .filter((m) => hasLocalAsset(m.image) && m.caption.trim().length > 0)
      .map((m) => ({ src: m.image, alt: m.caption }))
    return [...projectShots, ...momentShots]
  }, [])

  useEffect(() => {
    if (prefersReduced || mediaItems.length === 0) return

    let rafId = 0
    const updateOffset = () => {
      const el = sectionRef.current
      if (!el) return
      const sectionTop = el.offsetTop
      setOffset((window.scrollY - sectionTop + window.innerHeight) * 0.3)
    }

    const onScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(updateOffset)
    }

    updateOffset()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [prefersReduced, mediaItems.length])

  // Hide cleanly when no local showcase screenshots or moments exist yet
  if (mediaItems.length === 0) return null

  const repeated: MarqueeMedia[] = []
  while (repeated.length < Math.max(8, mediaItems.length * 3)) {
    repeated.push(...mediaItems)
  }

  return (
    <section
      ref={sectionRef}
      aria-label="Project showcase marquee"
      className="flex flex-col gap-3 bg-[#0C0C0C] pt-20 pb-10 sm:pt-28"
      style={{ overflowX: 'clip' }}
    >
      <div className="w-full overflow-hidden">
        <div className="w-max -translate-x-1/3">
          <div
            className="flex w-max gap-3"
            style={{
              transform: prefersReduced ? 'none' : `translateX(${offset - 200}px)`,
              willChange: 'transform',
            }}
          >
            {repeated.map((item, idx) => (
              <img
                key={`mq-${idx}`}
                src={item.src}
                alt={item.alt}
                loading="lazy"
                className="h-[270px] w-[420px] shrink-0 rounded-2xl bg-[#141414] object-cover"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
