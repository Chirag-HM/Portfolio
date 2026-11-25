import type { SkillGroup } from '../../data/types'

export const PARTICLE_COUNT_DESKTOP = 25000
export const PARTICLE_COUNT_WEAK = 10000

export interface SculptureDataset {
  positions: Float32Array
  normals: Float32Array
  lumas: Float32Array
}

function createPrng(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface MutableBuffer {
  positions: Float32Array
  normals: Float32Array
  lumas: Float32Array
  cursor: number
  capacity: number
}

function pushPoint(
  buf: MutableBuffer,
  x: number,
  y: number,
  z: number,
  nx: number,
  ny: number,
  nz: number,
  luma = 0.72
) {
  if (buf.cursor >= buf.capacity) return
  const i = buf.cursor
  const i3 = i * 3
  const nLen = Math.hypot(nx, ny, nz) || 1
  buf.positions[i3] = x
  buf.positions[i3 + 1] = y
  buf.positions[i3 + 2] = z
  buf.normals[i3] = nx / nLen
  buf.normals[i3 + 1] = ny / nLen
  buf.normals[i3 + 2] = nz / nLen
  buf.lumas[i] = luma
  buf.cursor += 1
}

function rotatePoint(
  x: number,
  y: number,
  z: number,
  rx: number,
  ry: number
): [number, number, number] {
  const cy = Math.cos(ry)
  const sy = Math.sin(ry)
  const x1 = x * cy + z * sy
  const z1 = -x * sy + z * cy

  const cx = Math.cos(rx)
  const sx = Math.sin(rx)
  const y2 = y * cx - z1 * sx
  const z2 = y * sx + z1 * cx
  return [x1, y2, z2]
}

function fillSegment(
  buf: MutableBuffer,
  n: number,
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number,
  radius: number,
  luma: number,
  rand: () => number
) {
  const dx = bx - ax
  const dy = by - ay
  const dz = bz - az
  const len = Math.hypot(dx, dy, dz) || 1
  const tx = dx / len
  const ty = dy / len
  const tz = dz / len

  const upX = Math.abs(ty) > 0.9 ? 1 : 0
  const upY = Math.abs(ty) > 0.9 ? 0 : 1
  let px = -tz * upY
  let py = tz * upX
  let pz = tx * upY - ty * upX
  const plen = Math.hypot(px, py, pz) || 1
  px /= plen
  py /= plen
  pz /= plen
  const qx = ty * pz - tz * py
  const qy = tz * px - tx * pz
  const qz = tx * py - ty * px

  for (let i = 0; i < n; i++) {
    const t = rand()
    const ang = rand() * Math.PI * 2
    const r = radius * Math.sqrt(rand())
    const nx = px * Math.cos(ang) + qx * Math.sin(ang)
    const ny = py * Math.cos(ang) + qy * Math.sin(ang)
    const nz = pz * Math.cos(ang) + qz * Math.sin(ang)
    pushPoint(
      buf,
      ax + dx * t + nx * r,
      ay + dy * t + ny * r,
      az + dz * t + nz * r,
      nx,
      ny,
      nz,
      luma
    )
  }
}

function fillBoxSurface(
  buf: MutableBuffer,
  n: number,
  cx: number,
  cy: number,
  cz: number,
  w: number,
  h: number,
  d: number,
  luma: number,
  rx: number,
  ry: number,
  rand: () => number
) {
  const hw = w * 0.5
  const hh = h * 0.5
  const hd = d * 0.5

  for (let i = 0; i < n; i++) {
    const face = Math.floor(rand() * 6)
    const u = (rand() - 0.5) * 2
    const v = (rand() - 0.5) * 2
    let lx = 0
    let ly = 0
    let lz = 0
    let nx = 0
    let ny = 0
    let nz = 0

    if (face === 0) {
      lx = hw; ly = u * hh; lz = v * hd; nx = 1
    } else if (face === 1) {
      lx = -hw; ly = u * hh; lz = v * hd; nx = -1
    } else if (face === 2) {
      lx = u * hw; ly = hh; lz = v * hd; ny = 1
    } else if (face === 3) {
      lx = u * hw; ly = -hh; lz = v * hd; ny = -1
    } else if (face === 4) {
      lx = u * hw; ly = v * hh; lz = hd; nz = 1
    } else {
      lx = u * hw; ly = v * hh; lz = -hd; nz = -1
    }

    const [px, py, pz] = rotatePoint(cx + lx, cy + ly, cz + lz, rx, ry)
    const [rnx, rny, rnz] = rotatePoint(nx, ny, nz, rx, ry)
    pushPoint(buf, px, py, pz, rnx, rny, rnz, luma)
  }
}

function fillSphereCluster(
  buf: MutableBuffer,
  n: number,
  cx: number,
  cy: number,
  cz: number,
  r: number,
  luma: number,
  rand: () => number
) {
  for (let i = 0; i < n; i++) {
    const u = rand() * 2 - 1
    const phi = rand() * Math.PI * 2
    const sinTheta = Math.sqrt(Math.max(0, 1 - u * u))
    const nx = sinTheta * Math.cos(phi)
    const ny = u
    const nz = sinTheta * Math.sin(phi)
    const rad = r * (0.72 + 0.28 * Math.cbrt(rand()))
    pushPoint(buf, cx + nx * rad, cy + ny * rad, cz + nz * rad, nx, ny, nz, luma)
  }
}

function fillHaloDust(buf: MutableBuffer, count: number, rand: () => number) {
  const remaining = count - buf.cursor
  for (let i = 0; i < remaining; i++) {
    const u = rand() * 2 - 1
    const phi = rand() * Math.PI * 2
    const s = Math.sqrt(Math.max(0, 1 - u * u))
    const rad = 1.15 + rand() * 0.45
    const x = s * Math.cos(phi) * rad
    const y = u * rad * 0.85
    const z = s * Math.sin(phi) * rad
    pushPoint(buf, x, y, z, x, y, z, 0.45 + rand() * 0.25)
  }
}

/**
 * 1) Frontend: layered browser-window planes interlocked inside a 3x3 cube lattice.
 */
function buildFrontendSculpture(count: number, seed: number): SculptureDataset {
  const rand = createPrng(seed)
  const buf: MutableBuffer = {
    positions: new Float32Array(count * 3),
    normals: new Float32Array(count * 3),
    lumas: new Float32Array(count),
    cursor: 0,
    capacity: count,
  }

  const rx = 0.16
  const ry = -0.34
  const mainBudget = Math.floor(count * 0.94)

  // Three staggered browser/UI planes (back -> mid -> front)
  const layers = [
    { cx: -0.22, cy: 0.18, cz: -0.38, w: 1.48, h: 1.02, share: 0.22 },
    { cx: 0.0, cy: 0.0, cz: 0.02, w: 1.56, h: 1.06, share: 0.26 },
    { cx: 0.22, cy: -0.16, cz: 0.42, w: 1.38, h: 0.94, share: 0.24 },
  ]

  for (const layer of layers) {
    const layerPts = Math.floor(mainBudget * layer.share)
    const rimPts = Math.floor(layerPts * 0.36)
    const headerPts = Math.floor(layerPts * 0.2)
    const gridPts = layerPts - rimPts - headerPts

    // Outer browser slab bevel
    fillBoxSurface(buf, rimPts, layer.cx, layer.cy, layer.cz, layer.w, layer.h, 0.045, 0.72, rx, ry, rand)

    // Top chrome bar + window dots
    fillBoxSurface(
      buf,
      headerPts,
      layer.cx,
      layer.cy + layer.h * 0.38,
      layer.cz + 0.015,
      layer.w * 0.92,
      0.11,
      0.04,
      0.95,
      rx,
      ry,
      rand
    )

    // Two internal UI content blocks
    const leftW = layer.w * 0.48
    const rightW = layer.w * 0.32
    fillBoxSurface(
      buf,
      Math.floor(gridPts * 0.6),
      layer.cx - layer.w * 0.16,
      layer.cy - layer.h * 0.1,
      layer.cz + 0.02,
      leftW,
      layer.h * 0.48,
      0.035,
      0.64,
      rx,
      ry,
      rand
    )
    fillBoxSurface(
      buf,
      Math.ceil(gridPts * 0.4),
      layer.cx + layer.w * 0.26,
      layer.cy - layer.h * 0.1,
      layer.cz + 0.02,
      rightW,
      layer.h * 0.48,
      0.035,
      0.86,
      rx,
      ry,
      rand
    )
  }

  // Enveloping wireframe cube lattice edges + intersection nodes
  const latticeR = 0.96
  const ptsPerEdge = Math.floor((mainBudget * 0.22) / 12)
  const edges: Array<[number, number, number, number, number, number]> = [
    [-1, -1, -1, 1, -1, -1], [-1, 1, -1, 1, 1, -1], [-1, -1, 1, 1, -1, 1], [-1, 1, 1, 1, 1, 1],
    [-1, -1, -1, -1, 1, -1], [1, -1, -1, 1, 1, -1], [-1, -1, 1, -1, 1, 1], [1, -1, 1, 1, 1, 1],
    [-1, -1, -1, -1, -1, 1], [1, -1, -1, 1, -1, 1], [-1, 1, -1, -1, 1, 1], [1, 1, -1, 1, 1, 1],
  ]

  for (const [ax, ay, az, bx, by, bz] of edges) {
    const [rax, ray, raz] = rotatePoint(ax * latticeR, ay * latticeR, az * latticeR, rx, ry)
    const [rbx, rby, rbz] = rotatePoint(bx * latticeR, by * latticeR, bz * latticeR, rx, ry)
    fillSegment(buf, ptsPerEdge, rax, ray, raz, rbx, rby, rbz, 0.022, 0.92, rand)
  }

  fillHaloDust(buf, count, rand)
  return { positions: buf.positions, normals: buf.normals, lumas: buf.lumas }
}

/**
 * 2) Backend: three stacked cylindrical server-rack modules with vertical rib fins and bus conduits.
 */
function buildBackendSculpture(count: number, seed: number): SculptureDataset {
  const rand = createPrng(seed)
  const buf: MutableBuffer = {
    positions: new Float32Array(count * 3),
    normals: new Float32Array(count * 3),
    lumas: new Float32Array(count),
    cursor: 0,
    capacity: count,
  }

  const rx = 0.24
  const ry = 0.15
  const tiers = [
    { y: -0.66, r: 1.04, h: 0.36, share: 0.31 },
    { y: 0.0, r: 0.88, h: 0.36, share: 0.28 },
    { y: 0.66, r: 0.72, h: 0.34, share: 0.25 },
  ]
  const usable = Math.floor(count * 0.94)

  for (const tier of tiers) {
    const n = Math.floor(usable * tier.share)
    const wallN = Math.floor(n * 0.54)
    const capN = Math.floor(n * 0.26)
    const ringN = n - wallN - capN

    // Outer ribbed server cylinder barrel
    for (let i = 0; i < wallN; i++) {
      const theta = rand() * Math.PI * 2
      const rib = 1 + 0.032 * Math.cos(theta * 24)
      const rr = tier.r * rib
      const ly = (rand() - 0.5) * tier.h
      const lx = Math.cos(theta) * rr
      const lz = Math.sin(theta) * rr
      const [px, py, pz] = rotatePoint(lx, tier.y + ly, lz, rx, ry)
      const [nx, ny, nz] = rotatePoint(Math.cos(theta), 0, Math.sin(theta), rx, ry)
      pushPoint(buf, px, py, pz, nx, ny, nz, 0.68)
    }

    // Top and bottom flat disc plates
    for (let i = 0; i < capN; i++) {
      const theta = rand() * Math.PI * 2
      const rad = tier.r * Math.sqrt(rand())
      const topSide = i % 2 === 0 ? 1 : -1
      const lx = Math.cos(theta) * rad
      const lz = Math.sin(theta) * rad
      const [px, py, pz] = rotatePoint(lx, tier.y + topSide * tier.h * 0.5, lz, rx, ry)
      const [nx, ny, nz] = rotatePoint(0, topSide, 0, rx, ry)
      pushPoint(buf, px, py, pz, nx, ny, nz, 0.76)
    }

    // Bright equatorial LED status ring around cylinder
    for (let i = 0; i < ringN; i++) {
      const theta = rand() * Math.PI * 2
      const rr = tier.r * 1.035
      const [px, py, pz] = rotatePoint(
        Math.cos(theta) * rr,
        tier.y + (rand() - 0.5) * 0.04,
        Math.sin(theta) * rr,
        rx,
        ry
      )
      const [nx, ny, nz] = rotatePoint(Math.cos(theta), 0, Math.sin(theta), rx, ry)
      pushPoint(buf, px, py, pz, nx, ny, nz, 1.0)
    }
  }

  // 4 vertical rack pillars + inner vertical spinal data conduit
  const railPts = Math.floor(usable * 0.09)
  const perPillar = Math.floor(railPts / 4)
  for (let p = 0; p < 4; p++) {
    const a = (p / 4) * Math.PI * 2 + Math.PI / 4
    const rx0 = Math.cos(a) * 0.64
    const rz0 = Math.sin(a) * 0.64
    const [ax, ay, az] = rotatePoint(rx0, -0.84, rz0, rx, ry)
    const [bx, by, bz] = rotatePoint(rx0 * 0.72, 0.84, rz0 * 0.72, rx, ry)
    fillSegment(buf, perPillar, ax, ay, az, bx, by, bz, 0.032, 0.94, rand)
  }

  // Central inner core column
  const corePts = Math.floor(usable * 0.06)
  const [cax, cay, caz] = rotatePoint(0, -0.85, 0, rx, ry)
  const [cbx, cby, cbz] = rotatePoint(0, 0.85, 0, rx, ry)
  fillSegment(buf, corePts, cax, cay, caz, cbx, cby, cbz, 0.14, 0.88, rand)

  fillHaloDust(buf, count, rand)
  return { positions: buf.positions, normals: buf.normals, lumas: buf.lumas }
}

/**
 * 3) AI & APIs: Fibonacci sphere of cluster nodes interconnected by curved synaptic arcs.
 */
function buildAiNeuralSculpture(count: number, seed: number): SculptureDataset {
  const rand = createPrng(seed)
  const buf: MutableBuffer = {
    positions: new Float32Array(count * 3),
    normals: new Float32Array(count * 3),
    lumas: new Float32Array(count),
    cursor: 0,
    capacity: count,
  }

  const usable = Math.floor(count * 0.94)
  const outerNodes: Array<[number, number, number]> = []
  const nodeCount = 24
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))

  for (let i = 0; i < nodeCount; i++) {
    const y = 1 - (i / (nodeCount - 1)) * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = goldenAngle * i
    const rad = 1.04
    outerNodes.push([Math.cos(theta) * r * rad, y * rad, Math.sin(theta) * r * rad])
  }

  // Central dense intelligence core
  fillSphereCluster(buf, Math.floor(usable * 0.18), 0, 0, 0, 0.34, 0.95, rand)

  // Outer dense node spheres
  const perNodePts = Math.floor((usable * 0.28) / nodeCount)
  for (const [nx, ny, nz] of outerNodes) {
    fillSphereCluster(buf, perNodePts, nx, ny, nz, 0.115, 0.96, rand)
  }

  // Curved geodesic & core-to-outer synaptic arcs
  const arcLinks: Array<[number, number, boolean]> = []
  for (let i = 0; i < nodeCount; i++) {
    const [ax, ay, az] = outerNodes[i]
    // Connect each outer node to 2 nearest outer neighbors + center core
    const dists: Array<{ j: number; d: number }> = []
    for (let j = i + 1; j < nodeCount; j++) {
      const [bx, by, bz] = outerNodes[j]
      const d = Math.hypot(ax - bx, ay - by, az - bz)
      dists.push({ j, d })
    }
    dists.sort((a, b) => a.d - b.d)
    for (let k = 0; k < Math.min(2, dists.length); k++) {
      arcLinks.push([i, dists[k].j, false])
    }
    if (i % 2 === 0) {
      arcLinks.push([i, -1, true])
    }
  }

  const remainingForArcs = usable - (buf.cursor)
  const ptsPerArc = Math.max(40, Math.floor(remainingForArcs / arcLinks.length))

  for (const [idxA, idxB, toCore] of arcLinks) {
    const [ax, ay, az] = outerNodes[idxA]
    const [bx, by, bz] = toCore ? [0, 0, 0] : outerNodes[idxB]

    for (let k = 0; k < ptsPerArc; k++) {
      const t = rand()
      let lx = ax * (1 - t) + bx * t
      let ly = ay * (1 - t) + by * t
      let lz = az * (1 - t) + bz * t

      // Bow arcs outward onto spherical shell or gentle S-curve to core
      if (!toCore) {
        const len = Math.hypot(lx, ly, lz) || 1
        const bow = 1.04 + Math.sin(t * Math.PI) * 0.14
        lx = (lx / len) * bow
        ly = (ly / len) * bow
        lz = (lz / len) * bow
      } else {
        const wave = Math.sin(t * Math.PI) * 0.16
        lx += wave * (az >= 0 ? 1 : -1)
        lz += wave * (ax >= 0 ? -1 : 1)
      }

      const jx = (rand() - 0.5) * 0.025
      const jy = (rand() - 0.5) * 0.025
      const jz = (rand() - 0.5) * 0.025
      pushPoint(buf, lx + jx, ly + jy, lz + jz, lx, ly, lz, 0.72)
    }
  }

  fillHaloDust(buf, count, rand)
  return { positions: buf.positions, normals: buf.normals, lumas: buf.lumas }
}

/**
 * 4) IoT: tilted silicon microchip package with perimeter gull-wing pins and radiating signal arcs.
 */
function buildIotChipSculpture(count: number, seed: number): SculptureDataset {
  const rand = createPrng(seed)
  const buf: MutableBuffer = {
    positions: new Float32Array(count * 3),
    normals: new Float32Array(count * 3),
    lumas: new Float32Array(count),
    cursor: 0,
    capacity: count,
  }

  const rx = 0.72
  const ry = -0.35
  const usable = Math.floor(count * 0.94)

  // Molded dark substrate housing + raised inner silicon die
  fillBoxSurface(buf, Math.floor(usable * 0.34), 0, -0.14, 0, 1.18, 0.18, 1.18, 0.65, rx, ry, rand)
  fillBoxSurface(buf, Math.floor(usable * 0.18), 0, -0.01, 0, 0.58, 0.11, 0.58, 0.92, rx, ry, rand)

  // Raised corner pad frame around silicon die
  fillBoxSurface(buf, Math.floor(usable * 0.08), 0, 0.055, 0, 0.44, 0.03, 0.44, 1.0, rx, ry, rand)

  // 24 gull-wing IC pins (6 along each of the 4 sides)
  const pinsPerSide = 6
  const totalPins = pinsPerSide * 4
  const pinPts = Math.floor((usable * 0.22) / totalPins)
  const span = 0.88

  for (let side = 0; side < 4; side++) {
    for (let k = 0; k < pinsPerSide; k++) {
      const offset = ((k / (pinsPerSide - 1)) - 0.5) * span
      const base = 0.58
      const outer = 0.90
      let ax = 0; let az = 0; let bx = 0; let bz = 0
      if (side === 0) {
        ax = base; az = offset; bx = outer; bz = offset
      } else if (side === 1) {
        ax = -base; az = offset; bx = -outer; bz = offset
      } else if (side === 2) {
        ax = offset; az = base; bx = offset; bz = outer
      } else {
        ax = offset; az = -base; bx = offset; bz = -outer
      }

      const horizN = Math.floor(pinPts * 0.62)
      const dropN = pinPts - horizN
      const [hax, hay, haz] = rotatePoint(ax, -0.15, az, rx, ry)
      const [hbx, hby, hbz] = rotatePoint(bx, -0.15, bz, rx, ry)
      fillSegment(buf, horizN, hax, hay, haz, hbx, hby, hbz, 0.022, 0.94, rand)

      const [dbx, dby, dbz] = rotatePoint(bx * 1.03, -0.32, bz * 1.03, rx, ry)
      fillSegment(buf, dropN, hbx, hby, hbz, dbx, dby, dbz, 0.022, 0.94, rand)
    }
  }

  // Three concentric 3D spherical-cap radiating signal rings rising above silicon die
  const signalPts = usable - buf.cursor
  const arcRadii = [0.44, 0.74, 1.04]
  const ptsPerWave = Math.floor(signalPts / arcRadii.length)

  for (let w = 0; w < arcRadii.length; w++) {
    const r = arcRadii[w]
    const yBase = 0.24 + w * 0.24
    for (let i = 0; i < ptsPerWave; i++) {
      const azimuth = rand() * Math.PI * 2
      const radialThick = r + (rand() - 0.5) * 0.045
      const elev = (rand() - 0.5) * 0.045
      const waveX = Math.cos(azimuth) * radialThick
      const waveZ = Math.sin(azimuth) * radialThick
      const waveY = yBase + elev
      const [px, py, pz] = rotatePoint(waveX, waveY, waveZ, rx * 0.65, ry)
      const [nx, ny, nz] = rotatePoint(Math.cos(azimuth), 0.7, Math.sin(azimuth), rx * 0.65, ry)
      pushPoint(buf, px, py, pz, nx, ny, nz, 0.98)
    }
  }

  fillHaloDust(buf, count, rand)
  return { positions: buf.positions, normals: buf.normals, lumas: buf.lumas }
}

/**
 * Generates one procedural particle sculpture dataset per SkillGroup entry.
 */
export function buildStackSculptureDataset(
  count: number,
  groups: readonly SkillGroup[]
): SculptureDataset[] {
  return groups.map((group, idx) => {
    const seed = 4099 + idx * 7919
    if (group.id === 'frontend') return buildFrontendSculpture(count, seed)
    if (group.id === 'backend') return buildBackendSculpture(count, seed)
    if (group.id === 'ai') return buildAiNeuralSculpture(count, seed)
    return buildIotChipSculpture(count, seed)
  })
}
