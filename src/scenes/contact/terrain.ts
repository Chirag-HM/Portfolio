import * as THREE from 'three'

export const HUT_X = 0
export const HUT_Z = -6.0
export const HUT_BASE_Y = 0.65

export const TERRAIN_WIDTH = 78
export const TERRAIN_DEPTH = 66

function fract(v: number): number {
  return v - Math.floor(v)
}

function hash2D(ix: number, iz: number): number {
  return fract(Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453123)
}

function valueNoise2D(x: number, z: number): number {
  const ix = Math.floor(x)
  const iz = Math.floor(z)
  const fx = x - ix
  const fz = z - iz

  const ux = fx * fx * (3 - 2 * fx)
  const uz = fz * fz * (3 - 2 * fz)

  const a = hash2D(ix, iz)
  const b = hash2D(ix + 1, iz)
  const c = hash2D(ix, iz + 1)
  const d = hash2D(ix + 1, iz + 1)

  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz
}

function ridgedFbm(x: number, z: number): number {
  let sum = 0
  let amp = 0.55
  let freq = 0.085
  let px = x
  let pz = z

  for (let i = 0; i < 4; i++) {
    const n = valueNoise2D(px * freq, pz * freq)
    const ridge = 1 - Math.abs(n * 2 - 1)
    sum += ridge * ridge * amp
    amp *= 0.48
    freq *= 2.08
    px += 13.7
    pz += 7.3
  }
  return sum
}

/**
 * Deterministic terrain elevation (Y) shared by geometry generation and camera collision guard.
 * Carves a navigable valley corridor along the glide path and a grounded saddle plateau for the hut.
 */
export function sampleTerrainHeight(x: number, z: number): number {
  const fbm = ridgedFbm(x + 12.4, z - 8.2)
  const rolling = valueNoise2D(x * 0.14 + 3.1, z * 0.14 - 4.7) * 0.85

  // Flanking alpine ridge walls on left and right margins
  const lateralNorm = Math.min(1, Math.abs(x) / 24)
  const sidePeaks = Math.pow(lateralNorm, 1.6) * 7.2 * (0.45 + fbm * 0.65)

  // Distant receding mountain range silhouette leaving night sky visible at corners
  const backDist = Math.max(0, -13.0 - z)
  const backNorm = Math.min(1, backDist / 24)
  const mainPeak =
    Math.exp(-((x + 7.2) * (x + 7.2)) / 62 - ((z + 25.0) * (z + 25.0)) / 78) * 6.4
  const rightPeak =
    Math.exp(-((x - 12.0) * (x - 12.0)) / 68 - ((z + 23.0) * (z + 23.0)) / 72) * 5.4
  const backMassif = Math.pow(backNorm, 1.45) * 4.1 * (0.42 + fbm * 0.6) + mainPeak + rightPeak

  // Gentle foreground valley basin along camera approach (x near 0, z > -4)
  const valleyMask =
    Math.exp(-(x * x) / 52) * THREE.MathUtils.smoothstep(z, -6, 16)
  const floorUndulation = (fbm * 1.3 + rolling * 0.5) * (1 - valleyMask * 0.72) - 0.62

  const rawHeight = floorUndulation + sidePeaks + backMassif

  // Grounded saddle plateau directly supporting the cabin & beacon tower
  const dx = x - HUT_X
  const dz = z - HUT_Z
  const d2 = dx * dx + dz * dz
  const saddleFactor = Math.exp(-d2 / 5.4)

  return THREE.MathUtils.lerp(rawHeight, HUT_BASE_Y, saddleFactor)
}

export interface CameraPose {
  position: [number, number, number]
  lookAt: [number, number, number]
}

/**
 * Computes collision-safe moonlit flight camera pose across scroll progress [0..1].
 * Opens high and wide over mountain peaks, then glides low toward the illuminated cabin saddle.
 */
export function sampleCameraPose(
  progress: number,
  pointerX: number,
  pointerY: number,
  prefersReduced: boolean
): CameraPose {
  const p = prefersReduced ? 1 : THREE.MathUtils.clamp(progress, 0, 1)
  // Smooth ease-in-out curve for cinematic deceleration near cabin
  const ease = p * p * (3 - 2 * p)

  const px = prefersReduced ? 0 : pointerX * (0.55 - ease * 0.25)
  const py = prefersReduced ? 0 : pointerY * (0.28 - ease * 0.14)

  // Spline keyframes via two-segment quadratic Bezier
  // Start: high wide view over valley [-2.4, 7.2, 13.8]
  // Mid peak sweep: [-1.0, 3.8, 4.8]
  // End close-up framing hut & beacon cleanly above footer typography: [1.45, 2.35, 0.35]
  const inv = 1 - ease
  let cx = inv * inv * -2.4 + 2 * inv * ease * -1.0 + ease * ease * 1.45 + px
  let cy = inv * inv * 7.2 + 2 * inv * ease * 3.8 + ease * ease * 2.35 + py
  const cz = inv * inv * 13.8 + 2 * inv * ease * 4.8 + ease * ease * 0.35

  // Guarantee zero terrain clipping under any aspect or pointer parallax offset
  const groundY = sampleTerrainHeight(cx, cz)
  cy = Math.max(cy, groundY + 1.15)

  // LookAt settles smoothly slightly below cabin midpoint so cabin + beacon sit high above bottom typography
  const lx = THREE.MathUtils.lerp(0.0, -0.22, ease) + px * 0.18
  const ly = THREE.MathUtils.lerp(1.5, 0.58, ease) + py * 0.12
  const lz = THREE.MathUtils.lerp(-14.5, HUT_Z - 0.1, ease)

  // Clamp subtle drift away from mountains on extremes
  cx = THREE.MathUtils.clamp(cx, -12, 12)

  return {
    position: [cx, cy, cz],
    lookAt: [lx, ly, lz],
  }
}
