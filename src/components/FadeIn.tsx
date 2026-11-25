import { motion } from 'framer-motion'
import { type CSSProperties, type ReactNode } from 'react'

const MOTION_ELEMENTS = {
  div: motion.create('div'),
  section: motion.create('section'),
  header: motion.create('header'),
  nav: motion.create('nav'),
  article: motion.create('article'),
  h1: motion.create('h1'),
  h2: motion.create('h2'),
  h3: motion.create('h3'),
  p: motion.create('p'),
  span: motion.create('span'),
} as const

export type FadeInElement = keyof typeof MOTION_ELEMENTS

export interface FadeInProps {
  children: ReactNode
  as?: FadeInElement
  delay?: number
  duration?: number
  x?: number
  y?: number
  immediate?: boolean
  className?: string
  style?: CSSProperties
}

export function FadeIn({
  children,
  as = 'div',
  delay = 0,
  duration = 0.7,
  x = 0,
  y = 30,
  immediate = false,
  className,
  style,
}: FadeInProps) {
  const MotionTag = MOTION_ELEMENTS[as]

  return (
    <MotionTag
      initial={{ opacity: 0, x, y }}
      {...(immediate
        ? { animate: { opacity: 1, x: 0, y: 0 } }
        : {
            whileInView: { opacity: 1, x: 0, y: 0 },
            viewport: { once: true, margin: '50px', amount: 0 },
          })}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
      style={style}
    >
      {children}
    </MotionTag>
  )
}
