import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { SkillGroup } from '../../data/types'
import {
  PARTICLE_COUNT_DESKTOP,
  PARTICLE_COUNT_WEAK,
  buildStackSculptureDataset,
} from './sculptures'

const VERTEX_SHADER = /* glsl */ `
  attribute vec3 aFromPos;
  attribute vec3 aFromNorm;
  attribute float aFromLuma;
  attribute vec3 aToPos;
  attribute vec3 aToNorm;
  attribute float aToLuma;
  attribute vec3 aSeed;

  uniform float uTime;
  uniform float uMorph;
  uniform float uPixelRatio;
  uniform vec3 uCursorLocal;
  uniform float uCursorStrength;
  uniform float uReducedMotion;

  varying vec3 vNormal;
  varying float vLuma;
  varying float vBurst;
  varying float vHeight;
  varying float vSeed;

  void main() {
    float delay = uReducedMotion > 0.5 ? 0.0 : aSeed.x * 0.42;
    float localT = clamp((uMorph - delay) / max(0.001, 1.0 - delay), 0.0, 1.0);
    float easeT = localT * localT * (3.0 - 2.0 * localT);
    float burst = uReducedMotion > 0.5 ? 0.0 : sin(localT * 3.14159265);

    vec3 basePos = mix(aFromPos, aToPos, easeT);
    vec3 baseNorm = normalize(mix(aFromNorm, aToNorm, easeT) + vec3(0.0001));
    float baseLuma = mix(aFromLuma, aToLuma, easeT);

    // 3D curl-like dissolve turbulence during morph transitions
    vec3 curl = vec3(
      sin(basePos.y * 3.4 + uTime * 2.4 + aSeed.y * 6.2831) * cos(basePos.z * 2.8 + aSeed.z * 5.0),
      cos(basePos.z * 3.1 + uTime * 2.0 + aSeed.z * 6.2831) + 0.35 * sin(aSeed.x * 11.0),
      sin(basePos.x * 3.2 - uTime * 2.2 + aSeed.x * 6.2831) * cos(basePos.y * 2.6 + aSeed.y * 4.5)
    );

    vec3 displaced = basePos + curl * (burst * 1.48);

    // Gentle idle micro-breathing on outer surface motes
    if (uReducedMotion < 0.5) {
      float drift = 0.012 + step(1.12, length(basePos)) * 0.028;
      displaced.x += sin(uTime * 0.9 + aSeed.y * 12.0) * drift;
      displaced.y += cos(uTime * 0.8 + aSeed.z * 10.0) * drift;
    }

    // Cursor radial push + spring-back in sculpture local coordinates
    float hoverPush = 0.0;
    if (uReducedMotion < 0.5 && uCursorStrength > 0.001) {
      vec3 away = displaced - uCursorLocal;
      float dist = length(away);
      float influence = 1.0 - smoothstep(0.0, 0.88, dist);
      hoverPush = influence * uCursorStrength;
      vec3 pushDir = dist > 0.001 ? normalize(away) : vec3(0.0, 1.0, 0.0);
      displaced += pushDir * (hoverPush * 0.42);
    }

    vec4 mvPos = modelViewMatrix * vec4(displaced, 1.0);
    gl_Position = projectionMatrix * mvPos;

    float sizePx = (2.0 + aSeed.z * 1.35 + burst * 2.4 + hoverPush * 1.2)
      * uPixelRatio
      * (5.2 / max(1.4, -mvPos.z));
    gl_PointSize = clamp(sizePx, 1.1, 11.0);

    vNormal = normalize(normalMatrix * baseNorm);
    vLuma = baseLuma;
    vBurst = burst;
    vHeight = displaced.y;
    vSeed = aSeed.z;
  }
`

const FRAGMENT_SHADER = /* glsl */ `
  varying vec3 vNormal;
  varying float vLuma;
  varying float vBurst;
  varying float vHeight;
  varying float vSeed;

  void main() {
    vec2 uv = gl_PointCoord * 2.0 - 1.0;
    float d = dot(uv, uv);
    if (d > 1.0) discard;

    float softEdge = smoothstep(1.0, 0.18, d);

    // Sculpted cool-white key lighting + shadow crevice contrast
    vec3 keyDir = normalize(vec3(0.55, 0.72, 0.65));
    vec3 rimDir = normalize(vec3(-0.7, 0.35, -0.6));
    float diff = clamp(dot(vNormal, keyDir) * 0.5 + 0.5, 0.0, 1.0);
    float rim = pow(clamp(dot(vNormal, rimDir) * 0.5 + 0.5, 0.0, 1.0), 2.2);

    vec3 deepSlate = vec3(0.27, 0.33, 0.41);
    vec3 coolWhite = vec3(0.89, 0.93, 0.97);
    vec3 col = mix(deepSlate, coolWhite, clamp(diff * 0.72 + vLuma * 0.34 + rim * 0.22, 0.0, 1.0));

    // Hint of site CTA violet-magenta accent near lower base facing pedestal glow
    vec3 siteAccent = vec3(0.62, 0.25, 0.88);
    float bottomMask = smoothstep(0.05, -1.05, vHeight);
    col = mix(col, siteAccent, bottomMask * 0.34);

    // Luminous white burst accent during mid-morph swirl
    col = mix(col, vec3(0.96, 0.98, 1.0), vBurst * 0.58);

    float alpha = softEdge * mix(0.82, 0.52, vBurst * 0.65) * (0.78 + vSeed * 0.22);
    gl_FragColor = vec4(col, alpha);
  }
`

export interface ParticleSculptureProps {
  groups: readonly SkillGroup[]
  activeIndex: number
  weakGpu: boolean
  prefersReduced: boolean
  onMorphStateChange?: (morphing: boolean) => void
}

export function ParticleSculpture({
  groups,
  activeIndex,
  weakGpu,
  prefersReduced,
  onMorphStateChange,
}: ParticleSculptureProps) {
  const count = weakGpu ? PARTICLE_COUNT_WEAK : PARTICLE_COUNT_DESKTOP
  const groupRef = useRef<THREE.Group>(null)
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const morphRef = useRef(1)
  const morphStartTimeRef = useRef(0)
  const currentIdxRef = useRef(0)
  const cursorTargetRef = useRef(new THREE.Vector3())
  const cursorLocalRef = useRef(new THREE.Vector3())
  const cursorActiveRef = useRef(false)
  const cursorStrengthRef = useRef(0)
  const hitWorldVec = useMemo(() => new THREE.Vector3(), [])
  const wasMorphingRef = useRef(false)

  const datasets = useMemo(() => buildStackSculptureDataset(count, groups), [count, groups])

  const { geometry, uniforms } = useMemo(() => {
    const initial = datasets[0]
    const seeds = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      // Deterministic scatter seeds for per-particle morph delay & swirl phase
      const h1 = (((i * 2654435761) >>> 0) % 10000) / 10000
      const h2 = (((i * 2246822519) >>> 0) % 10000) / 10000
      const h3 = (((i * 3266489917) >>> 0) % 10000) / 10000
      seeds[i * 3] = h1
      seeds[i * 3 + 1] = h2
      seeds[i * 3 + 2] = h3
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(initial.positions), 3))
    geo.setAttribute('aFromPos', new THREE.BufferAttribute(new Float32Array(initial.positions), 3))
    geo.setAttribute('aFromNorm', new THREE.BufferAttribute(new Float32Array(initial.normals), 3))
    geo.setAttribute('aFromLuma', new THREE.BufferAttribute(new Float32Array(initial.lumas), 1))
    geo.setAttribute('aToPos', new THREE.BufferAttribute(new Float32Array(initial.positions), 3))
    geo.setAttribute('aToNorm', new THREE.BufferAttribute(new Float32Array(initial.normals), 3))
    geo.setAttribute('aToLuma', new THREE.BufferAttribute(new Float32Array(initial.lumas), 1))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3))
    geo.computeBoundingSphere()

    const pxRatio = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.5)

    return {
      geometry: geo,
      uniforms: {
        uTime: { value: 0 },
        uMorph: { value: 1 },
        uPixelRatio: { value: pxRatio },
        uCursorLocal: { value: new THREE.Vector3() },
        uCursorStrength: { value: 0 },
        uReducedMotion: { value: prefersReduced ? 1 : 0 },
      },
    }
  }, [count, datasets, prefersReduced])

  useEffect(() => {
    const mat = matRef.current
    return () => {
      geometry.dispose()
      mat?.dispose()
    }
  }, [geometry])

  // Trigger smooth staggered curl morph when activeIndex changes
  useEffect(() => {
    if (activeIndex === currentIdxRef.current) return
    const nextDataset = datasets[activeIndex]
    if (!nextDataset) return

    const fromPos = geometry.getAttribute('aFromPos') as THREE.BufferAttribute
    const fromNorm = geometry.getAttribute('aFromNorm') as THREE.BufferAttribute
    const fromLuma = geometry.getAttribute('aFromLuma') as THREE.BufferAttribute
    const toPos = geometry.getAttribute('aToPos') as THREE.BufferAttribute
    const toNorm = geometry.getAttribute('aToNorm') as THREE.BufferAttribute
    const toLuma = geometry.getAttribute('aToLuma') as THREE.BufferAttribute
    const seedAttr = geometry.getAttribute('aSeed') as THREE.BufferAttribute

    const fromArr = fromPos.array as Float32Array
    const fromNormArr = fromNorm.array as Float32Array
    const fromLumaArr = fromLuma.array as Float32Array
    const toArr = toPos.array as Float32Array
    const toNormArr = toNorm.array as Float32Array
    const toLumaArr = toLuma.array as Float32Array
    const seedArr = seedAttr.array as Float32Array

    const currentMorph = morphRef.current

    // Capture each particle's instantaneous interpolated coordinates so chained switches never pop
    if (currentMorph >= 1 || prefersReduced) {
      fromArr.set(toArr)
      fromNormArr.set(toNormArr)
      fromLumaArr.set(toLumaArr)
    } else {
      for (let i = 0; i < count; i++) {
        const delay = seedArr[i * 3] * 0.42
        const localT = THREE.MathUtils.clamp((currentMorph - delay) / Math.max(0.001, 1 - delay), 0, 1)
        const easeT = localT * localT * (3 - 2 * localT)
        const i3 = i * 3
        fromArr[i3] = fromArr[i3] + (toArr[i3] - fromArr[i3]) * easeT
        fromArr[i3 + 1] = fromArr[i3 + 1] + (toArr[i3 + 1] - fromArr[i3 + 1]) * easeT
        fromArr[i3 + 2] = fromArr[i3 + 2] + (toArr[i3 + 2] - fromArr[i3 + 2]) * easeT

        fromNormArr[i3] = fromNormArr[i3] + (toNormArr[i3] - fromNormArr[i3]) * easeT
        fromNormArr[i3 + 1] = fromNormArr[i3 + 1] + (toNormArr[i3 + 1] - fromNormArr[i3 + 1]) * easeT
        fromNormArr[i3 + 2] = fromNormArr[i3 + 2] + (toNormArr[i3 + 2] - fromNormArr[i3 + 2]) * easeT
        fromLumaArr[i] = fromLumaArr[i] + (toLumaArr[i] - fromLumaArr[i]) * easeT
      }
    }

    toArr.set(nextDataset.positions)
    toNormArr.set(nextDataset.normals)
    toLumaArr.set(nextDataset.lumas)

    fromPos.needsUpdate = true
    fromNorm.needsUpdate = true
    fromLuma.needsUpdate = true
    toPos.needsUpdate = true
    toNorm.needsUpdate = true
    toLuma.needsUpdate = true

    currentIdxRef.current = activeIndex
    morphRef.current = prefersReduced ? 1 : 0
    morphStartTimeRef.current = performance.now()
    if (matRef.current) {
      matRef.current.uniforms.uMorph.value = morphRef.current
    }
  }, [activeIndex, count, datasets, geometry, prefersReduced])

  useFrame((state, delta) => {
    const dt = Math.min(0.2, delta)
    const mat = matRef.current
    const group = groupRef.current
    if (!mat || !group) return

    mat.uniforms.uTime.value = state.clock.getElapsedTime()
    mat.uniforms.uReducedMotion.value = prefersReduced ? 1 : 0

    // Slow idle pedestal turntable rotation
    if (!prefersReduced) {
      group.rotation.y += dt * 0.22
    }

    // Advance staggered curl morph using wall-clock duration so software GPUs settle cleanly
    if (morphRef.current < 1) {
      const elapsed = performance.now() - morphStartTimeRef.current
      morphRef.current = prefersReduced ? 1 : Math.min(1, elapsed / 1280)
    }
    mat.uniforms.uMorph.value = morphRef.current

    const isMorphing = morphRef.current < 0.99
    if (isMorphing !== wasMorphingRef.current) {
      wasMorphingRef.current = isMorphing
      onMorphStateChange?.(isMorphing)
    }

    // Ease cursor push & spring back
    const targetStrength = cursorActiveRef.current && !prefersReduced ? 1 : 0
    cursorStrengthRef.current = THREE.MathUtils.lerp(
      cursorStrengthRef.current,
      targetStrength,
      1 - Math.exp(-dt * (cursorActiveRef.current ? 10 : 6))
    )
    cursorLocalRef.current.lerp(cursorTargetRef.current, 1 - Math.exp(-dt * 12))
    mat.uniforms.uCursorStrength.value = cursorStrengthRef.current
    mat.uniforms.uCursorLocal.value.copy(cursorLocalRef.current)
  })

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    const group = groupRef.current
    if (!group || prefersReduced) return
    hitWorldVec.copy(e.point)
    group.worldToLocal(hitWorldVec)
    cursorTargetRef.current.copy(hitWorldVec)
    cursorActiveRef.current = true
  }

  const handlePointerOut = () => {
    cursorActiveRef.current = false
  }

  return (
    <group ref={groupRef} position={[0, 0.24, 0]}>
      {/* Invisible pointer capture volume for smooth particle repulsion */}
      <mesh onPointerMove={handlePointerMove} onPointerOut={handlePointerOut}>
        <sphereGeometry args={[1.6, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <points geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          ref={matRef}
          vertexShader={VERTEX_SHADER}
          fragmentShader={FRAGMENT_SHADER}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </points>
    </group>
  )
}
