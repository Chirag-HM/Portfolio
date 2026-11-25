import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { useRef, type CSSProperties } from 'react'
import { usePrefersReducedMotion } from '../lib/motion'

interface CharacterProps {
  char: string
  progress: MotionValue<number>
  range: [number, number]
}

function Character({ char, progress, range }: CharacterProps) {
  const opacity = useTransform(progress, range, [0.2, 1])

  return (
    <span className="relative inline-block" aria-hidden="true">
      <span className="opacity-0">{char}</span>
      <motion.span style={{ opacity }} className="absolute inset-0">
        {char}
      </motion.span>
    </span>
  )
}

export interface AnimatedTextProps {
  text: string
  className?: string
  style?: CSSProperties
}

export function AnimatedText({ text, className = '', style }: AnimatedTextProps) {
  const containerRef = useRef<HTMLParagraphElement>(null)
  const prefersReduced = usePrefersReducedMotion()
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.8', 'end 0.2'],
  })

  if (prefersReduced) {
    return (
      <p ref={containerRef} className={className} style={style}>
        {text}
      </p>
    )
  }

  const words = text.split(' ')
  const totalChars = text.replace(/\s+/g, '').length
  let charCursor = 0

  return (
    <p ref={containerRef} className={className} style={style}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, wordIdx) => {
          const chars = Array.from(word)
          return (
            <span key={wordIdx} className="inline-block whitespace-nowrap">
              {chars.map((char, charIdx) => {
                const index = charCursor++
                const start = index / Math.max(1, totalChars)
                const end = Math.min(1, (index + 1) / Math.max(1, totalChars))
                return (
                  <Character
                    key={`${wordIdx}-${charIdx}`}
                    char={char}
                    progress={scrollYProgress}
                    range={[start, end]}
                  />
                )
              })}
              {wordIdx < words.length - 1 ? <span>&nbsp;</span> : null}
            </span>
          )
        })}
      </span>
    </p>
  )
}
