import { Environment } from '@react-three/drei/core/Environment'
import { Lightformer } from '@react-three/drei/core/Lightformer'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

const REFLECTION_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const REFLECTION_FRAGMENT = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vec2 centered = (vUv - 0.5) * 2.0;
    float r = length(centered);
    if (r > 1.0) discard;

    // Faint sculpture core bounce & mirrored overhead ring reflection across glass surface
    float coreGlow = exp(-r * r * 7.5) * (0.28 + 0.04 * sin(uTime * 1.4));
    float ringMirror = exp(-pow((r - 0.54) * 14.0, 2.0)) * 0.22;
    float outerFade = 1.0 - smoothstep(0.65, 1.0, r);

    vec3 iceTint = vec3(0.75, 0.83, 0.92);
    vec3 accentHint = vec3(0.56, 0.25, 0.85);
    vec3 col = mix(iceTint, accentHint, exp(-r * r * 5.0) * 0.35);

    float alpha = (coreGlow + ringMirror) * outerFade;
    gl_FragColor = vec4(col, alpha);
  }
`

const DUST_VERTEX = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    p.y += sin(uTime * 0.32 + aSeed * 14.0) * 0.16;
    p.x += cos(uTime * 0.22 + aSeed * 10.0) * 0.14;
    vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPos;
    gl_PointSize = clamp((1.5 + aSeed * 1.8) * uPixelRatio * (4.5 / max(1.0, -mvPos.z)), 1.0, 5.0);
    vAlpha = 0.18 + 0.24 * sin(uTime * 0.65 + aSeed * 18.0);
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

export interface PedestalStageProps {
  prefersReduced: boolean
}

export function PedestalStage({ prefersReduced }: PedestalStageProps) {
  const reflMatRef = useRef<THREE.ShaderMaterial>(null)
  const dustMatRef = useRef<THREE.ShaderMaterial>(null)

  const { reflUniforms, dustGeo, dustUniforms } = useMemo(() => {
    const count = 130
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const h1 = (((i * 73856093) >>> 0) % 1000) / 1000
      const h2 = (((i * 19349663) >>> 0) % 1000) / 1000
      const h3 = (((i * 83492791) >>> 0) % 1000) / 1000
      positions[i * 3] = (h1 - 0.5) * 7.5
      positions[i * 3 + 1] = (h2 - 0.45) * 5.0
      positions[i * 3 + 2] = (h3 - 0.5) * 5.0 - 0.5
      seeds[i] = h1
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))

    const pxRatio = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.5)

    return {
      reflUniforms: { uTime: { value: 0 } },
      dustGeo: geo,
      dustUniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: pxRatio },
      },
    }
  }, [])

  useEffect(() => {
    const rMat = reflMatRef.current
    const dMat = dustMatRef.current
    return () => {
      dustGeo.dispose()
      rMat?.dispose()
      dMat?.dispose()
    }
  }, [dustGeo])

  useFrame((state) => {
    if (prefersReduced) return
    const t = state.clock.getElapsedTime()
    if (reflMatRef.current) reflMatRef.current.uniforms.uTime.value = t
    if (dustMatRef.current) dustMatRef.current.uniforms.uTime.value = t
  })

  return (
    <>
      <fogExp2 attach="fog" args={['#0C0C0C', 0.088]} />

      {/* Soft cool-white studio rim & overhead chamber lighting */}
      <ambientLight intensity={0.28} color="#c4d6e8" />
      <directionalLight position={[4.5, 5.5, 4.0]} intensity={1.15} color="#eef5ff" />
      <directionalLight position={[-5.0, 4.2, -5.5]} intensity={1.8} color="#ffffff" />
      <directionalLight position={[0, -2.0, -4.0]} intensity={0.85} color="#8f7ce8" />

      <Environment resolution={128} frames={1}>
        <Lightformer
          intensity={1.5}
          color="#f4f8ff"
          position={[0, 5.5, 1.5]}
          rotation={[Math.PI / 2.6, 0, 0]}
          scale={[10, 3, 1]}
        />
        <Lightformer
          intensity={1.25}
          color="#d5e5f7"
          position={[-5.5, 1.5, -1]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[8, 4, 1]}
        />
        <Lightformer
          intensity={1.1}
          color="#9cb5d1"
          position={[5.5, 1.0, -2]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[8, 4, 1]}
        />
      </Environment>

      {/* Overhead luminous vitrine ceiling halo ring */}
      <mesh position={[0, 1.96, -0.25]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.65, 0.016, 12, 96]} />
        <meshBasicMaterial color="#D7E2EA" transparent opacity={0.44} />
      </mesh>

      {/* Circular stepped glass pedestal at base */}
      <group position={[0, -1.28, 0]}>
        {/* Outer smoked glass plinth disc */}
        <mesh position={[0, -0.07, 0]}>
          <cylinderGeometry args={[3.7, 3.76, 0.06, 96]} />
          <meshPhysicalMaterial
            color="#0e131b"
            metalness={0.32}
            roughness={0.18}
            clearcoat={1}
            clearcoatRoughness={0.1}
            transparent
            opacity={0.86}
          />
        </mesh>

        {/* Mid glass tier */}
        <mesh position={[0, -0.035, 0]}>
          <cylinderGeometry args={[2.72, 2.77, 0.07, 96]} />
          <meshPhysicalMaterial
            color="#111722"
            metalness={0.35}
            roughness={0.14}
            clearcoat={1}
            clearcoatRoughness={0.08}
            transparent
            opacity={0.88}
          />
        </mesh>

        {/* Top smoked glass turntable deck */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[1.92, 1.96, 0.08, 96]} />
          <meshPhysicalMaterial
            color="#141b27"
            metalness={0.38}
            roughness={0.11}
            clearcoat={1}
            clearcoatRoughness={0.06}
            transparent
            opacity={0.9}
          />
        </mesh>

        {/* Faint surface reflection & sculpture underglow shader */}
        <mesh position={[0, 0.043, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[2.75, 64]} />
          <shaderMaterial
            ref={reflMatRef}
            vertexShader={REFLECTION_VERTEX}
            fragmentShader={REFLECTION_FRAGMENT}
            uniforms={reflUniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Thin concentric emissive rings */}
        <mesh position={[0, 0.044, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.32, 1.334, 128]} />
          <meshBasicMaterial color="#9E7CE8" transparent opacity={0.48} />
        </mesh>
        <mesh position={[0, 0.044, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.91, 1.928, 128]} />
          <meshBasicMaterial color="#E6EFF6" transparent opacity={0.78} />
        </mesh>
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.71, 2.728, 128]} />
          <meshBasicMaterial color="#BBCCD7" transparent opacity={0.42} />
        </mesh>
        <mesh position={[0, -0.036, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.68, 3.698, 128]} />
          <meshBasicMaterial color="#D7E2EA" transparent opacity={0.2} />
        </mesh>
      </group>

      {/* Ambient drifting atmospheric dust */}
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
