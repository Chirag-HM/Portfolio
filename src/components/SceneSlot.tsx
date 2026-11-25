import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react'
import type { SceneChapterId } from '../data/types'
import { useDeviceSceneEligibility } from '../lib/capabilities'
import { usePrefersReducedMotion } from '../lib/motion'
import { useViewMode } from '../lib/viewModeContext'
import { SceneErrorBoundary } from './SceneErrorBoundary'

export interface SceneSlotBaseProps {
  soundEnabled?: boolean
  inView?: boolean
  prefersReduced?: boolean
  onContextLost?: () => void
}

interface SceneSlotProps<TProps extends SceneSlotBaseProps = SceneSlotBaseProps> {
  chapterId: SceneChapterId
  /** Semantic landmark element for this chapter */
  as?: 'section' | 'footer' | 'div'
  /** Accessible landmark label */
  landmarkLabel?: string
  /** Lazy-loaded 3D scene component; omit while section is Classic-only */
  scene?: ComponentType<TProps>
  /** Extra props forwarded only to the mounted 3D scene */
  sceneProps?: Omit<TProps, keyof SceneSlotBaseProps>
  /** Whether the scene provides optional audio controls */
  hasAudio?: boolean
  /** Human-readable chapter label for skeleton / status announcements */
  chapterLabel?: string
  /** Class always applied to chapter host landmark */
  className?: string
  /** Class applied only while an immersive scene can mount (prevents height collapse & shifts) */
  minHeightOnMountClassName?: string
  /** Static Classic fallback */
  fallback: ReactNode
  /** Semantic non-interactive DOM outline kept in sr-only alongside 3D canvas/skeleton */
  accessibleFallback?: ReactNode
}

function SceneLoadingSkeleton({
  chapterLabel,
  fallback,
}: {
  chapterLabel: string
  fallback: ReactNode
}) {
  const [showReadableFallback, setShowReadableFallback] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setShowReadableFallback(true), 220)
    return () => window.clearTimeout(timer)
  }, [])

  if (showReadableFallback) {
    return (
      <div className="relative min-h-screen bg-[#0C0C0C]">
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none sticky top-4 z-30 mx-auto flex w-fit items-center gap-2.5 rounded-full border border-[#D7E2EA]/25 bg-[#0C0C0C]/92 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-[#BBCCD7]"
        >
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#9E7CE8]"
            aria-hidden="true"
          />
          Streaming 3D {chapterLabel}
        </div>
        {fallback}
      </div>
    )
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 flex h-screen w-full flex-col justify-between bg-[#0C0C0C] px-6 py-8 sm:px-10"
    >
      <span className="font-mono text-xs uppercase tracking-[0.22em] text-[#D7E2EA]/75">
        {chapterLabel}
      </span>
      <div className="mx-auto flex flex-col items-center gap-3">
        <div
          className="h-8 w-8 animate-spin rounded-full border border-[#D7E2EA]/20 border-t-[#BBCCD7]"
          aria-hidden="true"
        />
        <span className="font-mono text-xs uppercase tracking-[0.22em] text-[#D7E2EA]/75">
          Initializing 3D stage...
        </span>
      </div>
      <div className="h-4" aria-hidden="true" />
    </div>
  )
}

function SceneBoundaryPlaceholder({ chapterLabel }: { chapterLabel: string }) {
  return (
    <div className="sticky top-0 flex h-screen w-full flex-col justify-between bg-[#0C0C0C] px-6 py-8 select-none sm:px-10">
      <span className="font-mono text-xs uppercase tracking-[0.22em] text-[#D7E2EA]/75">
        {chapterLabel}
      </span>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#D7E2EA]/12 to-transparent" />
      <div className="h-4" />
    </div>
  )
}

/**
 * Mounts an optional lazy 3D scene ONLY when:
 * 1) a scene component exists,
 * 2) WebGL is available,
 * 3) the device is not low-end or touch-primary / narrow,
 * 4) prefers-reduced-motion is off,
 * 5) the user has not chosen Classic view,
 * 6) no WebGL/render crash occurred in this slot, and
 * 7) this section holds the single active scene slot in the viewport.
 */
export function SceneSlot<TProps extends SceneSlotBaseProps = SceneSlotBaseProps>({
  chapterId,
  as: HostTag = 'section',
  landmarkLabel,
  scene: SceneComponent,
  sceneProps,
  hasAudio = false,
  chapterLabel = chapterId,
  className,
  minHeightOnMountClassName,
  fallback,
  accessibleFallback,
}: SceneSlotProps<TProps>) {
  const hostRef = useRef<HTMLDivElement>(null)
  const deviceEligible = useDeviceSceneEligibility()
  const prefersReduced = usePrefersReducedMotion()
  const [crashMode, setCrashMode] = useState<'classic' | null>(null)
  const {
    viewMode,
    activeSceneChapter,
    registerSceneSlot,
    requestRecomputeSlots,
    soundEnabled,
  } = useViewMode()

  const hasCrashed = crashMode === viewMode
  const canMount =
    Boolean(SceneComponent) &&
    viewMode === 'immersive' &&
    deviceEligible &&
    !hasCrashed

  const handleSceneCrash = useCallback(() => {
    setCrashMode('classic')
    requestRecomputeSlots()
  }, [requestRecomputeSlots])

  useEffect(() => {
    const el = hostRef.current
    if (!canMount || !el) return

    const unregister = registerSceneSlot(chapterId, el, hasAudio)
    const observer = new IntersectionObserver(
      () => requestRecomputeSlots(),
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    )
    observer.observe(el)

    return () => {
      observer.disconnect()
      unregister()
    }
  }, [canMount, chapterId, hasAudio, registerSceneSlot, requestRecomputeSlots])

  const isActive = canMount && activeSceneChapter === chapterId && Boolean(SceneComponent)

  const hostClassName =
    [className, canMount ? minHeightOnMountClassName : ''].filter(Boolean).join(' ') || undefined

  if (!canMount || !SceneComponent) {
    return (
      <HostTag
        id={chapterId}
        ref={hostRef as never}
        aria-label={landmarkLabel}
        className={hostClassName}
        style={{ overflowX: 'clip' }}
      >
        <div className="animate-scene-enter">{fallback}</div>
      </HostTag>
    )
  }

  return (
    <HostTag
      id={chapterId}
      ref={hostRef as never}
      aria-label={landmarkLabel}
      className={hostClassName}
    >
      {accessibleFallback && <div className="sr-only">{accessibleFallback}</div>}
      {isActive ? (
        <div className="animate-scene-enter">
          <SceneErrorBoundary onError={handleSceneCrash} fallback={fallback}>
            <Suspense
              fallback={<SceneLoadingSkeleton chapterLabel={chapterLabel} fallback={fallback} />}
            >
              <SceneComponent
                {...({
                  soundEnabled,
                  inView: isActive,
                  prefersReduced,
                  onContextLost: handleSceneCrash,
                  ...sceneProps,
                } as TProps)}
              />
            </Suspense>
          </SceneErrorBoundary>
        </div>
      ) : (
        <SceneBoundaryPlaceholder chapterLabel={chapterLabel} />
      )}
    </HostTag>
  )
}
