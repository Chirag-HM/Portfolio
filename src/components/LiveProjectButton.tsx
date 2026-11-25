import { Link } from 'react-router'

export interface LiveProjectButtonProps {
  label?: string
  to?: string
  href?: string
  className?: string
  onClick?: () => void
}

const BUTTON_CLASSES =
  'inline-block cursor-pointer rounded-full border-2 border-[#D7E2EA] px-8 py-3 text-sm font-medium uppercase tracking-widest text-[#D7E2EA] transition-colors duration-200 hover:bg-[#D7E2EA]/10 sm:px-10 sm:py-3.5 sm:text-base'

export function LiveProjectButton({
  label = 'Case Study',
  to,
  href,
  className = '',
  onClick,
}: LiveProjectButtonProps) {
  const classes = `${BUTTON_CLASSES} ${className}`.trim()

  if (to) {
    return (
      <Link to={to} onClick={onClick} className={classes}>
        {label}
      </Link>
    )
  }

  return (
    <a href={href ?? '#projects'} onClick={onClick} className={classes}>
      {label}
    </a>
  )
}
