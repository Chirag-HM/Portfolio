import { siteConfig } from '../data/config'
import { moments } from '../data/moments'
import { hasLocalAsset } from '../lib/assets'
import { AnimatedText } from '../components/AnimatedText'
import { ContactButton } from '../components/ContactButton'
import { FadeIn } from '../components/FadeIn'

export interface AboutSectionProps {
  onOpenContact: () => void
}

export function AboutSection({ onOpenContact }: AboutSectionProps) {
  const hasSignature = hasLocalAsset(siteConfig.signatureUrl)
  const validMoments = moments.filter(
    (m) => hasLocalAsset(m.image) && m.caption.trim().length > 0
  )

  return (
    <section
      id="about"
      className="relative flex min-h-screen flex-col items-center justify-center bg-[#0C0C0C] px-5 py-20 sm:px-8 md:px-10"
      style={{ overflowX: 'clip' }}
    >
      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center gap-14 sm:gap-16 md:gap-20">
        <div className="flex flex-col items-center gap-10 sm:gap-12 md:gap-14">
          <FadeIn delay={0} y={40}>
            <h2
              className="hero-heading text-center font-black uppercase leading-none tracking-tight"
              style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}
            >
              {siteConfig.aboutHeading}
            </h2>
          </FadeIn>

          <AnimatedText
            text={siteConfig.aboutParagraph}
            className="max-w-[600px] text-center font-medium leading-relaxed text-[#D7E2EA]"
            style={{ fontSize: 'clamp(1rem, 2vw, 1.35rem)' }}
          />
        </div>

        {hasSignature && (
          <FadeIn delay={0.1} y={16}>
            <img
              src={siteConfig.signatureUrl}
              alt={`${siteConfig.name} signature`}
              className="h-12 w-auto select-none object-contain"
              draggable={false}
            />
          </FadeIn>
        )}

        {validMoments.length > 0 && (
          <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {validMoments.map((item) => (
              <figure
                key={item.image}
                className="overflow-hidden rounded-3xl border border-[#D7E2EA]/20 bg-[#121212] p-3"
              >
                <img
                  src={item.image}
                  alt={item.caption}
                  loading="lazy"
                  className="aspect-[4/3] w-full rounded-2xl object-cover"
                />
                <figcaption className="mt-2.5 px-1 text-xs font-light uppercase tracking-wider text-[#D7E2EA]/75">
                  {item.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        <FadeIn delay={0.15} y={20}>
          <ContactButton onClick={onOpenContact} />
        </FadeIn>
      </div>
    </section>
  )
}
