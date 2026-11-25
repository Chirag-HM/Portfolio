import { Environment } from '@react-three/drei/core/Environment'
import { Lightformer } from '@react-three/drei/core/Lightformer'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

export interface GalleryAtmosphereProps {
  prefersReduced: boolean
  activeX: number
}

const BACKDROP_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const BACKDROP_FRAGMENT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    float dist = length((vUv - vec2(0.5, 0.5)) * vec2(1.25, 1.45));
    float mist = smoothstep(0.75, 0.0, dist);
    // Linear RGB values tuned for ACES Filmic + sRGB so #0C0C0C stays deep graphite
    vec3 centerGlow = vec3(0.022, 0.031, 0.044);
    gl_FragColor = vec4(centerGlow, mist * 0.65);
  }
`

const DUST_VERTEX = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vAlpha;

  void main() {
    vec3 pos = position;
    pos.y += sin(uTime * 0.28 + aSeed * 12.0) * 0.22;
    pos.x += cos(uTime * 0.19 + aSeed * 9.0) * 0.18;
    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPos;
    gl_PointSize = clamp((1.6 + aSeed * 2.1) * uPixelRatio * (5.0 / max(1.0, -mvPos.z)), 1.0, 6.0);
    vAlpha = 0.22 + 0.35 * sin(uTime * 0.7 + aSeed * 20.0);
  }
`

const DUST_FRAGMENT = /* glsl */ `
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float soft = pow(1.0 - d, 1.8);
    gl_FragColor = vec4(0.84, 0.89, 0.94, soft * vAlpha);
  }
`

export function GalleryAtmosphere({ prefersReduced, activeX }: GalleryAtmosphereProps) {
  const backdropRef = useRef<THREE.Mesh>(null)
  const dustMatRef = useRef<THREE.ShaderMaterial>(null)

  const { dustGeo, dustUniforms } = useMemo(() => {
    const count = 220
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // Deterministic spatial spread along the full 4-crystal gallery span
      const h1 = ((i * 73856093) >>> 0) % 1000 / 1000
      const h2 = ((i * 19349663) >>> 0) % 1000 / 1000
      const h3 = ((i * 83492791) >>> 0) % 1000 / 1000
      positions[i * 3] = (h1 - 0.15) * 32 - 2
      positions[i * 3 + 1] = (h2 - 0.5) * 7.5
      positions[i * 3 + 2] = (h3 - 0.5) * 8 - 1
      seeds[i] = h1
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))

    return {
      dustGeo: geo,
      dustUniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.5) },
      },
    }
  }, [])

  useEffect(() => {
    const mat = dustMatRef.current
    return () => {
      dustGeo.dispose()
      mat?.dispose()
    }
  }, [dustGeo])

  useFrame((state) => {
    if (backdropRef.current) {
      backdropRef.current.position.x = activeX
    }
    if (dustMatRef.current && !prefersReduced) {
      dustMatRef.current.uniforms.uTime.value = state.clock.getElapsedTime()
    }
  })

  return (
    <>
      <fogExp2 attach="fog" args={['#0C0C0C', 0.088]} />

      {/* Subtle cool-slate misty glow behind active crystal (transparent edges let #0C0C0C + mono telemetry show through) */}
      <mesh ref={backdropRef} position={[0, 0, -4.5]}>
        <planeGeometry args={[18, 11]} />
        <shaderMaterial
          vertexShader={BACKDROP_VERTEX}
          fragmentShader={BACKDROP_FRAGMENT}
          transparent
          depthWrite={false}
          fog={false}
        />
      </mesh>

      {/* Soft cool-white rim & key studio lighting calibrated to keep crystal glints subtle */}
      <ambientLight intensity={0.32} color="#c4d6e8" />
      <directionalLight position={[5.5, 6.5, 3.5]} intensity={1.1} color="#eef5ff" />
      <directionalLight position={[-6, 4, -5.5]} intensity={1.35} color="#ffffff" />
      <directionalLight position={[5.5, -3, -4.5]} intensity={1.0} color="#d6e6f8" />

      {/* Procedural environment map (Lightformer softboxes, zero external HDR requests) */}
      <Environment resolution={128} frames={1}>
        <Lightformer
          intensity={1.35}
          color="#f4f8ff"
          position={[0, 6, 2]}
          rotation={[Math.PI / 3, 0, 0]}
          scale={[12, 3, 1]}
        />
        <Lightformer
          intensity={1.25}
          color="#dceafc"
          position={[-6, 1.5, -1]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[9, 5, 1]}
        />
        <Lightformer
          intensity={1.15}
          color="#c4daf2"
          position={[6, 0.5, -2.5]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[9, 5, 1]}
        />
        <Lightformer
          intensity={1.1}
          color="#ffffff"
          position={[0, -4, 1]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[10, 8, 1]}
        />
      </Environment>

      {/* Faint drifting atmospheric dust */}
      <points geometry={dustGeo} frustumCulled={false}>
        <shaderMaterial
          ref={dustMatRef}
          vertexShader={DUST_VERTEX}
          fragmentShader={DUST_FRAGMENT}
          uniforms={dustUniforms}
          transparent
          depthWrite={false}
        />
      </points>
    </>
  )
}
