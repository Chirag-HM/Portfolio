import { Canvas, useFrame } from '@react-three/fiber'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import * as THREE from 'three'
import type { SceneSlotBaseProps } from '../components/SceneSlot'
import { skillGroups } from '../data/skills'
import { isReducedGpuTier } from '../lib/capabilities'
import { scrollToTarget, usePrefersReducedMotion } from '../lib/motion'
import { ParticleSculpture } from './stack/ParticleSculpture'
import { PedestalStage } from './stack/PedestalStage'
import { StackPedestalOverlay } from './stack/StackPedestalOverlay'

function StackCameraRig({ prefersReduced }: { prefersReduced: boolean }) {
  useFrame((state, delta) => {
    const dt = Math.min(0.1, delta)
    const parallaxX = prefersReduced ? 0 : state.pointer.x * 0.28
    const parallaxY = prefersReduced ? 0 : state.pointer.y * 0.14

    const alpha = prefersReduced ? 1 : 1 - Math.exp(-dt * 6)
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, parallaxX, alpha)
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 0.34 + parallaxY, alpha)
    state.camera.position.z = 5.15
    state.camera.lookAt(0, -0.06, 0)
  })

  return null
}

export default function StackPedestalScene({ inView = true }: SceneSlotBaseProps) {
  const outerRef = useRef<HTMLDivElement>(null)
  const dragStartX = useRef<number | null>(null)
  const scrollSyncLockUntil = useRef(0)

  const prefersReduced = usePrefersReducedMotion()
  const weakGpu = useMemo(() => isReducedGpuTier(), [])

  const [activeIndex, setActiveIndex] = useState(0)
  const [isMorphing, setIsMorphing] = useState(false)
  const [tabVisible, setTabVisible] = useState(() =>
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  )

  useEffect(() => {
    const onVis = () => setTabVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  // Step through stack sculptures cleanly while scrolling the 260vh sticky runway
  useEffect(() => {
    const onScroll = () => {
      if (performance.now() < scrollSyncLockUntil.current) return
      const el = outerRef.current
      if (!el) return

      const rect = el.getBoundingClientRect()
      const travel = Math.max(1, el.offsetHeight - window.innerHeight)
      const progress = THREE.MathUtils.clamp(-rect.top / travel, 0, 1)
      const nextIdx = Math.min(
        skillGroups.length - 1,
        Math.round(progress * (skillGroups.length - 1))
      )
      setActiveIndex(nextIdx)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const goToIndex = useCallback((nextIndex: number, syncScroll = true) => {
    const clamped = (nextIndex + skillGroups.length) % skillGroups.length
    setActiveIndex(clamped)

    if (syncScroll && outerRef.current) {
      scrollSyncLockUntil.current = performance.now() + 900
      const rect = outerRef.current.getBoundingClientRect()
      const sectionTop = rect.top + window.scrollY
      const travel = Math.max(1, outerRef.current.offsetHeight - window.innerHeight)
      const targetY =
        sectionTop + (clamped / Math.max(1, skillGroups.length - 1)) * travel
      scrollToTarget(Math.round(targetY))
    }
  }, [])

  // Keyboard arrow stepping when stack scene is active
  useEffect(() => {
    if (!inView) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        goToIndex(activeIndex + 1)
      } else if (e.key === 'ArrowLeft') {
        goToIndex(activeIndex - 1)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [inView, activeIndex, goToIndex])

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragStartX.current = e.clientX
  }

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null) return
    const deltaX = e.clientX - dragStartX.current
    dragStartX.current = null
    if (Math.abs(deltaX) > 48) {
      goToIndex(deltaX < 0 ? activeIndex + 1 : activeIndex - 1)
    }
  }

  return (
    <div
      ref={outerRef}
      aria-label="Interactive 3D stack particle pedestal"
      className="relative z-10 -mt-10 h-[260vh] rounded-t-[40px] bg-[#0C0C0C] sm:-mt-12 sm:rounded-t-[50px] md:-mt-14 md:rounded-t-[60px]"
    >
      <div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className="sticky top-0 h-screen w-full overflow-hidden rounded-t-[40px] bg-[#0C0C0C] select-none sm:rounded-t-[50px] md:rounded-t-[60px]"
      >
        <Canvas
          dpr={[1, 1.5]}
          frameloop={tabVisible && inView ? 'always' : 'never'}
          camera={{ position: [0, 0.34, 5.15], fov: 42, near: 0.1, far: 45 }}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.0,
          }}
          className="relative z-10 h-full w-full"
        >
          <StackCameraRig prefersReduced={prefersReduced} />
          <PedestalStage prefersReduced={prefersReduced} />
          <ParticleSculpture
            groups={skillGroups}
            activeIndex={activeIndex}
            weakGpu={weakGpu}
            prefersReduced={prefersReduced}
            onMorphStateChange={setIsMorphing}
          />
        </Canvas>

        <StackPedestalOverlay
          groups={skillGroups}
          activeIndex={activeIndex}
          isMorphing={isMorphing}
          prefersReduced={prefersReduced}
          onPrev={() => goToIndex(activeIndex - 1)}
          onNext={() => goToIndex(activeIndex + 1)}
          onSelectGroup={(idx) => goToIndex(idx)}
        />
      </div>
    </div>
  )
}
