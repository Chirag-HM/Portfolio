import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

const STAR_COUNT = 160
const SNOW_COUNT = 280

const MOON_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const MOON_FRAGMENT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    if (d > 1.0) discard;
    float disc = smoothstep(0.28, 0.22, d);
    float halo = exp(-d * d * 4.2) * 0.42;
    vec3 col = vec3(0.84, 0.90, 0.97);
    gl_FragColor = vec4(col, clamp(disc * 0.75 + halo, 0.0, 0.85));
  }
`

const SNOW_VERTEX = /* glsl */ `
  attribute vec3 aSeed;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    // Continuous downward wrap fall + gentle wind sway
    float fall = mod(uTime * (0.42 + aSeed.x * 0.35) + aSeed.y * 16.0, 14.0);
    p.y = 11.5 - fall;
    p.x += sin(uTime * 0.45 + aSeed.z * 12.0) * 0.55;
    p.z += cos(uTime * 0.35 + aSeed.x * 9.0) * 0.45;

    vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPos;
    gl_PointSize = clamp((1.6 + aSeed.z * 2.0) * uPixelRatio * (7.5 / max(1.2, -mvPos.z)), 1.0, 6.0);
    float groundFade = smoothstep(-0.5, 1.8, p.y);
    vAlpha = (0.28 + aSeed.x * 0.34) * groundFade;
  }
`

const SNOW_FRAGMENT = /* glsl */ `
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float soft = pow(1.0 - d, 1.7);
    gl_FragColor = vec4(0.86, 0.91, 0.97, soft * vAlpha);
  }
`

export interface MountainAtmosphereProps {
  weakGpu: boolean
  prefersReduced: boolean
}

export function MountainAtmosphere({ weakGpu, prefersReduced }: MountainAtmosphereProps) {
  const starMeshRef = useRef<THREE.InstancedMesh>(null)
  const snowMatRef = useRef<THREE.ShaderMaterial>(null)
  const moonMatRef = useRef<THREE.ShaderMaterial>(null)

  const starGeo = useMemo(() => new THREE.OctahedronGeometry(0.065, 0), [])

  const starTransforms = useMemo(() => {
    const arr: Array<{ x: number; y: number; z: number; scale: number }> = []
    for (let i = 0; i < STAR_COUNT; i++) {
      const h1 = (((i * 73856093) >>> 0) % 1000) / 1000
      const h2 = (((i * 19349663) >>> 0) % 1000) / 1000
      const h3 = (((i * 83492791) >>> 0) % 1000) / 1000
      arr.push({
        x: (h1 - 0.5) * 64,
        y: 8.5 + h2 * 16.5,
        z: -14 - h3 * 28,
        scale: 0.45 + h1 * 1.05,
      })
    }
    return arr
  }, [])

  const { snowGeo, snowUniforms } = useMemo(() => {
    const positions = new Float32Array(SNOW_COUNT * 3)
    const seeds = new Float32Array(SNOW_COUNT * 3)

    for (let i = 0; i < SNOW_COUNT; i++) {
      const h1 = (((i * 2654435761) >>> 0) % 10000) / 10000
      const h2 = (((i * 2246822519) >>> 0) % 10000) / 10000
      const h3 = (((i * 3266489917) >>> 0) % 10000) / 10000
      positions[i * 3] = (h1 - 0.5) * 26
      positions[i * 3 + 1] = 2.0 + h2 * 10
      positions[i * 3 + 2] = -14 + h3 * 24
      seeds[i * 3] = h1
      seeds[i * 3 + 1] = h2
      seeds[i * 3 + 2] = h3
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3))

    const pxRatio = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.5)
    return {
      snowGeo: geo,
      snowUniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: pxRatio },
      },
    }
  }, [])

  useEffect(() => {
    const mesh = starMeshRef.current
    if (!mesh) return
    const dummy = new THREE.Object3D()
    starTransforms.forEach((st, i) => {
      dummy.position.set(st.x, st.y, st.z)
      dummy.scale.setScalar(st.scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [starTransforms])

  useEffect(() => {
    const sMat = snowMatRef.current
    const mMat = moonMatRef.current
    return () => {
      starGeo.dispose()
      snowGeo.dispose()
      sMat?.dispose()
      mMat?.dispose()
    }
  }, [starGeo, snowGeo])

  useFrame((state) => {
    if (prefersReduced) return
    if (snowMatRef.current) {
      snowMatRef.current.uniforms.uTime.value = state.clock.getElapsedTime()
    }
  })

  return (
    <>
      <fogExp2 attach="fog" args={['#0C0C0C', 0.042]} />

      {/* Cool moonlight key + subtle night sky fill */}
      <ambientLight intensity={0.32} color="#7c96b8" />
      <directionalLight position={[-16, 20, -18]} intensity={1.85} color="#dbe9ff" />
      <directionalLight position={[14, 9, 10]} intensity={0.45} color="#6d86aa" />

      {/* Soft distant moon halo high above peak silhouettes */}
      <mesh position={[-12, 11.2, -34]}>
        <planeGeometry args={[10, 10]} />
        <shaderMaterial
          ref={moonMatRef}
          vertexShader={MOON_VERTEX}
          fragmentShader={MOON_FRAGMENT}
          transparent
          depthWrite={false}
          fog={false}
        />
      </mesh>

      {/* Sparse instanced star field above fog */}
      <instancedMesh ref={starMeshRef} args={[starGeo, undefined, STAR_COUNT]} frustumCulled={false}>
        <meshBasicMaterial color="#d7e2ea" fog={false} />
      </instancedMesh>

      {/* Slow drifting snow particles (omitted on weak GPUs or reduced motion) */}
      {!weakGpu && !prefersReduced && (
        <points geometry={snowGeo} frustumCulled={false}>
          <shaderMaterial
            ref={snowMatRef}
            vertexShader={SNOW_VERTEX}
            fragmentShader={SNOW_FRAGMENT}
            uniforms={snowUniforms}
            transparent
            depthWrite={false}
          />
        </points>
      )}
    </>
  )
}
