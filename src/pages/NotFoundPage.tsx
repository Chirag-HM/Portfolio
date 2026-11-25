import { useEffect } from 'react'
import { Link } from 'react-router'
import { siteConfig } from '../data/config'
import { applyRouteSeo } from '../lib/seo'

export function NotFoundPage() {
  useEffect(() => {
    applyRouteSeo({
      title: `404 Not Found — ${siteConfig.name}`,
      description: 'The requested route does not exist.',
      pathname: '/404',
      robots: 'noindex, nofollow',
    })
  }, [])

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-start justify-center gap-6 px-6 py-24">
      <span className="font-mono text-xs uppercase tracking-[0.22em] text-[#BBCCD7]">
        404 · Route not found
      </span>
      <h1
        className="hero-heading font-black uppercase leading-[0.95] tracking-tight"
        style={{ fontSize: 'clamp(3rem, 11vw, 7rem)' }}
      >
        Page missing
      </h1>
      <p className="max-w-lg text-base font-light leading-relaxed text-[#D7E2EA]/80 sm:text-lg">
        The route you requested does not exist on this portfolio. Head back to the main showcase or
        browse a project case study from home.
      </p>
      <Link
        to="/"
        className="rounded-full border-2 border-[#D7E2EA] px-7 py-2.5 text-xs font-medium uppercase tracking-widest text-[#D7E2EA] transition-colors hover:bg-[#D7E2EA]/10"
      >
        ← Back to portfolio
      </Link>
    </div>
  )
}
