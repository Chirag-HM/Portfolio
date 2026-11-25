import { useEffect, useState } from 'react'

/** Check whether WebGL2 or WebGL1 is available. */
export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(
      canvas.getContext('webgl2') ||
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl')
    )
  } catch {
    return false
  }
}

/** Whether CPU cores or device memory indicate a reduced GPU budget for heavy 3D shaders. */
export function isReducedGpuTier(): boolean {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as Navigator & { deviceMemory?: number }
  const lowCores =
    typeof navigator.hardwareConcurrency === 'number' &&
    navigator.hardwareConcurrency <= 4
  const lowMemory = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4
  return lowCores || lowMemory
}

/**
 * Low-end / touch-primary / narrow-viewport heuristic used by <SceneSlot>
 * to decide whether an optional lazy 3D scene may mount.
 */
export function isLowEndDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false

  const coarsePointer = window.matchMedia('(pointer: coarse)').matches
  const hasFinePointer = window.matchMedia('(pointer: fine)').matches
  const isTouchOnly =
    coarsePointer ||
    (!hasFinePointer && ('ontouchstart' in window || navigator.maxTouchPoints > 0))
  const narrowViewport = window.innerWidth < 1024

  return isReducedGpuTier() || isTouchOnly || narrowViewport
}

export function useDeviceSceneEligibility(): boolean {
  const [eligible, setEligible] = useState(() => isWebGLAvailable() && !isLowEndDevice())

  useEffect(() => {
    const update = () => {
      setEligible(isWebGLAvailable() && !isLowEndDevice())
    }
    window.addEventListener('resize', update, { passive: true })
    return () => window.removeEventListener('resize', update)
  }, [])

  return eligible
}
