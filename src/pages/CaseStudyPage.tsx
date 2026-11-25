import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { siteConfig } from '../data/config'
import { projects } from '../data/projects'
import { filterAvailableLocalAssets, isNonEmpty } from '../lib/assets'
import { applyRouteSeo } from '../lib/seo'
import { useViewMode } from '../lib/viewModeContext'

export function CaseStudyPage() {
  const { slug } = useParams<{ slug: string }>()
  const { viewMode, toggleViewMode } = useViewMode()

  const index = projects.findIndex((p) => p.slug === slug)
  const project = index >= 0 ? projects[index] : null

  useEffect(() => {
    if (project) {
      applyRouteSeo({
        title: `${project.title} — ${siteConfig.name}`,
        description: project.tagline || project.built,
        pathname: `/projects/${project.slug}`,
      })
    } else {
      applyRouteSeo({
        title: `Project Not Found — ${siteConfig.name}`,
        description: 'Project case study not found.',
        pathname: '/projects',
        robots: 'noindex, nofollow',
      })
    }
  }, [project])

  if (!project) {
    return (
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-start justify-center gap-6 px-6 py-24">
        <span className="font-mono text-xs uppercase tracking-widest text-[#D7E2EA]/60">
          404 · Not found
        </span>
        <h1 className="hero-heading text-4xl font-black uppercase tracking-tight sm:text-6xl">
          Project not found
        </h1>
        <Link
          to="/"
          className="rounded-full border-2 border-[#D7E2EA] px-6 py-2.5 text-xs font-medium uppercase tracking-widest text-[#D7E2EA] transition-colors hover:bg-[#D7E2EA]/10"
        >
          ← Back to portfolio
        </Link>
      </div>
    )
  }

  const prevProject = projects[(index - 1 + projects.length) % projects.length]
  const nextProject = projects[(index + 1) % projects.length]
  const screenshots = filterAvailableLocalAssets(project.screenshots)
  const hasLive = isNonEmpty(project.liveUrl)
  const hasGithub = isNonEmpty(project.githubUrl)

  const metaTokens = [project.number, project.category, project.year, project.status].filter(
    (item) => isNonEmpty(item)
  )

  return (
    <article className="mx-auto min-h-screen max-w-5xl px-6 py-12 sm:py-16 md:px-10">
      {/* Top Bar */}
      <header className="mb-14 flex flex-wrap items-center justify-between gap-4 border-b border-[#D7E2EA]/15 pb-6">
        <Link
          to="/"
          className="text-xs font-medium uppercase tracking-widest text-[#D7E2EA] transition-opacity hover:opacity-70 sm:text-sm"
        >
          ← {siteConfig.name}
        </Link>

        <button
          type="button"
          onClick={toggleViewMode}
          aria-pressed={viewMode === 'immersive'}
          className="cursor-pointer rounded-full border border-[#D7E2EA]/35 px-3.5 py-1 text-xs font-medium uppercase tracking-widest text-[#D7E2EA] transition-colors hover:border-[#D7E2EA] hover:bg-[#D7E2EA]/10"
        >
          {viewMode === 'classic' ? 'Classic' : 'Immersive'}
        </button>
      </header>

      {/* Mono Meta Row */}
      {metaTokens.length > 0 && (
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-[#BBCCD7]">
          {metaTokens.join(' · ')}
        </p>
      )}

      {/* Title & Tagline */}
      <h1
        className="hero-heading mb-6 font-black uppercase leading-[0.95] tracking-tight"
        style={{ fontSize: 'clamp(2.5rem, 8vw, 6.5rem)' }}
      >
        {project.title}
      </h1>

      <p className="mb-8 max-w-3xl text-lg font-light leading-relaxed text-[#D7E2EA]/85 sm:text-2xl">
        {project.tagline}
      </p>

      {(hasLive || hasGithub) && (
        <div className="mb-12 flex flex-wrap gap-4">
          {hasLive && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border-2 border-[#D7E2EA] px-7 py-2.5 text-xs font-medium uppercase tracking-widest text-[#D7E2EA] transition-colors hover:bg-[#D7E2EA]/10"
            >
              Live Project ↗
            </a>
          )}
          {hasGithub && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-[#D7E2EA]/35 px-7 py-2.5 text-xs font-medium uppercase tracking-widest text-[#D7E2EA] transition-colors hover:border-[#D7E2EA]"
            >
              GitHub ↗
            </a>
          )}
        </div>
      )}

      {/* Structured Sections (omitted automatically when empty) */}
      <div className="space-y-12 border-t border-[#D7E2EA]/15 pt-12">
        {isNonEmpty(project.problem) && (
          <section aria-labelledby="cs-problem">
            <h2
              id="cs-problem"
              className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[#D7E2EA]/55"
            >
              Problem
            </h2>
            <p className="max-w-3xl text-base font-light leading-relaxed text-[#D7E2EA] sm:text-lg">
              {project.problem}
            </p>
          </section>
        )}

        {isNonEmpty(project.built) && (
          <section aria-labelledby="cs-built">
            <h2
              id="cs-built"
              className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[#D7E2EA]/55"
            >
              What I built
            </h2>
            <p className="max-w-3xl text-base font-light leading-relaxed text-[#D7E2EA] sm:text-lg">
              {project.built}
            </p>
          </section>
        )}

        {project.stack.length > 0 && (
          <section aria-labelledby="cs-stack">
            <h2
              id="cs-stack"
              className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-[#D7E2EA]/55"
            >
              Stack
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {project.stack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-[#D7E2EA]/25 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-[#D7E2EA]"
                >
                  {tech}
                </span>
              ))}
            </div>
          </section>
        )}

        {isNonEmpty(project.hard) && (
          <section aria-labelledby="cs-hard">
            <h2
              id="cs-hard"
              className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[#D7E2EA]/55"
            >
              What was hard
            </h2>
            <p className="max-w-3xl text-base font-light leading-relaxed text-[#D7E2EA] sm:text-lg">
              {project.hard}
            </p>
          </section>
        )}

        {isNonEmpty(project.wouldChange) && (
          <section aria-labelledby="cs-change">
            <h2
              id="cs-change"
              className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[#D7E2EA]/55"
            >
              What I&apos;d change
            </h2>
            <p className="max-w-3xl text-base font-light leading-relaxed text-[#D7E2EA] sm:text-lg">
              {project.wouldChange}
            </p>
          </section>
        )}

        {screenshots.length > 0 && (
          <section aria-labelledby="cs-gallery">
            <h2
              id="cs-gallery"
              className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-[#D7E2EA]/55"
            >
              Gallery
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {screenshots.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt={`${project.title} screenshot ${i + 1}`}
                  loading="lazy"
                  className="aspect-[16/10] w-full rounded-3xl border border-[#D7E2EA]/15 object-cover"
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Prev / Next Case Study Footer */}
      <nav
        aria-label="Project navigation"
        className="mt-16 grid gap-4 border-t border-[#D7E2EA]/15 pt-8 sm:grid-cols-2"
      >
        <Link
          to={`/projects/${prevProject.slug}`}
          className="rounded-3xl border border-[#D7E2EA]/20 p-5 transition-colors hover:border-[#D7E2EA]/60"
        >
          <span className="block font-mono text-xs uppercase tracking-widest text-[#D7E2EA]/55">
            ← Previous
          </span>
          <span className="mt-1 block text-lg font-bold uppercase text-[#D7E2EA]">
            {prevProject.title}
          </span>
        </Link>

        <Link
          to={`/projects/${nextProject.slug}`}
          className="rounded-3xl border border-[#D7E2EA]/20 p-5 text-left transition-colors hover:border-[#D7E2EA]/60 sm:text-right"
        >
          <span className="block font-mono text-xs uppercase tracking-widest text-[#D7E2EA]/55">
            Next →
          </span>
          <span className="mt-1 block text-lg font-bold uppercase text-[#D7E2EA]">
            {nextProject.title}
          </span>
        </Link>
      </nav>
    </article>
  )
}
