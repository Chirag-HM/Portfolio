import { lazy } from 'react'
import { siteConfig } from '../data/config'
import { hasLocalAsset, isNonEmpty } from '../lib/assets'
import { scrollToTarget } from '../lib/motion'
import { useViewMode } from '../lib/viewModeContext'
import { ContactButton } from '../components/ContactButton'
import { FadeIn } from '../components/FadeIn'
import { SceneSlot } from '../components/SceneSlot'

const ContactLandscapeScene = lazy(() => import('../scenes/ContactLandscapeScene'))

export interface ContactSectionProps {
  onOpenContact: () => void
}

function ContactClassic({ onOpenContact }: ContactSectionProps) {
  const { viewMode, toggleViewMode } = useViewMode()
  const hasEmail = isNonEmpty(siteConfig.email)
  const hasGithub = isNonEmpty(siteConfig.githubUrl)
  const hasLinkedIn = isNonEmpty(siteConfig.linkedInUrl)
  const hasResume = hasLocalAsset(siteConfig.resumeUrl)
  const hasStatus = isNonEmpty(siteConfig.statusText)

  return (
    <div
      className="relative border-t border-[#D7E2EA]/15 bg-[#0C0C0C] px-5 pt-24 pb-14 sm:px-8 sm:pt-32 sm:pb-16 md:px-10"
      style={{ overflowX: 'clip' }}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 text-center">
        {hasStatus && (
          <span className="inline-flex items-center gap-2 rounded-full border border-[#D7E2EA]/25 px-4 py-1 text-xs uppercase tracking-widest text-[#D7E2EA]/80">
            <span className="h-1.5 w-1.5 rounded-full bg-[#BBCCD7]" aria-hidden="true" />
            {siteConfig.statusText}
          </span>
        )}

        <FadeIn delay={0} y={36}>
          <h2
            className="hero-heading text-center font-black uppercase leading-none tracking-tight"
            style={{ fontSize: 'clamp(3rem, 11vw, 140px)' }}
          >
            {siteConfig.contactHeading}
          </h2>
        </FadeIn>

        <FadeIn delay={0.12} y={20}>
          <ContactButton onClick={onOpenContact} />
        </FadeIn>

        {(hasEmail || hasGithub || hasLinkedIn || hasResume) && (
          <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs font-medium uppercase tracking-widest text-[#D7E2EA]/80 sm:text-sm">
            {hasEmail && (
              <a
                href={`mailto:${siteConfig.email}`}
                className="transition-opacity hover:opacity-70"
              >
                Email ↗
              </a>
            )}
            {hasGithub && (
              <a
                href={siteConfig.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-70"
              >
                GitHub ↗
              </a>
            )}
            {hasLinkedIn && (
              <a
                href={siteConfig.linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-70"
              >
                LinkedIn ↗
              </a>
            )}
            {hasResume && (
              <a
                href={siteConfig.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-70"
              >
                Resume ↗
              </a>
            )}
          </div>
        )}

        <div className="mt-10 flex w-full flex-wrap items-center justify-between gap-4 border-t border-[#D7E2EA]/12 pt-6 text-xs uppercase tracking-widest text-[#D7E2EA]/55">
          <span>{siteConfig.name}</span>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleViewMode}
              className="cursor-pointer transition-colors hover:text-[#D7E2EA]"
            >
              Mode: {viewMode}
            </button>
            <button
              type="button"
              onClick={() => scrollToTarget(0)}
              className="cursor-pointer transition-colors hover:text-[#D7E2EA]"
            >
              Back to top ↑
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ContactSection({ onOpenContact }: ContactSectionProps) {
  return (
    <SceneSlot
      chapterId="contact"
      as="footer"
      landmarkLabel="Contact and Links"
      chapterLabel="Contact"
      scene={ContactLandscapeScene}
      minHeightOnMountClassName="h-[260vh] overflow-clip bg-[#0C0C0C]"
      fallback={<ContactClassic onOpenContact={onOpenContact} />}
    />
  )
}
