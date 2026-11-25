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
    navigator.hardwareConcurrency <= 2
  const lowMemory = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 2
  return lowCores || lowMemory
}

/**
 * Checks whether WebGL is supported on this browser.
 * As long as WebGL is available, the device can render 3D scenes in immersive mode.
 */
export function useDeviceSceneEligibility(): boolean {
  const [eligible, setEligible] = useState(() => isWebGLAvailable())

  useEffect(() => {
    const update = () => {
      setEligible(isWebGLAvailable())
    }
    window.addEventListener('resize', update, { passive: true })
    return () => window.removeEventListener('resize', update)
  }, [])

  return eligible
}
