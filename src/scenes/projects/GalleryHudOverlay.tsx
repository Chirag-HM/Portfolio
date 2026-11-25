import { forwardRef } from 'react'
import type { ProjectItem } from '../../data/types'
import { isNonEmpty } from '../../lib/assets'
import { CornerBrackets } from '../../components/CornerBrackets'
import { ScrambleText } from '../../components/ScrambleText'

export interface GalleryHudOverlayProps {
  projects: ProjectItem[]
  activeIndex: number
  hoveredIndex: number | null
  inspectedIndex: number | null
  prefersReduced: boolean
  onPrev: () => void
  onNext: () => void
  onInspect: (index: number) => void
}

/**
 * Overlay rendering:
 * - Faint blurred scrolling mono telemetry strings behind the 3D crystal canvas
 * - Dynamic SVG leader lines + scrambled monospace HUD labels on crystal hover
 * - Left / right navigation controls, bottom-center corner-bracketed title, and 01 / 04 counter
 */
export const GalleryHudOverlay = forwardRef<HTMLDivElement, GalleryHudOverlayProps>(
  function GalleryHudOverlay(
    {
      projects,
      activeIndex,
      hoveredIndex,
      inspectedIndex,
      prefersReduced,
      onPrev,
      onNext,
      onInspect,
    },
    hudAnchorRef
  ) {
    const activeProject = projects[activeIndex]
    const hoveredProject = hoveredIndex !== null ? projects[hoveredIndex] : null
    const showHoverHud = hoveredProject !== null && inspectedIndex === null

    const counter = `${String(activeIndex + 1).padStart(2, '0')} / ${String(projects.length).padStart(2, '0')}`
    const telemetryBandA = projects
      .map((p) => `PRJ_${p.number} // ${p.category.toUpperCase()} // ${p.stack.slice(0, 3).join(' · ').toUpperCase()}`)
      .join('   ///   ')
    const telemetryBandB = projects
      .map((p) => `${p.title.toUpperCase()} // ${p.stack.length} MODULES // ${p.status ? p.status.toUpperCase() : 'SHIPPED'}`)
      .join('   ///   ')

    return (
      <>
        {/* Very faint low-opacity scrolling mono background data visible around & through glass */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 flex flex-col justify-between overflow-hidden py-16 select-none"
        >
          <div
            className={`whitespace-nowrap font-mono text-sm uppercase tracking-[0.28em] text-[#D7E2EA]/[0.11] blur-[1px] sm:text-base ${
              prefersReduced ? '' : 'animate-crystal-data-slow'
            }`}
          >
            {telemetryBandA} &nbsp;&nbsp; {telemetryBandA}
          </div>
          <div
            className={`whitespace-nowrap font-mono text-xs uppercase tracking-[0.34em] text-[#D7E2EA]/[0.08] blur-[1.1px] sm:text-sm ${
              prefersReduced ? '' : 'animate-crystal-data-reverse'
            }`}
          >
            {telemetryBandB} &nbsp;&nbsp; {telemetryBandB}
          </div>
        </div>

        {/* Hover SVG Leader Lines + Monospace HUD (anchored at outer crystal ridge, extending cleanly into empty margin) */}
        <div
          ref={hudAnchorRef}
          aria-hidden={!showHoverHud}
          className={`pointer-events-none absolute inset-0 z-20 transition-opacity duration-200 ${
            showHoverHud ? 'opacity-100' : 'opacity-0'
          }`}
          style={
            {
              '--hud-x': '43%',
              '--hud-y': '31%',
            } as React.CSSProperties
          }
        >
          {hoveredProject && (
            <>
              {/* Upper-left diagonal SVG leader line + ID/Title block */}
              <div
                className="absolute"
                style={{
                  left: 'var(--hud-x)',
                  top: 'var(--hud-y)',
                  transform: 'translate(-100%, -100%)',
                }}
              >
                <div className="flex flex-col items-end pr-12 pb-3">
                  <div className="border-b border-[#D7E2EA]/75 pb-1.5 text-right font-mono text-[11px] uppercase leading-snug tracking-[0.16em] text-[#D7E2EA] sm:text-xs">
                    <div className="text-[#BBCCD7]">
                      <ScrambleText text={`PRJ_${hoveredProject.number}`} durationMs={320} />
                    </div>
                    <div className="font-medium text-white">
                      <ScrambleText text={hoveredProject.title} durationMs={380} delayMs={30} />
                    </div>
                  </div>
                </div>
                <svg
                  className="pointer-events-none absolute right-0 bottom-0 h-12 w-12 overflow-visible"
                  viewBox="0 0 48 48"
                  fill="none"
                >
                  <path
                    d="M48 48 L16 14 L0 14"
                    stroke="rgba(215, 226, 234, 0.72)"
                    strokeWidth="1"
                  />
                  <circle cx="48" cy="48" r="2.2" fill="#D7E2EA" />
                </svg>
              </div>

              {/* Right secondary mono metadata block outside crystal right shoulder */}
              <div
                className="absolute hidden sm:block"
                style={{
                  left: 'calc(var(--hud-x) + 395px)',
                  top: 'calc(var(--hud-y) + 95px)',
                }}
              >
                <div className="relative pl-10">
                  <svg
                    className="pointer-events-none absolute top-0 left-0 h-6 w-10 overflow-visible"
                    viewBox="0 0 40 24"
                    fill="none"
                  >
                    <path
                      d="M0 16 L16 4 L40 4"
                      stroke="rgba(215, 226, 234, 0.55)"
                      strokeWidth="1"
                    />
                    <circle cx="0" cy="16" r="2" fill="#D7E2EA" />
                  </svg>
                  <div className="border-t border-[#D7E2EA]/60 pt-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-[#D7E2EA]/85">
                    <div>
                      <ScrambleText
                        text={`${isNonEmpty(hoveredProject.year) ? `${hoveredProject.year} · ` : ''}${hoveredProject.stack.length} STACK`}
                        durationMs={340}
                      />
                    </div>
                    <div className="text-[#D7E2EA]/60">
                      <ScrambleText text="CLICK TO EXPLORE" durationMs={380} delayMs={40} />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Minimal Igloo-style Hairline Left / Right Arrows */}
        {inspectedIndex === null && (
          <>
            <button
              type="button"
              onClick={onPrev}
              aria-label="Previous project crystal"
              className="group absolute top-1/2 left-5 z-20 flex h-11 w-14 -translate-y-1/2 cursor-pointer items-center justify-center text-[#D7E2EA]/65 transition-all hover:-translate-x-0.5 hover:text-white sm:left-12"
            >
              <svg width="46" height="14" viewBox="0 0 46 14" fill="none" aria-hidden="true">
                <path d="M46 11 H2 L11 2" stroke="currentColor" strokeWidth="1" />
              </svg>
            </button>

            <button
              type="button"
              onClick={onNext}
              aria-label="Next project crystal"
              className="group absolute top-1/2 right-5 z-20 flex h-11 w-14 -translate-y-1/2 cursor-pointer items-center justify-center text-[#D7E2EA]/65 transition-all hover:translate-x-0.5 hover:text-white sm:right-12"
            >
              <svg width="46" height="14" viewBox="0 0 46 14" fill="none" aria-hidden="true">
                <path d="M0 11 H44 L35 2" stroke="currentColor" strokeWidth="1" />
              </svg>
            </button>
          </>
        )}

        {/* Top-left section header label (hidden when dark detail panel is open) */}
        {inspectedIndex === null && (
          <div className="pointer-events-none absolute top-6 left-6 z-20 sm:top-8 sm:left-10">
            <span className="font-mono text-xs uppercase tracking-[0.22em] text-[#D7E2EA]/60">
              Projects · Gallery
            </span>
          </div>
        )}

        {/* Bottom-center bracketed active project label & counter */}
        {inspectedIndex === null && (
          <div className="pointer-events-none absolute inset-x-0 bottom-7 z-20 flex flex-col items-center gap-3 px-4 sm:bottom-9">
            <button
              type="button"
              onClick={() => onInspect(activeIndex)}
              className="pointer-events-auto cursor-pointer font-mono text-xs font-medium uppercase tracking-[0.22em] text-[#D7E2EA] transition-opacity hover:opacity-80 sm:text-sm"
            >
              <CornerBrackets className="px-6 py-2.5">
                <ScrambleText text={activeProject.title} durationMs={380} />
              </CornerBrackets>
            </button>

            <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[#D7E2EA]/65">
              <span className="tabular-nums text-[#BBCCD7]">{counter}</span>
              <span aria-hidden="true">·</span>
              <span>{activeProject.category}</span>
              {isNonEmpty(activeProject.status) && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#D7E2EA]">{activeProject.status}</span>
                </>
              )}
            </div>
          </div>
        )}
      </>
    )
  }
)
