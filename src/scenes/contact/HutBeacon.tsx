import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { HUT_BASE_Y, HUT_X, HUT_Z } from './terrain'

interface PulseWave {
  active: boolean
  age: number
  duration: number
  maxScale: number
  strong: boolean
}

export interface HutBeaconProps {
  signalNonce: number
  prefersReduced: boolean
}

const MAX_WAVES = 3

export function HutBeacon({ signalNonce, prefersReduced }: HutBeaconProps) {
  const emitterRef = useRef<THREE.Mesh>(null)
  const waveRefs = useRef<Array<THREE.Mesh | null>>([])
  const waveMatRefs = useRef<Array<THREE.MeshBasicMaterial | null>>([])

  const prevNonceRef = useRef(0)
  const idleTimerRef = useRef(1.2)
  const wavesRef = useRef<PulseWave[]>(
    Array.from({ length: MAX_WAVES }, () => ({
      active: false,
      age: 0,
      duration: 2.6,
      maxScale: 4.5,
      strong: false,
    }))
  )

  const ringGeo = useMemo(() => new THREE.RingGeometry(0.84, 0.93, 48), [])

  useEffect(() => {
    const mats = waveMatRefs.current
    return () => {
      ringGeo.dispose()
      mats.forEach((m) => m?.dispose())
    }
  }, [ringGeo])

  const spawnWave = (strong: boolean) => {
    const slot =
      wavesRef.current.find((w) => !w.active) ??
      wavesRef.current.reduce((oldest, curr) => (curr.age > oldest.age ? curr : oldest))
    slot.active = true
    slot.age = 0
    slot.duration = strong ? 2.8 : 3.0
    slot.maxScale = strong ? 6.8 : 4.2
    slot.strong = strong
  }

  // Fire strong wave whenever user activates "Send a signal"
  useEffect(() => {
    if (signalNonce > prevNonceRef.current) {
      prevNonceRef.current = signalNonce
      spawnWave(true)
    }
  }, [signalNonce])

  useFrame((_, delta) => {
    const dt = Math.min(0.16, delta)

    if (prefersReduced) {
      // Static subtle showcase ring when reduced motion is preferred
      const mesh0 = waveRefs.current[0]
      const mat0 = waveMatRefs.current[0]
      if (mesh0 && mat0) {
        mesh0.visible = true
        mesh0.scale.setScalar(1.85)
        mat0.opacity = 0.28
      }
      return
    }

    idleTimerRef.current += dt
    if (idleTimerRef.current >= 3.3) {
      idleTimerRef.current = 0
      spawnWave(false)
    }

    let strongestPulse = 0
    for (let i = 0; i < MAX_WAVES; i++) {
      const wave = wavesRef.current[i]
      const mesh = waveRefs.current[i]
      const mat = waveMatRefs.current[i]
      if (!mesh || !mat) continue

      if (!wave.active) {
        mesh.visible = false
        continue
      }

      wave.age += dt
      const t = wave.age / wave.duration
      if (t >= 1) {
        wave.active = false
        mesh.visible = false
        continue
      }

      mesh.visible = true
      const eased = 1 - Math.pow(1 - t, 2.2)
      const scale = 0.14 + eased * wave.maxScale
      mesh.scale.setScalar(scale)

      const fade = (1 - t) * (1 - t)
      mat.opacity = (wave.strong ? 0.92 : 0.56) * fade
      mat.color.set(wave.strong ? '#ffe4b5' : '#d7e2ea')

      if (t < 0.25) {
        strongestPulse = Math.max(strongestPulse, wave.strong ? 1 : 0.5)
      }
    }

    if (emitterRef.current) {
      const mat = emitterRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 1.6 + strongestPulse * 2.2
    }
  })

  return (
    <group position={[HUT_X, HUT_BASE_Y - 0.08, HUT_Z]}>
      {/* Grounded stone/slate plinth foundation */}
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[2.22, 0.24, 1.92]} />
        <meshStandardMaterial color="#181e28" roughness={0.92} flatShading />
      </mesh>

      {/* Main insulated cabin body */}
      <mesh position={[0, 0.66, 0]}>
        <boxGeometry args={[1.68, 0.88, 1.44]} />
        <meshStandardMaterial color="#232c39" roughness={0.82} flatShading />
      </mesh>

      {/* Overhanging dual-pitch cantilevered cabin roof panels */}
      <mesh position={[-0.45, 1.24, 0]} rotation={[0, 0, 0.34]}>
        <boxGeometry args={[1.15, 0.1, 1.72]} />
        <meshStandardMaterial color="#1a222d" roughness={0.78} flatShading />
      </mesh>
      <mesh position={[0.45, 1.24, 0]} rotation={[0, 0, -0.34]}>
        <boxGeometry args={[1.15, 0.1, 1.72]} />
        <meshStandardMaterial color="#1a222d" roughness={0.78} flatShading />
      </mesh>
      <mesh position={[0, 1.41, 0]}>
        <boxGeometry args={[0.14, 0.09, 1.74]} />
        <meshStandardMaterial color="#2d3848" roughness={0.7} />
      </mesh>

      {/* Front entry porch / airlock vestibule */}
      <mesh position={[0.56, 0.56, 0.78]}>
        <boxGeometry args={[0.66, 0.64, 0.44]} />
        <meshStandardMaterial color="#1e2733" roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0.56, 0.91, 0.8]}>
        <boxGeometry args={[0.74, 0.08, 0.52]} />
        <meshStandardMaterial color="#2a3545" roughness={0.75} />
      </mesh>

      {/* Main warm glowing front picture window */}
      <mesh position={[-0.24, 0.68, 0.725]}>
        <boxGeometry args={[0.66, 0.44, 0.04]} />
        <meshStandardMaterial
          color="#ffe3b3"
          emissive="#ffae46"
          emissiveIntensity={2.5}
          roughness={0.2}
        />
      </mesh>
      {/* Window exterior crossbar mullions */}
      <mesh position={[-0.24, 0.68, 0.748]}>
        <boxGeometry args={[0.04, 0.45, 0.03]} />
        <meshStandardMaterial color="#161b24" roughness={0.8} />
      </mesh>
      <mesh position={[-0.24, 0.68, 0.748]}>
        <boxGeometry args={[0.67, 0.04, 0.03]} />
        <meshStandardMaterial color="#161b24" roughness={0.8} />
      </mesh>

      {/* Side vertical warm slit window + porch doorway light */}
      <mesh position={[0.845, 0.72, -0.15]}>
        <boxGeometry args={[0.04, 0.42, 0.24]} />
        <meshStandardMaterial
          color="#ffd799"
          emissive="#ff9f38"
          emissiveIntensity={2.1}
        />
      </mesh>
      <mesh position={[0.56, 0.5, 1.005]}>
        <boxGeometry args={[0.26, 0.46, 0.03]} />
        <meshStandardMaterial
          color="#ffd89c"
          emissive="#ff9a32"
          emissiveIntensity={1.65}
        />
      </mesh>

      {/* Warm amber local spill light onto snow ridge around cabin */}
      <pointLight
        position={[0.1, 0.72, 1.38]}
        color="#ffb155"
        intensity={4.2}
        distance={8.5}
        decay={2}
      />

      {/* Beacon tower beside cabin */}
      <group position={[-1.24, 0.1, -0.32]}>
        {/* Tower base pad */}
        <mesh position={[0, 0.06, 0]}>
          <boxGeometry args={[0.38, 0.14, 0.38]} />
          <meshStandardMaterial color="#1a212b" roughness={0.9} />
        </mesh>

        {/* Slender tapered radio mast */}
        <mesh position={[0, 1.28, 0]}>
          <cylinderGeometry args={[0.022, 0.062, 2.45, 8]} />
          <meshStandardMaterial color="#516176" roughness={0.5} metalness={0.5} />
        </mesh>

        {/* Horizontal transceiver crossbars */}
        <mesh position={[0, 1.85, 0]}>
          <boxGeometry args={[0.42, 0.025, 0.025]} />
          <meshStandardMaterial color="#7387a1" roughness={0.45} metalness={0.5} />
        </mesh>
        <mesh position={[0, 2.18, 0]}>
          <boxGeometry args={[0.26, 0.022, 0.022]} />
          <meshStandardMaterial color="#7387a1" roughness={0.45} metalness={0.5} />
        </mesh>

        {/* Beacon tip bulb */}
        <mesh ref={emitterRef} position={[0, 2.52, 0]}>
          <sphereGeometry args={[0.068, 12, 12]} />
          <meshStandardMaterial
            color="#f5f9ff"
            emissive="#dce8ff"
            emissiveIntensity={1.8}
          />
        </mesh>

        {/* Expanding fading translucent signal ring pool */}
        {Array.from({ length: MAX_WAVES }, (_, idx) => (
          <mesh
            key={idx}
            ref={(el) => {
              waveRefs.current[idx] = el
            }}
            position={[0, 2.52, 0]}
            rotation={[-Math.PI / 2.25, 0.1, 0]}
            geometry={ringGeo}
            visible={false}
          >
            <meshBasicMaterial
              ref={(el) => {
                waveMatRefs.current[idx] = el
              }}
              color="#d7e2ea"
              transparent
              opacity={0}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  )
}
