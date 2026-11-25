import { Canvas, useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import * as THREE from 'three'
import { projects } from '../data/projects'
import { scrollToTarget, usePrefersReducedMotion } from '../lib/motion'
import type { SceneSlotBaseProps } from '../components/SceneSlot'
import { CrystalMesh } from './projects/CrystalMesh'
import { GalleryAtmosphere } from './projects/GalleryAtmosphere'
import { GalleryHudOverlay } from './projects/GalleryHudOverlay'
import { ProjectDetailPanel } from './projects/ProjectDetailPanel'

const CRYSTAL_SPACING = 7.2

function detectWeakGpuDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as Navigator & { deviceMemory?: number }
  const lowCores = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4
  const lowMem = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4
  return lowCores || lowMem
}

class PostProcessingBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true }
  }

  render() {
    if (this.state.failed) return null
    return this.props.children
  }
}

interface CrystalRigProps {
  activeIndex: number
  hoveredIndex: number | null
  inspectedIndex: number | null
  prefersReduced: boolean
  weakGpu: boolean
  onHoverChange: (index: number | null) => void
  onSelect: (index: number) => void
  onUpdateHudAnchor: (anchor: { xPct: number; yPct: number } | null) => void
}

function CrystalGalleryRig({
  activeIndex,
  hoveredIndex,
  inspectedIndex,
  prefersReduced,
  weakGpu,
  onHoverChange,
  onSelect,
  onUpdateHudAnchor,
}: CrystalRigProps) {
  const focusIndex = inspectedIndex ?? activeIndex
  const targetX = focusIndex * CRYSTAL_SPACING

  useFrame((state, delta) => {
    const dt = Math.min(0.14, delta)
    const isInspecting = inspectedIndex !== null

    const parallaxX = prefersReduced || isInspecting ? 0 : state.pointer.x * 0.32
    const parallaxY = prefersReduced || isInspecting ? 0 : state.pointer.y * 0.16

    const goalX = targetX + parallaxX
    const goalY = isInspecting ? 0.2 : 0.12 + parallaxY
    const goalZ = isInspecting ? 2.75 : 5.75

    const alpha = prefersReduced ? 1 : 1 - Math.exp(-dt * 8.5)
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, goalX, alpha)
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, goalY, alpha)
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, goalZ, alpha)
    state.camera.lookAt(
      state.camera.position.x - parallaxX * 0.35,
      isInspecting ? 0.2 : 0.12 + parallaxY * 0.25,
      0
    )
  })

  return (
    <>
      <GalleryAtmosphere prefersReduced={prefersReduced} activeX={targetX} />

      {projects.map((project, idx) => (
        <CrystalMesh
          key={project.slug}
          project={project}
          index={idx}
          positionX={idx * CRYSTAL_SPACING}
          isHovered={hoveredIndex === idx}
          isActive={activeIndex === idx}
          isInspected={inspectedIndex === idx}
          prefersReduced={prefersReduced}
          weakGpu={weakGpu}
          onHoverChange={onHoverChange}
          onSelect={onSelect}
          onUpdateHudAnchor={onUpdateHudAnchor}
        />
      ))}

      {!weakGpu && !prefersReduced && (
        <PostProcessingBoundary>
          <EffectComposer multisampling={0}>
            <Bloom
              mipmapBlur
              intensity={0.14}
              luminanceThreshold={1.45}
              luminanceSmoothing={0.35}
              radius={0.35}
            />
          </EffectComposer>
        </PostProcessingBoundary>
      )}
    </>
  )
}

export default function ProjectsCrystalScene({ inView = true }: SceneSlotBaseProps) {
  const outerRef = useRef<HTMLDivElement>(null)
  const hudAnchorRef = useRef<HTMLDivElement>(null)
  const dragStartX = useRef<number | null>(null)
  const scrollSyncLockUntil = useRef(0)

  const prefersReduced = usePrefersReducedMotion()
  const weakGpu = useMemo(() => detectWeakGpuDevice(), [])

  const [activeIndex, setActiveIndex] = useState(0)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [inspectedIndex, setInspectedIndex] = useState<number | null>(null)
  const [tabVisible, setTabVisible] = useState(() =>
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  )

  useEffect(() => {
    const onVis = () => setTabVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  // Glide between crystals while scrolling through the 260vh sticky runway
  useEffect(() => {
    const onScroll = () => {
      if (inspectedIndex !== null) return
      if (performance.now() < scrollSyncLockUntil.current) return
      const el = outerRef.current
      if (!el) return

      const rect = el.getBoundingClientRect()
      const travel = Math.max(1, el.offsetHeight - window.innerHeight)
      const progress = THREE.MathUtils.clamp(-rect.top / travel, 0, 1)
      const nextIdx = Math.min(
        projects.length - 1,
        Math.round(progress * (projects.length - 1))
      )
      setActiveIndex(nextIdx)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [inspectedIndex])

  const goToIndex = useCallback(
    (nextIndex: number, syncScroll = true) => {
      const clamped = (nextIndex + projects.length) % projects.length
      setActiveIndex(clamped)
      setHoveredIndex(null)

      if (syncScroll && outerRef.current) {
        scrollSyncLockUntil.current = performance.now() + 900
        const rect = outerRef.current.getBoundingClientRect()
        const sectionTop = rect.top + window.scrollY
        const travel = Math.max(1, outerRef.current.offsetHeight - window.innerHeight)
        const targetY =
          sectionTop + (clamped / Math.max(1, projects.length - 1)) * travel
        scrollToTarget(Math.round(targetY))
      }
    },
    []
  )

  // Keyboard arrow navigation when section is active
  useEffect(() => {
    if (!inView || inspectedIndex !== null) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        goToIndex(activeIndex + 1)
      } else if (e.key === 'ArrowLeft') {
        goToIndex(activeIndex - 1)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [inView, inspectedIndex, activeIndex, goToIndex])

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (inspectedIndex !== null) return
    dragStartX.current = e.clientX
  }

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null || inspectedIndex !== null) return
    const deltaX = e.clientX - dragStartX.current
    dragStartX.current = null
    if (Math.abs(deltaX) > 48) {
      goToIndex(deltaX < 0 ? activeIndex + 1 : activeIndex - 1)
    }
  }

  const updateHudAnchor = useCallback((anchor: { xPct: number; yPct: number } | null) => {
    const el = hudAnchorRef.current
    if (!el || !anchor) return
    el.style.setProperty('--hud-x', `${anchor.xPct.toFixed(2)}%`)
    el.style.setProperty('--hud-y', `${anchor.yPct.toFixed(2)}%`)
  }, [])

  const inspectedProject = inspectedIndex !== null ? projects[inspectedIndex] : null

  return (
    <div
      ref={outerRef}
      aria-label="Interactive 3D project crystal gallery"
      className="relative h-[260vh] bg-[#0C0C0C]"
    >
      <div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className="sticky top-0 h-screen w-full overflow-hidden bg-[#0C0C0C] select-none"
      >
        <Canvas
          dpr={[1, 1.5]}
          frameloop={tabVisible && inView ? 'always' : 'never'}
          camera={{ position: [0, 0.12, 5.75], fov: 42, near: 0.1, far: 45 }}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.0,
          }}
          className="relative z-10 h-full w-full"
        >
          <CrystalGalleryRig
            activeIndex={activeIndex}
            hoveredIndex={hoveredIndex}
            inspectedIndex={inspectedIndex}
            prefersReduced={prefersReduced}
            weakGpu={weakGpu}
            onHoverChange={setHoveredIndex}
            onSelect={(idx) => {
              setActiveIndex(idx)
              setInspectedIndex(idx)
            }}
            onUpdateHudAnchor={updateHudAnchor}
          />
        </Canvas>

        <GalleryHudOverlay
          ref={hudAnchorRef}
          projects={projects}
          activeIndex={activeIndex}
          hoveredIndex={hoveredIndex}
          inspectedIndex={inspectedIndex}
          prefersReduced={prefersReduced}
          onPrev={() => goToIndex(activeIndex - 1)}
          onNext={() => goToIndex(activeIndex + 1)}
          onInspect={(idx) => {
            setActiveIndex(idx)
            setInspectedIndex(idx)
          }}
        />

        <ProjectDetailPanel
          project={inspectedProject}
          onClose={() => setInspectedIndex(null)}
        />
      </div>
    </div>
  )
}
