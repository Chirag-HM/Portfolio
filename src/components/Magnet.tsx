import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

export interface MagnetProps {
  children: ReactNode
  padding?: number
  disabled?: boolean
  strength?: number
  activeTransition?: string
  inactiveTransition?: string
  wrapperClassName?: string
  innerClassName?: string
  className?: string
  style?: CSSProperties
}

export function Magnet({
  children,
  padding = 100,
  disabled = false,
  strength = 2,
  activeTransition = 'transform 0.3s ease-out',
  inactiveTransition = 'transform 0.6s ease-in-out',
  wrapperClassName = '',
  innerClassName = '',
  className = '',
  style,
}: MagnetProps) {
  const magnetRef = useRef<HTMLDivElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (disabled) {
      return
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      return
    }

    const handleMouseMove = (e: MouseEvent) => {
      const el = magnetRef.current
      if (!el) return

      const { left, top, width, height } = el.getBoundingClientRect()
      const centerX = left + width / 2
      const centerY = top + height / 2

      const distX = Math.abs(centerX - e.clientX)
      const distY = Math.abs(centerY - e.clientY)

      if (distX < width / 2 + padding && distY < height / 2 + padding) {
        setIsActive(true)
        const offsetX = (e.clientX - centerX) / strength
        const offsetY = (e.clientY - centerY) / strength
        setPosition({ x: offsetX, y: offsetY })
      } else {
        setIsActive(false)
        setPosition({ x: 0, y: 0 })
      }
    }

    const handleMouseLeave = () => {
      setIsActive(false)
      setPosition({ x: 0, y: 0 })
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [padding, disabled, strength])

  const transform = disabled
    ? 'translate3d(0px, 0px, 0)'
    : `translate3d(${position.x}px, ${position.y}px, 0)`

  return (
    <div
      ref={magnetRef}
      className={`${wrapperClassName} ${className}`.trim()}
      style={{ position: 'relative', display: 'inline-block', ...style }}
    >
      <div
        className={innerClassName}
        style={{
          transform,
          transition: isActive ? activeTransition : inactiveTransition,
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  )
}
