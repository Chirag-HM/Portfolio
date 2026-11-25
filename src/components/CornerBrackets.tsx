import type { ReactNode } from 'react'

export interface CornerBracketsProps {
  children: ReactNode
  className?: string
  bracketSize?: string
}

/**
 * Igloo-inspired four corner L-brackets around active mono labels & [ Close ] button.
 */
export function CornerBrackets({
  children,
  className = 'px-5 py-2',
  bracketSize = 'h-2.5 w-2.5',
}: CornerBracketsProps) {
  return (
    <span className={`relative inline-flex items-center justify-center ${className}`}>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute top-0 left-0 border-t border-l border-[#D7E2EA]/75 ${bracketSize}`}
      />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute top-0 right-0 border-t border-r border-[#D7E2EA]/75 ${bracketSize}`}
      />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute bottom-0 left-0 border-b border-l border-[#D7E2EA]/75 ${bracketSize}`}
      />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute bottom-0 right-0 border-b border-r border-[#D7E2EA]/75 ${bracketSize}`}
      />
      {children}
    </span>
  )
}
