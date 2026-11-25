import { useEffect } from 'react'
import { Link } from 'react-router'
import { siteConfig } from '../data/config'
import { applyRouteSeo } from '../lib/seo'

export function PlayPage() {
  useEffect(() => {
    applyRouteSeo({
      title: `3D Plaza — ${siteConfig.name}`,
      description: 'Interactive 3D exploration plaza mode coming soon.',
      pathname: '/play',
    })
  }, [])

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#BBCCD7]">
        3D Plaza
      </span>
      <h1 className="hero-heading text-4xl font-black uppercase tracking-tight sm:text-6xl">
        Explore mode coming soon
      </h1>
      <Link
        to="/"
        className="rounded-full border-2 border-[#D7E2EA] px-7 py-2.5 text-xs font-medium uppercase tracking-widest text-[#D7E2EA] transition-colors hover:bg-[#D7E2EA]/10"
      >
        ← Back to portfolio
      </Link>
    </div>
  )
}
