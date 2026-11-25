import { siteConfig } from '../data/config'
import { hasLocalAsset, isNonEmpty } from '../lib/assets'
import { scrollToTarget } from '../lib/motion'
import { useViewMode } from '../lib/viewModeContext'
import { ContactButton } from '../components/ContactButton'
import { FadeIn } from '../components/FadeIn'
import { Magnet } from '../components/Magnet'

export interface HeroSectionProps {
  onOpenContact: () => void
}

export function HeroSection({ onOpenContact }: HeroSectionProps) {
  const { viewMode, toggleViewMode } = useViewMode()
  const hasPortrait = hasLocalAsset(siteConfig.portraitUrl)
  const hasResume = hasLocalAsset(siteConfig.resumeUrl)
  const hasStatus = isNonEmpty(siteConfig.statusText)

  return (
    <section
      className="relative flex h-screen flex-col justify-between bg-[#0C0C0C]"
      style={{ overflowX: 'clip' }}
    >
      {/* Top Navbar */}
      <FadeIn immediate delay={0} y={-20} className="relative z-20 w-full px-6 pt-6 md:px-10 md:pt-8">
        <nav
          aria-label="Main navigation"
          className="flex w-full flex-wrap items-center justify-between gap-3"
        >
          {siteConfig.navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => {
                e.preventDefault()
                scrollToTarget(link.href)
              }}
              className="text-sm font-medium uppercase tracking-wider text-[#D7E2EA] transition-opacity duration-200 hover:opacity-70 md:text-lg lg:text-[1.4rem]"
            >
              {link.label}
            </a>
          ))}

          <div className="flex items-center gap-3">
            {hasStatus && (
              <span className="hidden items-center gap-1.5 rounded-full border border-[#D7E2EA]/25 px-3 py-1 text-xs uppercase tracking-wider text-[#D7E2EA]/80 sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-[#BBCCD7]" aria-hidden="true" />
                {siteConfig.statusText}
              </span>
            )}

            <button
              type="button"
              onClick={toggleViewMode}
              aria-pressed={viewMode === 'immersive'}
              title={`Switch to ${viewMode === 'classic' ? 'Immersive' : 'Classic'} mode`}
              className="cursor-pointer rounded-full border border-[#D7E2EA]/35 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-[#D7E2EA] transition-colors hover:border-[#D7E2EA] hover:bg-[#D7E2EA]/10 sm:text-xs"
            >
              {viewMode === 'classic' ? 'Classic' : 'Immersive'}
            </button>
          </div>
        </nav>
      </FadeIn>

      {/* Massive Hero Heading */}
      <div className="relative z-0 w-full overflow-hidden px-3 sm:px-6 md:px-10">
        <FadeIn immediate delay={0.15} y={40}>
          <h1 className="hero-heading mt-6 w-full text-center text-[8.4vw] font-black uppercase leading-none tracking-tight whitespace-nowrap sm:mt-4 sm:text-[8.6vw] md:-mt-5 md:text-[8.8vw] lg:text-[9vw]">
            {siteConfig.heroGreeting}
          </h1>
        </FadeIn>
      </div>

      {/* Centered Magnetic Local Portrait (rendered only when public/me/cutout.png is present) */}
      {hasPortrait && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 w-[280px] -translate-x-1/2 -translate-y-1/2 sm:top-auto sm:bottom-0 sm:w-[340px] sm:translate-y-0 md:w-[380px] lg:w-[520px]">
          <FadeIn immediate delay={0.6} y={30} className="pointer-events-auto w-full">
            <Magnet
              padding={150}
              strength={3}
              activeTransition="transform 0.3s ease-out"
              inactiveTransition="transform 0.6s ease-in-out"
              wrapperClassName="w-full"
              style={{ display: 'block', width: '100%' }}
            >
              <img
                src={siteConfig.portraitUrl}
                alt={`${siteConfig.name} portrait`}
                fetchPriority="high"
                className="block h-auto w-full select-none object-contain"
                draggable={false}
              />
            </Magnet>
          </FadeIn>
        </div>
      )}

      {/* Bottom Bar */}
      <div className="relative z-20 mt-auto flex w-full items-end justify-between px-6 pb-7 sm:pb-8 md:px-10 md:pb-10">
        <FadeIn immediate delay={0.35} y={20}>
          <p
            className="max-w-[165px] font-light uppercase leading-snug tracking-wide text-[#D7E2EA] sm:max-w-[200px] lg:max-w-[300px]"
            style={{ fontSize: 'clamp(0.75rem, 1.35vw, 1.5rem)' }}
          >
            {siteConfig.heroTagline}
          </p>
        </FadeIn>

        <FadeIn immediate delay={0.5} y={20} className="flex items-center gap-4">
          {hasResume && (
            <a
              href={siteConfig.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden border-b border-[#D7E2EA]/40 pb-1 text-xs font-medium uppercase tracking-widest text-[#D7E2EA] transition-opacity hover:opacity-75 sm:inline-block"
            >
              Resume ↗
            </a>
          )}
          <ContactButton onClick={onOpenContact} />
        </FadeIn>
      </div>
    </section>
  )
}
