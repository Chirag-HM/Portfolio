import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { TERRAIN_DEPTH, TERRAIN_WIDTH, sampleTerrainHeight } from './terrain'

export interface MoonlitTerrainProps {
  weakGpu: boolean
}

export function MoonlitTerrain({ weakGpu }: MoonlitTerrainProps) {
  const terrainGeo = useMemo(() => {
    const segX = weakGpu ? 52 : 96
    const segZ = weakGpu ? 44 : 82
    const indexed = new THREE.PlaneGeometry(TERRAIN_WIDTH, TERRAIN_DEPTH, segX, segZ)
    indexed.rotateX(-Math.PI / 2)
    // Shift Z center slightly backward toward mountain massif
    indexed.translate(0, 0, -11)

    const pos = indexed.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      pos.setY(i, sampleTerrainHeight(x, z))
    }

    const nonIndexed = indexed.toNonIndexed()
    indexed.dispose()
    nonIndexed.computeVertexNormals()

    const nPos = nonIndexed.attributes.position
    const nNorm = nonIndexed.attributes.normal
    const colors = new Float32Array(nPos.count * 3)

    const valleyDark = new THREE.Color('#0c0f15')
    const slateRock = new THREE.Color('#273242')
    const frostSnow = new THREE.Color('#cddaea')
    const tmp = new THREE.Color()

    for (let i = 0; i < nPos.count; i++) {
      const y = nPos.getY(i)
      const ny = nNorm.getY(i)

      // Elevation frost factor + upward facet slope snow accumulation
      const alt = THREE.MathUtils.clamp((y + 0.4) / 7.8, 0, 1)
      const slopeSnow = THREE.MathUtils.smoothstep(ny, 0.56, 0.92)

      tmp.copy(valleyDark).lerp(slateRock, THREE.MathUtils.clamp(alt * 1.15 + 0.14, 0, 1))
      const snowAmount = THREE.MathUtils.clamp(alt * 0.78 + slopeSnow * 0.48 - 0.18, 0, 0.92)
      tmp.lerp(frostSnow, snowAmount)

      colors[i * 3] = tmp.r
      colors[i * 3 + 1] = tmp.g
      colors[i * 3 + 2] = tmp.b
    }

    nonIndexed.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return nonIndexed
  }, [weakGpu])

  useEffect(() => {
    return () => {
      terrainGeo.dispose()
    }
  }, [terrainGeo])

  return (
    <mesh geometry={terrainGeo} receiveShadow>
      <meshStandardMaterial
        vertexColors
        flatShading
        roughness={0.88}
        metalness={0.04}
      />
    </mesh>
  )
}
