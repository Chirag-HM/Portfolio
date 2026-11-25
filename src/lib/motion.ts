import { useEffect, useState } from 'react'
import type Lenis from 'lenis'

let lenisInstance: Lenis | null = null

export function setLenisInstance(instance: Lenis | null): void {
  lenisInstance = instance
}

/** Smoothly scroll to a selector, element, or numeric y-offset using Lenis when active. */
export function scrollToTarget(target: string | HTMLElement | number): void {
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (lenisInstance && !prefersReduced) {
    lenisInstance.scrollTo(target, { immediate: false })
    return
  }

  if (typeof target === 'number') {
    window.scrollTo({ top: target, behavior: prefersReduced ? 'auto' : 'smooth' })
    return
  }

  const el = typeof target === 'string' ? document.querySelector(target) : target
  if (el) {
    el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' })
  }
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}
