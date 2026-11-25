import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '../lib/motion'

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/_-.[]'

export interface ScrambleTextProps {
  text: string
  /** Set true to trigger scramble-to-resolved animation */
  active?: boolean
  durationMs?: number
  delayMs?: number
  className?: string
}

/**
 * Brief monospace character scramble/decrypt effect matching the Igloo HUD/panel transition.
 * Renders the exact text immediately when prefers-reduced-motion is enabled.
 */
export function ScrambleText({
  text,
  active = true,
  durationMs = 460,
  delayMs = 0,
  className = '',
}: ScrambleTextProps) {
  const prefersReduced = usePrefersReducedMotion()
  const [animState, setAnimState] = useState<{ source: string; output: string }>({
    source: text,
    output: text,
  })
  const rafRef = useRef(0)

  useEffect(() => {
    if (!active || prefersReduced || !text) {
      return
    }

    let timeoutId = 0
    const startScramble = () => {
      const start = performance.now()
      const length = text.length

      const tick = (now: number) => {
        const elapsed = now - start
        const progress = Math.min(1, elapsed / Math.max(120, durationMs))
        const lockedCount = Math.floor(progress * length)

        let out = ''
        for (let i = 0; i < length; i++) {
          const ch = text[i]
          if (ch === ' ' || ch === '\n') {
            out += ch
          } else if (i < lockedCount) {
            out += ch
          } else {
            const gIdx = Math.floor(Math.random() * GLYPHS.length)
            out += GLYPHS[gIdx]
          }
        }
        setAnimState({ source: text, output: progress < 1 ? out : text })

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick)
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    if (delayMs > 0) {
      timeoutId = window.setTimeout(startScramble, delayMs)
    } else {
      startScramble()
    }

    return () => {
      window.clearTimeout(timeoutId)
      cancelAnimationFrame(rafRef.current)
    }
  }, [text, active, durationMs, delayMs, prefersReduced])

  const rendered =
    !active || prefersReduced || !text
      ? text
      : animState.source === text
        ? animState.output
        : text

  return <span className={className}>{rendered}</span>
}
