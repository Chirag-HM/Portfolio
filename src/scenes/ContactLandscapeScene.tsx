import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { SceneSlotBaseProps } from '../components/SceneSlot'
import { isReducedGpuTier } from '../lib/capabilities'
import { usePrefersReducedMotion } from '../lib/motion'
import { ContactOverlay } from './contact/ContactOverlay'
import { HutBeacon } from './contact/HutBeacon'
import { MoonlitTerrain } from './contact/MoonlitTerrain'
import { MountainAtmosphere } from './contact/MountainAtmosphere'
import { sampleCameraPose } from './contact/terrain'

function ContactCameraRig({
  scrollProgressRef,
  prefersReduced,
}: {
  scrollProgressRef: React.RefObject<number>
  prefersReduced: boolean
}) {
  const goalPos = useMemo(() => new THREE.Vector3(), [])
  const goalLook = useMemo(() => new THREE.Vector3(), [])
  const smoothLook = useMemo(() => new THREE.Vector3(0, 1.4, -14), [])

  useFrame((state, delta) => {
    const dt = Math.min(0.14, delta)
    const pose = sampleCameraPose(
      scrollProgressRef.current ?? 0,
      state.pointer.x,
      state.pointer.y,
      prefersReduced
    )

    goalPos.set(...pose.position)
    goalLook.set(...pose.lookAt)

    const alpha = prefersReduced ? 1 : 1 - Math.exp(-dt * 6.5)
    state.camera.position.lerp(goalPos, alpha)
    smoothLook.lerp(goalLook, alpha)
    state.camera.lookAt(smoothLook)
  })

  return null
}

export default function ContactLandscapeScene({ inView = true }: SceneSlotBaseProps) {
  const outerRef = useRef<HTMLDivElement>(null)
  const revealRef = useRef<HTMLDivElement>(null)
  const scrollProgressRef = useRef(0)

  const prefersReduced = usePrefersReducedMotion()
  const weakGpu = useMemo(() => isReducedGpuTier(), [])

  const [scrollEndVisible, setScrollEndVisible] = useState(false)
  const [signalNonce, setSignalNonce] = useState(0)
  const [tabVisible, setTabVisible] = useState(() =>
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  )

  useEffect(() => {
    const onVis = () => setTabVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  // Track scroll progress smoothly without synchronous setState or per-frame re-renders
  useEffect(() => {
    const syncRevealVar = (fromScrollEvent: boolean) => {
      const el = outerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const travel = Math.max(1, el.offsetHeight - window.innerHeight)
      const progress = THREE.MathUtils.clamp(-rect.top / travel, 0, 1)
      scrollProgressRef.current = progress

      const reveal = prefersReduced ? 1 : THREE.MathUtils.clamp((progress - 0.54) / 0.28, 0, 1)
      if (revealRef.current) {
        revealRef.current.style.setProperty('--end-reveal', reveal.toFixed(3))
      }
      if (fromScrollEvent) {
        setScrollEndVisible(progress >= 0.54)
      }
    }

    syncRevealVar(false)
    const onScroll = () => syncRevealVar(true)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [prefersReduced])

  const endVisible = prefersReduced || scrollEndVisible

  return (
    <div
      ref={outerRef}
      aria-label="Moonlit mountain contact finale"
      className="relative z-10 h-[260vh] bg-[#0C0C0C]"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#0C0C0C] select-none">
        <Canvas
          dpr={[1, 1.5]}
          frameloop={tabVisible && inView ? 'always' : 'never'}
          camera={{ position: [-2.4, 7.6, 14.5], fov: 44, near: 0.2, far: 110 }}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.0,
          }}
          className="relative z-10 h-full w-full"
        >
          <ContactCameraRig
            scrollProgressRef={scrollProgressRef}
            prefersReduced={prefersReduced}
          />
          <MountainAtmosphere weakGpu={weakGpu} prefersReduced={prefersReduced} />
          <MoonlitTerrain weakGpu={weakGpu} />
          <HutBeacon signalNonce={signalNonce} prefersReduced={prefersReduced} />
        </Canvas>

        <ContactOverlay
          endVisible={endVisible}
          prefersReduced={prefersReduced}
          revealRef={revealRef}
          onSendSignal={() => setSignalNonce((n) => n + 1)}
        />
      </div>
    </div>
  )
}
