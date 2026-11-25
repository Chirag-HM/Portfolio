import { useEffect, useRef, useState } from 'react'
import { siteConfig } from '../../data/config'
import { hasLocalAsset, isNonEmpty } from '../../lib/assets'
import { scrollToTarget } from '../../lib/motion'
import { useViewMode } from '../../lib/viewModeContext'

export interface ContactOverlayProps {
  endVisible: boolean
  prefersReduced: boolean
  revealRef: React.RefObject<HTMLDivElement | null>
  onSendSignal: () => void
}

export function ContactOverlay({
  endVisible,
  prefersReduced,
  revealRef,
  onSendSignal,
}: ContactOverlayProps) {
  const { viewMode, toggleViewMode } = useViewMode()
  const [toast, setToast] = useState<string | null>(null)
  const toastTimerRef = useRef(0)

  const hasBio = isNonEmpty(siteConfig.aboutParagraph)
  const hasEmail = isNonEmpty(siteConfig.email)
  const hasGithub = isNonEmpty(siteConfig.githubUrl)
  const hasLinkedIn = isNonEmpty(siteConfig.linkedInUrl)
  const hasResume = hasLocalAsset(siteConfig.resumeUrl)

  useEffect(() => {
    return () => {
      window.clearTimeout(toastTimerRef.current)
    }
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout(toastTimerRef.current)
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2600)
  }

  const copyEmailWithToast = (prefix = 'Email copied') => {
    if (!hasEmail) return
    const copyAttempt = async () => {
      try {
        await navigator.clipboard.writeText(siteConfig.email)
        showToast(`${prefix} · ${siteConfig.email}`)
      } catch {
        // Fallback textarea selection copy before falling back to toast
        try {
          const area = document.createElement('textarea')
          area.value = siteConfig.email
          area.setAttribute('readonly', '')
          area.style.position = 'fixed'
          area.style.opacity = '0'
          document.body.appendChild(area)
          area.select()
          document.execCommand('copy')
          document.body.removeChild(area)
          showToast(`${prefix} · ${siteConfig.email}`)
        } catch {
          showToast(siteConfig.email)
        }
      }
    }
    void copyAttempt()
  }

  const handleSignalClick = () => {
    onSendSignal()
    copyEmailWithToast('Signal transmitted')
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between px-6 py-6 sm:px-10 sm:py-8">
      {/* Top Corners: Copyright & Config Bio */}
      <div className="flex w-full items-start justify-between gap-6">
        <div className="font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-[#D7E2EA]/75 sm:text-xs">
          © 2026 {siteConfig.name.toUpperCase()}
        </div>

        {hasBio && (
          <div className="hidden max-w-xs text-right font-mono text-[11px] leading-relaxed text-[#D7E2EA]/68 sm:block sm:text-xs">
            <div className="mb-1 uppercase tracking-[0.2em] text-[#BBCCD7]/75">
              ////// Profile
            </div>
            <p>{siteConfig.aboutParagraph}</p>
          </div>
        )}
      </div>

      {/* Live Clipboard / Signal Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 border border-[#D7E2EA]/40 bg-[#0C0C0C]/90 px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-[#D7E2EA]"
        >
          {toast}
        </div>
      )}

      {/* Lower Ending Band: Fades in near the end of scroll */}
      <div
        ref={revealRef}
        style={
          {
            opacity: prefersReduced ? 1 : 'var(--end-reveal, 0)',
          } as React.CSSProperties
        }
        className={`flex flex-col items-center gap-5 pb-2 text-center transition-opacity duration-300 ${
          endVisible || prefersReduced ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        <h2
          className="hero-heading font-black uppercase leading-none tracking-tight select-none"
          style={{ fontSize: 'clamp(2.8rem, 8.5vw, 112px)' }}
        >
          LET&apos;S TALK
        </h2>

        {hasEmail && (
          <button
            type="button"
            onClick={handleSignalClick}
            className="cursor-pointer rounded-full border border-[#D7E2EA]/70 bg-[#0C0C0C]/88 px-7 py-2.5 font-mono text-xs font-medium uppercase tracking-[0.22em] text-white transition-all hover:border-white hover:bg-[#171f2b] sm:text-sm"
          >
            Send a signal
          </button>
        )}

        {(hasEmail || hasGithub || hasLinkedIn || hasResume) && (
          <div className="flex flex-wrap items-center justify-center gap-5 rounded-full bg-[#0C0C0C]/60 px-5 py-1.5 font-mono text-xs uppercase tracking-[0.18em] text-[#D7E2EA]">
            {hasEmail && (
              <button
                type="button"
                onClick={() => copyEmailWithToast('Copied')}
                className="cursor-pointer transition-opacity hover:text-white hover:opacity-80"
              >
                {siteConfig.email}
              </button>
            )}
            {hasGithub && (
              <a
                href={siteConfig.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:text-white hover:opacity-80"
              >
                GitHub ↗
              </a>
            )}
            {hasLinkedIn && (
              <a
                href={siteConfig.linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:text-white hover:opacity-80"
              >
                LinkedIn ↗
              </a>
            )}
            {hasResume && (
              <a
                href={siteConfig.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:text-white hover:opacity-80"
              >
                Resume ↗
              </a>
            )}
          </div>
        )}

        <div className="mt-1 flex w-full flex-wrap items-center justify-between gap-4 border-t border-[#D7E2EA]/15 pt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-[#D7E2EA]/60">
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
  )
}
