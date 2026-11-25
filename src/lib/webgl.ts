import type * as THREE from 'three'

/**
 * Attaches a webglcontextlost listener to handle runtime GPU context loss cleanly
 * and returns an unmount disposal helper so Canvas WebGL allocations are freed promptly.
 */
export function attachWebGLContextHandlers(
  gl: THREE.WebGLRenderer,
  label: string,
  onContextLost?: () => void
): () => void {
  const canvas = gl.domElement
  let intentionallyDisposing = false

  canvas.setAttribute('aria-label', label)
  canvas.setAttribute('role', 'img')

  const handleLost = (e: Event) => {
    e.preventDefault()
    if (!intentionallyDisposing) {
      onContextLost?.()
    }
  }

  canvas.addEventListener('webglcontextlost', handleLost, false)

  return () => {
    intentionallyDisposing = true
    canvas.removeEventListener('webglcontextlost', handleLost, false)
    gl.dispose()
  }
}
