import { lazy, useState } from 'react'
import { siteConfig } from '../data/config'
import { skillGroups } from '../data/skills'
import type { SkillGroup } from '../data/types'
import { FadeIn } from '../components/FadeIn'
import { SceneSlot } from '../components/SceneSlot'

const StackPedestalScene = lazy(() => import('../scenes/StackPedestalScene'))

function SkillGroupCard({ group, delay }: { group: SkillGroup; delay: number }) {
  const [hoveredNote, setHoveredNote] = useState<string | null>(null)

  return (
    <FadeIn
      delay={delay}
      y={24}
      className="flex flex-col justify-between rounded-[32px] border border-[#D7E2EA]/20 bg-[#121212] p-6 sm:p-8"
    >
      <div>
        <div className="mb-5 flex items-baseline justify-between gap-3">
          <h3 className="text-xl font-bold uppercase tracking-wide text-[#D7E2EA] sm:text-2xl">
            {group.label}
          </h3>
          <span className="text-xs font-light uppercase tracking-widest text-[#D7E2EA]/55">
            {group.skills.length} tools
          </span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {group.skills.map((skill) => (
            <button
              key={skill.name}
              type="button"
              onMouseEnter={() => setHoveredNote(skill.note ?? null)}
              onMouseLeave={() => setHoveredNote(null)}
              onFocus={() => setHoveredNote(skill.note ?? null)}
              onBlur={() => setHoveredNote(null)}
              className="cursor-default rounded-full border border-[#D7E2EA]/25 px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider text-[#D7E2EA] transition-colors hover:border-[#BBCCD7] hover:bg-[#D7E2EA]/10 focus-visible:border-[#BBCCD7] focus-visible:bg-[#D7E2EA]/10 sm:text-sm"
            >
              {skill.name}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 min-h-[2.5rem] border-t border-[#D7E2EA]/12 pt-3 text-xs font-light leading-relaxed text-[#D7E2EA]/70 sm:text-sm">
        {hoveredNote ?? group.subtitle}
      </p>
    </FadeIn>
  )
}

function StackClassic() {
  return (
    <div
      className="relative z-10 -mt-10 rounded-t-[40px] bg-[#0C0C0C] px-5 pt-20 pb-20 sm:-mt-12 sm:rounded-t-[50px] sm:px-8 sm:pt-24 sm:pb-24 md:-mt-14 md:rounded-t-[60px] md:px-10 md:pt-28"
      style={{ overflowX: 'clip' }}
    >
      <FadeIn delay={0} y={40}>
        <h2
          className="hero-heading mb-14 text-center font-black uppercase leading-none tracking-tight sm:mb-18 md:mb-22"
          style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}
        >
          {siteConfig.stackHeading}
        </h2>
      </FadeIn>

      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
        {skillGroups.map((group, idx) => (
          <SkillGroupCard key={group.id} group={group} delay={idx * 0.08} />
        ))}
      </div>
    </div>
  )
}

export function StackSection() {
  return (
    <SceneSlot
      chapterId="stack"
      as="section"
      landmarkLabel="Tech Stack"
      chapterLabel="Stack"
      scene={StackPedestalScene}
      minHeightOnMountClassName="h-[260vh] overflow-x-clip bg-[#0C0C0C]"
      fallback={<StackClassic />}
    />
  )
}
