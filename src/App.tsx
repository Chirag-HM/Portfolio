import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { CheckCircle2, Send, X } from 'lucide-react'
import { Suspense, lazy, useEffect, useState, type FormEvent } from 'react'
import { Route, Routes, useLocation } from 'react-router'
import { siteConfig } from './data/config'
import { setLenisInstance, usePrefersReducedMotion } from './lib/motion'
import { ViewModeProvider } from './lib/viewMode'
import { HomePage } from './pages/HomePage'

const CaseStudyPage = lazy(() =>
  import('./pages/CaseStudyPage').then((m) => ({ default: m.CaseStudyPage }))
)
const PlayPage = lazy(() =>
  import('./pages/PlayPage').then((m) => ({ default: m.PlayPage }))
)
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
)

gsap.registerPlugin(ScrollTrigger)

function AppShell() {
  const prefersReduced = usePrefersReducedMotion()
  const location = useLocation()
  const [contactOpen, setContactOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (prefersReduced) {
      setLenisInstance(null)
      ScrollTrigger.refresh()
      return
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.5,
    })

    setLenisInstance(lenis)
    lenis.on('scroll', ScrollTrigger.update)

    const tick = (time: number) => {
      lenis.raf(time * 1000)
    }

    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      setLenisInstance(null)
    }
  }, [prefersReduced])

  useEffect(() => {
    if (location.hash) {
      const target = location.hash
      const timer = window.setTimeout(() => {
        const el = document.querySelector(target)
        if (el) el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' })
      }, 90)
      return () => window.clearTimeout(timer)
    }
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname, location.hash, prefersReduced])

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitted(true)
  }

  const closeContact = () => {
    setContactOpen(false)
    setSubmitted(false)
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:rounded-full focus:border-2 focus:border-[#D7E2EA] focus:bg-[#0C0C0C] focus:px-5 focus:py-2 focus:text-xs focus:font-medium focus:uppercase focus:tracking-widest focus:text-[#D7E2EA]"
      >
        Skip to content
      </a>

      <main id="main-content" className="min-h-screen bg-[#0C0C0C]" style={{ overflowX: 'clip' }}>
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center font-mono text-xs uppercase tracking-widest text-[#D7E2EA]/60">
              Loading...
            </div>
          }
        >
          <Routes location={location}>
            <Route
              path="/"
              element={<HomePage onOpenContact={() => setContactOpen(true)} />}
            />
            <Route path="/projects/:slug" element={<CaseStudyPage />} />
            <Route path="/play" element={<PlayPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>

      {/* Contact Dialog */}
      <AnimatePresence>
        {contactOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-dialog-title"
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-lg rounded-[32px] border-2 border-[#D7E2EA]/30 bg-[#0C0C0C] p-6 sm:p-8"
            >
              <button
                type="button"
                onClick={closeContact}
                aria-label="Close contact dialog"
                className="absolute top-5 right-5 cursor-pointer rounded-full border border-[#D7E2EA]/30 p-2 text-[#D7E2EA] transition-colors hover:bg-[#D7E2EA]/10"
              >
                <X className="h-4 w-4" />
              </button>

              <h3
                id="contact-dialog-title"
                className="hero-heading mb-2 text-3xl font-black uppercase tracking-tight sm:text-4xl"
              >
                Start a Project
              </h3>
              <p className="mb-6 text-sm font-light text-[#D7E2EA]/70">
                Full-Stack Web, AI Integration, IoT Systems &amp; Automation Tools.
              </p>

              {submitted ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <CheckCircle2 className="h-10 w-10 text-[#BBCCD7]" />
                  <p className="text-lg font-medium uppercase tracking-wide text-[#D7E2EA]">
                    Inquiry Noted
                  </p>
                  <p className="max-w-xs text-sm font-light text-[#D7E2EA]/70">
                    Thanks for reaching out. {siteConfig.name} will review your message shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <input
                    required
                    type="text"
                    placeholder="Your name"
                    className="w-full rounded-2xl border border-[#D7E2EA]/25 bg-white/5 px-4 py-3 text-sm text-[#D7E2EA] placeholder:text-[#D7E2EA]/40 focus:border-[#D7E2EA] focus:outline-none"
                  />
                  <input
                    required
                    type="email"
                    placeholder="Email address"
                    className="w-full rounded-2xl border border-[#D7E2EA]/25 bg-white/5 px-4 py-3 text-sm text-[#D7E2EA] placeholder:text-[#D7E2EA]/40 focus:border-[#D7E2EA] focus:outline-none"
                  />
                  <textarea
                    required
                    rows={3}
                    placeholder={`Tell ${siteConfig.name} about your project...`}
                    className="w-full resize-none rounded-2xl border border-[#D7E2EA]/25 bg-white/5 px-4 py-3 text-sm text-[#D7E2EA] placeholder:text-[#D7E2EA]/40 focus:border-[#D7E2EA] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="mt-1 inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-[#D7E2EA] px-6 py-3 text-sm font-medium uppercase tracking-widest text-[#D7E2EA] transition-colors hover:bg-[#D7E2EA]/10"
                  >
                    <Send className="h-4 w-4" />
                    Send Brief
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ViewModeProvider>
        <AppShell />
      </ViewModeProvider>
    </MotionConfig>
  )
}
