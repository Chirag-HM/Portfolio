import { useEffect } from 'react'
import { Link } from 'react-router'
import type { ProjectItem } from '../../data/types'
import { isNonEmpty } from '../../lib/assets'
import { CornerBrackets } from '../../components/CornerBrackets'
import { ScrambleText } from '../../components/ScrambleText'

export interface ProjectDetailPanelProps {
  project: ProjectItem | null
  onClose: () => void
}

export function ProjectDetailPanel({ project, onClose }: ProjectDetailPanelProps) {
  useEffect(() => {
    if (!project) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [project, onClose])

  if (!project) return null

  const hasSummary = isNonEmpty(project.tagline) || isNonEmpty(project.built)
  const hasStack = project.stack.length > 0
  const hasLive = isNonEmpty(project.liveUrl)
  const hasGithub = isNonEmpty(project.githubUrl)
  const hasLinks = hasLive || hasGithub

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="crystal-panel-title"
      className="absolute inset-0 z-30 flex items-center justify-center bg-[#0C0C0C]/82 px-5 py-16 backdrop-blur-xs sm:px-8"
    >
      {/* Top-right Igloo-style bracketed Close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close project detail panel"
        className="absolute top-6 right-6 z-40 cursor-pointer font-mono text-xs uppercase tracking-[0.2em] text-[#D7E2EA] transition-opacity hover:opacity-75 sm:top-8 sm:right-10"
      >
        <CornerBrackets className="px-5 py-2.5">
          <ScrambleText text="Close" durationMs={320} />
        </CornerBrackets>
      </button>

      {/* Dark Monospace Column */}
      <div className="max-h-[82vh] w-full max-w-xl overflow-y-auto pr-2 font-mono text-[#D7E2EA]">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-[#BBCCD7]">
          <ScrambleText text={`PRJ_${project.number}`} durationMs={260} />
          <span>·</span>
          <ScrambleText text={project.category} durationMs={320} delayMs={30} />
          {isNonEmpty(project.status) && (
            <>
              <span>·</span>
              <span className="border border-[#D7E2EA]/35 px-2 py-0.5 text-[10px]">
                {project.status}
              </span>
            </>
          )}
        </div>

        <h3
          id="crystal-panel-title"
          className="mb-8 font-[family-name:var(--font-sans)] text-3xl font-black uppercase leading-tight tracking-tight text-white sm:text-5xl"
          style={{ fontFamily: "'Kanit', sans-serif" }}
        >
          {project.title}
        </h3>

        {hasSummary && (
          <section className="mb-7 space-y-3" aria-label="Summary">
            <h4 className="text-xs uppercase tracking-[0.2em] text-[#D7E2EA]/55">
              /// Summary
            </h4>
            {isNonEmpty(project.tagline) && (
              <p className="text-sm leading-relaxed text-[#D7E2EA] sm:text-base">
                <ScrambleText text={project.tagline} durationMs={380} delayMs={40} />
              </p>
            )}
            {isNonEmpty(project.built) && (
              <p className="text-xs leading-relaxed text-[#D7E2EA]/80 sm:text-sm">
                <ScrambleText text={project.built} durationMs={460} delayMs={80} />
              </p>
            )}
          </section>
        )}

        {hasStack && (
          <section className="mb-7" aria-label="Stack">
            <h4 className="mb-3 text-xs uppercase tracking-[0.2em] text-[#D7E2EA]/55">
              /// Stack
            </h4>
            <div className="flex flex-wrap gap-2">
              {project.stack.map((tech) => (
                <span
                  key={tech}
                  className="border border-[#D7E2EA]/25 bg-[#0C0C0C]/70 px-3 py-1 text-xs uppercase tracking-wider text-[#D7E2EA]"
                >
                  {tech}
                </span>
              ))}
            </div>
          </section>
        )}

        {hasLinks && (
          <section className="mb-8" aria-label="Links">
            <h4 className="mb-3 text-xs uppercase tracking-[0.2em] text-[#D7E2EA]/55">
              /// Links
            </h4>
            <div className="flex flex-wrap gap-4 text-xs uppercase tracking-widest">
              {hasLive && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#D7E2EA] transition-opacity hover:opacity-70"
                >
                  [ Live Project ] ↗
                </a>
              )}
              {hasGithub && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#D7E2EA] transition-opacity hover:opacity-70"
                >
                  [ GitHub ] ↗
                </a>
              )}
            </div>
          </section>
        )}

        <div className="border-t border-[#D7E2EA]/15 pt-6">
          <Link
            to={`/projects/${project.slug}`}
            className="inline-flex items-center gap-2 border-b border-[#D7E2EA]/60 pb-1 text-xs font-medium uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-75 sm:text-sm"
          >
            Step inside →
          </Link>
        </div>
      </div>
    </div>
  )
}
