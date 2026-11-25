import { useState } from 'react'
import type { SkillGroup, SkillItem } from '../../data/types'
import { isNonEmpty } from '../../lib/assets'
import { CornerBrackets } from '../../components/CornerBrackets'
import { ScrambleText } from '../../components/ScrambleText'

export interface StackPedestalOverlayProps {
  groups: readonly SkillGroup[]
  activeIndex: number
  isMorphing: boolean
  prefersReduced: boolean
  onPrev: () => void
  onNext: () => void
  onSelectGroup: (index: number) => void
}

export function StackPedestalOverlay({
  groups,
  activeIndex,
  isMorphing,
  prefersReduced,
  onPrev,
  onNext,
  onSelectGroup,
}: StackPedestalOverlayProps) {
  const [hoveredSkill, setHoveredSkill] = useState<SkillItem | null>(null)

  const activeGroup = groups[activeIndex]
  const counter = `${String(activeIndex + 1).padStart(2, '0')} / ${String(groups.length).padStart(2, '0')}`

  const telemetryBandA = groups
    .map((g) => `${g.label.toUpperCase()} // ${g.skills.map((s) => s.name.toUpperCase()).join(' · ')}`)
    .join('   ///   ')
  const telemetryBandB = groups
    .map((g, idx) => `GRP_0${idx + 1} // ${g.subtitle.toUpperCase() || g.label.toUpperCase()}`)
    .join('   ///   ')

  const activeHoveredName =
    hoveredSkill && activeGroup.skills.some((s) => s.name === hoveredSkill.name)
      ? hoveredSkill.name
      : null

  const displayedNote =
    activeHoveredName && hoveredSkill && isNonEmpty(hoveredSkill.note)
      ? hoveredSkill.note
      : isNonEmpty(activeGroup.subtitle)
        ? activeGroup.subtitle
        : null

  return (
    <>
      {/* Faint low-opacity scrolling mono background data visible around the glass stage */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 flex flex-col justify-between overflow-hidden py-16 select-none"
      >
        <div
          className={`whitespace-nowrap font-mono text-sm uppercase tracking-[0.28em] text-[#D7E2EA]/[0.09] blur-[1px] sm:text-base ${
            prefersReduced ? '' : 'animate-crystal-data-slow'
          }`}
        >
          {telemetryBandA} &nbsp;&nbsp; {telemetryBandA}
        </div>
        <div
          className={`whitespace-nowrap font-mono text-xs uppercase tracking-[0.34em] text-[#D7E2EA]/[0.07] blur-[1.1px] sm:text-sm ${
            prefersReduced ? '' : 'animate-crystal-data-reverse'
          }`}
        >
          {telemetryBandB} &nbsp;&nbsp; {telemetryBandB}
        </div>
      </div>

      {/* Top-left section identifier */}
      <div className="pointer-events-none absolute top-6 left-6 z-20 flex items-center gap-3 sm:top-8 sm:left-10">
        <span className="font-mono text-xs uppercase tracking-[0.22em] text-[#D7E2EA]/60">
          Stack · Architecture
        </span>
        {isMorphing && (
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#BBCCD7]/70">
            · Morphing
          </span>
        )}
      </div>

      {/* Minimal hairline Left / Right navigation arrows */}
      <button
        type="button"
        onClick={onPrev}
        aria-label="Previous stack group"
        className="group absolute top-1/2 left-5 z-20 flex h-11 w-14 -translate-y-1/2 cursor-pointer items-center justify-center text-[#D7E2EA]/65 transition-all hover:-translate-x-0.5 hover:text-white sm:left-10"
      >
        <svg width="46" height="14" viewBox="0 0 46 14" fill="none" aria-hidden="true">
          <path d="M46 11 H2 L11 2" stroke="currentColor" strokeWidth="1" />
        </svg>
      </button>

      <button
        type="button"
        onClick={onNext}
        aria-label="Next stack group"
        className="group absolute top-1/2 right-5 z-20 flex h-11 w-14 -translate-y-1/2 cursor-pointer items-center justify-center text-[#D7E2EA]/65 transition-all hover:translate-x-0.5 hover:text-white sm:right-10"
      >
        <svg width="46" height="14" viewBox="0 0 46 14" fill="none" aria-hidden="true">
          <path d="M0 11 H44 L35 2" stroke="currentColor" strokeWidth="1" />
        </svg>
      </button>

      {/* Right-side Mono Tool HUD displaying active group tools + hover notes (positioned cleanly above right arrow) */}
      <aside
        aria-label={`${activeGroup.label} tool list`}
        className="pointer-events-none absolute top-6 right-6 z-20 w-[250px] sm:top-8 sm:right-10 lg:w-[290px]"
      >
        <div className="pointer-events-auto border-l border-[#D7E2EA]/25 bg-[#0C0C0C]/55 pl-4 py-2 backdrop-blur-[2px]">
          <div className="mb-2 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.2em] text-[#BBCCD7]">
            <span className="tabular-nums">{counter}</span>
            <span>
              <ScrambleText text={`/// ${activeGroup.label}`} durationMs={340} />
            </span>
          </div>

          <ul className="space-y-1.5" role="list">
            {activeGroup.skills.map((skill, idx) => {
              const isHighlighted = activeHoveredName === skill.name
              return (
                <li key={`${activeGroup.id}-${skill.name}`}>
                  <button
                    type="button"
                    onMouseEnter={() => setHoveredSkill(skill)}
                    onMouseLeave={() => setHoveredSkill(null)}
                    onFocus={() => setHoveredSkill(skill)}
                    onBlur={() => setHoveredSkill(null)}
                    className={`flex w-full cursor-default items-center justify-between border px-2.5 py-1.5 text-left font-mono text-[11px] uppercase tracking-[0.16em] transition-colors sm:text-xs ${
                      isHighlighted
                        ? 'border-[#D7E2EA]/65 bg-[#D7E2EA]/12 text-white'
                        : 'border-[#D7E2EA]/18 bg-[#0C0C0C]/45 text-[#D7E2EA]/85 hover:border-[#D7E2EA]/45'
                    }`}
                  >
                    <span>
                      <ScrambleText
                        text={skill.name}
                        durationMs={340}
                        delayMs={idx * 45}
                      />
                    </span>
                    <span aria-hidden="true" className="text-[10px] text-[#D7E2EA]/40">
                      0{idx + 1}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          {displayedNote && (
            <div className="mt-3 border-t border-[#D7E2EA]/18 pt-2.5 font-mono text-[11px] leading-relaxed text-[#D7E2EA]/80">
              {activeHoveredName && (
                <span className="mr-1.5 uppercase text-[#BBCCD7]">
                  {activeHoveredName}:
                </span>
              )}
              <span>{displayedNote}</span>
            </div>
          )}
        </div>
      </aside>

      {/* Bottom Pedestal Carousel (4 group labels, active highlighted in corner brackets) */}
      <nav
        aria-label="Stack categories carousel"
        className="pointer-events-none absolute inset-x-0 bottom-7 z-20 flex flex-col items-center gap-3 px-4 sm:bottom-9"
      >
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-4 sm:gap-8">
          {groups.map((group, idx) => {
            const isSelected = idx === activeIndex
            return (
              <button
                key={group.id}
                type="button"
                aria-current={isSelected ? 'true' : undefined}
                onClick={() => {
                  setHoveredSkill(null)
                  onSelectGroup(idx)
                }}
                className={`cursor-pointer font-mono text-xs uppercase tracking-[0.2em] transition-all sm:text-sm ${
                  isSelected
                    ? 'font-medium text-white'
                    : 'text-[#D7E2EA]/45 hover:text-[#D7E2EA]/85'
                }`}
              >
                {isSelected ? (
                  <CornerBrackets className="px-5 py-2">
                    <ScrambleText text={group.label} durationMs={360} />
                  </CornerBrackets>
                ) : (
                  <span className="px-2 py-2">{group.label}</span>
                )}
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
