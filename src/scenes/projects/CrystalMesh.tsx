import { MeshTransmissionMaterial } from '@react-three/drei/core/MeshTransmissionMaterial'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { ProjectItem } from '../../data/types'
import { filterAvailableLocalAssets } from '../../lib/assets'

function hashCoord(x: number, y: number, z: number, seed: number): number {
  const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + seed * 19.31) * 43758.5453
  return s - Math.floor(s)
}

/**
 * Generates an irregular faceted crystalline shard geometry from a deformed icosahedron
 * with consistent spatial vertex welding so triangular facets stay crisp and watertight.
 */
const TRANSMISSION_BG = new THREE.Color('#0C0C0C')

function buildCrystalGeometry(seed: number): THREE.BufferGeometry {
  const base = new THREE.IcosahedronGeometry(1.06, 1)
  const pos = base.attributes.position

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)

    const rx = Math.round(x * 100) / 100
    const ry = Math.round(y * 100) / 100
    const rz = Math.round(z * 100) / 100

    const n1 = hashCoord(rx, ry, rz, seed)
    const n2 = hashCoord(rz, rx, ry, seed + 7)

    // Taper silhouette toward vertical ends like chipped quartz/glacial ice shards
    const verticalTaper = 1 - Math.abs(y) * 0.22
    const radialScale = (0.78 + n1 * 0.4) * verticalTaper
    const facetJitter = (n2 - 0.5) * 0.13

    pos.setXYZ(
      i,
      x * radialScale + facetJitter,
      y * (1.32 + n1 * 0.15),
      z * radialScale - facetJitter * 0.65
    )
  }

  const faceted = base.toNonIndexed()
  base.dispose()
  faceted.computeVertexNormals()
  return faceted
}

/**
 * Creates a crisp CanvasTexture containing the project's large typographic mark (number + title)
 * displayed inside the glass crystal when local screenshot files are not yet added.
 */
function createTypographicCoreTexture(project: ProjectItem): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 640
  const ctx = canvas.getContext('2d')!

  // Soft smoky radial vignette so there are no harsh dark square corners inside the crystal
  const grad = ctx.createRadialGradient(256, 310, 40, 256, 320, 320)
  grad.addColorStop(0, 'rgba(14, 18, 26, 0.92)')
  grad.addColorStop(0.7, 'rgba(12, 15, 22, 0.72)')
  grad.addColorStop(1, 'rgba(12, 12, 12, 0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 512, 640)

  // Hairline architectural corner ticks
  ctx.strokeStyle = 'rgba(215, 226, 234, 0.35)'
  ctx.lineWidth = 2
  const m = 40
  const t = 24
  ctx.beginPath()
  ctx.moveTo(m, m + t); ctx.lineTo(m, m); ctx.lineTo(m + t, m)
  ctx.moveTo(512 - m - t, m); ctx.lineTo(512 - m, m); ctx.lineTo(512 - m, m + t)
  ctx.moveTo(m, 640 - m - t); ctx.lineTo(m, 640 - m); ctx.lineTo(m + t, 640 - m)
  ctx.moveTo(512 - m - t, 640 - m); ctx.lineTo(512 - m, 640 - m); ctx.lineTo(512 - m, 640 - m - t)
  ctx.stroke()

  ctx.fillStyle = 'rgba(187, 204, 215, 0.58)'
  ctx.font = '600 18px "JetBrains Mono", monospace'
  ctx.fillText(`PRJ_${project.number}`, 62, 92)

  ctx.fillStyle = '#E8F0F8'
  ctx.font = '900 154px "Kanit", sans-serif'
  ctx.fillText(project.number, 56, 252)

  // Hairline divider
  ctx.fillStyle = 'rgba(215, 226, 234, 0.24)'
  ctx.fillRect(62, 286, 388, 1.5)

  // Word-wrap project title inside core width
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '800 44px "Kanit", sans-serif'
  const words = project.title.toUpperCase().split(' ')
  const lines: string[] = []
  let curr = ''
  for (const w of words) {
    const test = curr ? `${curr} ${w}` : w
    if (ctx.measureText(test).width > 390 && curr) {
      lines.push(curr)
      curr = w
    } else {
      curr = test
    }
  }
  if (curr) lines.push(curr)

  lines.slice(0, 3).forEach((line, idx) => {
    ctx.fillText(line, 62, 352 + idx * 54)
  })

  ctx.fillStyle = 'rgba(187, 204, 215, 0.72)'
  ctx.font = '500 18px "JetBrains Mono", monospace'
  ctx.fillText(project.category.toUpperCase(), 62, 574)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  tex.needsUpdate = true
  return tex
}

export interface CrystalMeshProps {
  project: ProjectItem
  index: number
  positionX: number
  isHovered: boolean
  isActive: boolean
  isInspected: boolean
  prefersReduced: boolean
  weakGpu: boolean
  onHoverChange: (index: number | null) => void
  onSelect: (index: number) => void
  onUpdateHudAnchor: (anchor: { xPct: number; yPct: number } | null) => void
}

export function CrystalMesh({
  project,
  index,
  positionX,
  isHovered,
  isActive,
  isInspected,
  prefersReduced,
  weakGpu,
  onHoverChange,
  onSelect,
  onUpdateHudAnchor,
}: CrystalMeshProps) {
  const groupRef = useRef<THREE.Group>(null)
  const coreRef = useRef<THREE.Mesh>(null)
  const wireRef = useRef<THREE.LineSegments>(null)
  const anchorVec = useMemo(() => new THREE.Vector3(), [])

  const firstLocalShot = useMemo(() => {
    const valid = filterAvailableLocalAssets(project.screenshots)
    return valid[0] ?? null
  }, [project.screenshots])

  const crystalGeo = useMemo(() => buildCrystalGeometry(index * 17 + 3), [index])
  const edgesGeo = useMemo(() => new THREE.EdgesGeometry(crystalGeo, 24), [crystalGeo])
  const fallbackTexture = useMemo(() => createTypographicCoreTexture(project), [project])

  const imageTexture = useMemo(() => {
    if (!firstLocalShot) return null
    const loader = new THREE.TextureLoader()
    const tex = loader.load(firstLocalShot)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [firstLocalShot])

  useEffect(() => {
    return () => {
      crystalGeo.dispose()
      edgesGeo.dispose()
      fallbackTexture.dispose()
      imageTexture?.dispose()
    }
  }, [crystalGeo, edgesGeo, fallbackTexture, imageTexture])

  useFrame((state, delta) => {
    const dt = Math.min(0.05, delta)
    const group = groupRef.current
    if (!group) return

    const t = state.clock.getElapsedTime()

    // Gentle vertical float (lifted so bottom vertex & hover wireframe clear bottom bracketed title)
    if (!prefersReduced) {
      group.position.y = 0.24 + Math.sin(t * 0.9 + index * 1.6) * 0.075
    } else {
      group.position.y = 0.24
    }

    const targetScale = isInspected ? 1.16 : isActive ? 1.0 : 0.88
    const lerpSpeed = prefersReduced ? 1 : 1 - Math.exp(-dt * 6)
    const nextScale = THREE.MathUtils.lerp(group.scale.x, targetScale, lerpSpeed)
    group.scale.setScalar(nextScale)

    // Slow idle rotation + cursor tilt on hover
    if (isHovered && !isInspected && !prefersReduced) {
      const targetRotX = THREE.MathUtils.clamp(-state.pointer.y * 0.24, -0.25, 0.25)
      const targetRotZ = THREE.MathUtils.clamp(-state.pointer.x * 0.16, -0.18, 0.18)
      group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, targetRotX, 1 - Math.exp(-dt * 7))
      group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, targetRotZ, 1 - Math.exp(-dt * 7))
      group.rotation.y += dt * 0.14
    } else if (!prefersReduced) {
      group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, 0, 1 - Math.exp(-dt * 4))
      group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, 0, 1 - Math.exp(-dt * 4))
      group.rotation.y += dt * (isInspected ? 0.08 : 0.22)
    }

    // Counter-rotate inner typographic/screenshot core subtly so it stays readable through facets
    if (coreRef.current) {
      coreRef.current.rotation.y = -group.rotation.y * 0.72
    }

    if (wireRef.current) {
      wireRef.current.scale.setScalar(isHovered && !isInspected ? 1.075 : 1.015)
    }

    // Project outer upper-left crystal ridge into viewport % so hover HUD extends outside silhouette
    if (isHovered && !isInspected) {
      anchorVec.set(positionX - 0.64, group.position.y + 0.74, 0.35)
      anchorVec.project(state.camera)
      const xPct = (anchorVec.x * 0.5 + 0.5) * 100
      const yPct = (-anchorVec.y * 0.5 + 0.5) * 100
      onUpdateHudAnchor({ xPct, yPct })
    }
  })

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    document.body.style.cursor = 'pointer'
    onHoverChange(index)
  }

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    document.body.style.cursor = ''
    onHoverChange(null)
    onUpdateHudAnchor(null)
  }

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onSelect(index)
  }

  const activeTex = imageTexture ?? fallbackTexture

  return (
    <group ref={groupRef} position={[positionX, 0.24, 0]}>
      {/* Inner core: local screenshot if present, otherwise editorial typographic mark */}
      <mesh ref={coreRef} renderOrder={1}>
        <planeGeometry args={[imageTexture ? 1.08 : 0.92, imageTexture ? 0.72 : 1.15]} />
        <meshBasicMaterial
          map={activeTex}
          transparent={!imageTexture}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      {/* Outer faceted refractive glass shell */}
      <mesh
        geometry={crystalGeo}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        renderOrder={2}
      >
        {weakGpu ? (
          <meshPhysicalMaterial
            color="#d4e0ec"
            transparent
            opacity={0.44}
            roughness={0.08}
            metalness={0.14}
            clearcoat={1}
            clearcoatRoughness={0.06}
            ior={1.42}
            reflectivity={0.92}
            flatShading
          />
        ) : (
          <MeshTransmissionMaterial
            samples={4}
            resolution={256}
            thickness={0.62}
            roughness={0.075}
            specularIntensity={0.62}
            envMapIntensity={0.8}
            transmission={0.95}
            ior={1.42}
            chromaticAberration={isInspected ? 0.16 : 0.04}
            anisotropy={0.14}
            distortion={0.04}
            distortionScale={0.18}
            temporalDistortion={0.025}
            background={TRANSMISSION_BG}
            color="#e2ebf5"
            attenuationColor="#9cb2cc"
            attenuationDistance={3.6}
            flatShading
          />
        )}
      </mesh>

      {/* Hairline wireframe callout aura visible on hover (Igloo motif) */}
      <lineSegments ref={wireRef} geometry={edgesGeo}>
        <lineBasicMaterial
          color="#D7E2EA"
          transparent
          opacity={isHovered && !isInspected ? 0.34 : 0.03}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  )
}
