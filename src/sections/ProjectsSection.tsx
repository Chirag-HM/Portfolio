import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { lazy, useRef } from 'react'
import { siteConfig } from '../data/config'
import { projects } from '../data/projects'
import type { ProjectItem } from '../data/types'
import { filterAvailableLocalAssets, isNonEmpty } from '../lib/assets'
import { FadeIn } from '../components/FadeIn'
import { LiveProjectButton } from '../components/LiveProjectButton'
import { SceneSlot } from '../components/SceneSlot'

const ProjectsCrystalScene = lazy(() => import('../scenes/ProjectsCrystalScene'))

interface ProjectCardProps {
  project: ProjectItem
  index: number
  totalCards: number
  progress: MotionValue<number>
}

function StickyProjectCard({ project, index, totalCards, progress }: ProjectCardProps) {
  const targetScale = 1 - (totalCards - 1 - index) * 0.03
  const rangeStart = index / totalCards
  const scale = useTransform(progress, [rangeStart, 1], [1, targetScale])

  const localShots = filterAvailableLocalAssets(project.screenshots)
  const hasGallery = localShots.length >= 3

  return (
    <div className="sticky top-24 flex min-h-[75vh] items-start justify-center md:top-32 md:min-h-[80vh]">
      <motion.article
        style={{
          scale,
          top: `${index * 28}px`,
          transformOrigin: 'top center',
        }}
        className="relative w-full max-w-6xl rounded-[40px] border-2 border-[#D7E2EA] bg-[#0C0C0C] p-5 sm:rounded-[50px] sm:p-7 md:rounded-[60px] md:p-9"
      >
        {/* Top Row: Number, Category (+ optional Status), Title, Case Study / Live link */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 sm:mb-8">
          <div className="flex items-center gap-4 sm:gap-8">
            <span
              className="shrink-0 font-black leading-none text-[#D7E2EA]"
              style={{ fontSize: 'clamp(3rem, 10vw, 140px)' }}
            >
              {project.number}
            </span>

            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-light uppercase tracking-widest text-[#D7E2EA] opacity-65 sm:text-sm">
                  {project.category}
                </span>
                {isNonEmpty(project.status) && (
                  <span className="rounded-full border border-[#BBCCD7]/50 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-widest text-[#BBCCD7]">
                    {project.status}
                  </span>
                )}
              </div>
              <h3
                className="font-medium uppercase leading-tight text-[#D7E2EA]"
                style={{ fontSize: 'clamp(1.1rem, 2.4vw, 2.25rem)' }}
              >
                {project.title}
              </h3>
            </div>
          </div>

          <LiveProjectButton to={`/projects/${project.slug}`} label="Case Study" />
        </div>

        {/* Bottom Content: Local screenshots grid if present, otherwise crisp factual overview + stack */}
        {hasGallery ? (
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-[40%_1fr]">
            <div className="flex flex-col gap-3 sm:gap-4">
              <img
                src={localShots[0]}
                alt={`${project.title} detail 1`}
                loading="lazy"
                className="w-full rounded-[40px] object-cover sm:rounded-[50px] md:rounded-[60px]"
                style={{ height: 'clamp(130px, 16vw, 230px)' }}
              />
              <img
                src={localShots[1]}
                alt={`${project.title} detail 2`}
                loading="lazy"
                className="w-full rounded-[40px] object-cover sm:rounded-[50px] md:rounded-[60px]"
                style={{ height: 'clamp(160px, 22vw, 340px)' }}
              />
            </div>

            <img
              src={localShots[2]}
              alt={`${project.title} overview`}
              loading="lazy"
              className="h-[190px] w-full rounded-[40px] object-cover sm:h-[220px] sm:rounded-[50px] md:h-full md:rounded-[60px]"
            />
          </div>
        ) : (
          <div className="flex min-h-[220px] flex-col justify-between gap-6 border-t border-[#D7E2EA]/15 pt-6 sm:min-h-[260px] sm:pt-8">
            <div className="flex flex-col gap-3">
              <p
                className="max-w-3xl font-medium leading-snug text-[#D7E2EA]"
                style={{ fontSize: 'clamp(1.15rem, 2.2vw, 1.85rem)' }}
              >
                {project.tagline}
              </p>
              {isNonEmpty(project.built) && (
                <p className="max-w-2xl text-sm font-light leading-relaxed text-[#D7E2EA]/70 sm:text-base">
                  {project.built}
                </p>
              )}
            </div>

            {project.stack.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {project.stack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full border border-[#D7E2EA]/25 px-3.5 py-1 text-xs font-medium uppercase tracking-wider text-[#D7E2EA]/85"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.article>
    </div>
  )
}

function ProjectsClassic() {
  const stackRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: stackRef,
    offset: ['start start', 'end end'],
  })

  return (
    <div
      className="relative z-10 bg-[#0C0C0C] px-5 pt-16 pb-28 sm:px-8 sm:pt-20 sm:pb-32 md:px-10 md:pt-24"
      style={{ overflowX: 'clip' }}
    >
      <FadeIn delay={0} y={40}>
        <h2
          className="hero-heading mb-16 text-center font-black uppercase leading-none tracking-tight sm:mb-20 md:mb-24"
          style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}
        >
          {siteConfig.projectsHeading}
        </h2>
      </FadeIn>

      <div ref={stackRef} className="relative mx-auto flex max-w-6xl flex-col gap-12 pb-16 sm:gap-16">
        {projects.map((project, index) => (
          <StickyProjectCard
            key={project.slug}
            project={project}
            index={index}
            totalCards={projects.length}
            progress={scrollYProgress}
          />
        ))}
      </div>
    </div>
  )
}

export function ProjectsSection() {
  return (
    <SceneSlot
      chapterId="projects"
      as="section"
      landmarkLabel="Featured Projects"
      chapterLabel="Projects"
      scene={ProjectsCrystalScene}
      minHeightOnMountClassName="h-[260vh] overflow-clip bg-[#0C0C0C]"
      fallback={<ProjectsClassic />}
    />
  )
}
