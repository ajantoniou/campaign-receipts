// Button — pill primitives. Per claude-design benchmark.
//
// Two variants (both gain a 1px hover lift + grounded shadow from the
// shared .btn-* classes; motion-safe via prefers-reduced-motion):
//   - primary  = ink fill, paper text, hover ink-2 + grounded shadow
//   - secondary = transparent ghost, ink text, line border; inverts to
//                 ink-fill / paper-text on hover

import Link from 'next/link'

type CommonProps = {
  variant?: 'primary' | 'secondary'
  size?: 'default' | 'sm'
  children: React.ReactNode
  className?: string
}

type AsButton = CommonProps & {
  href?: never
  type?: 'button' | 'submit' | 'reset'
  onClick?: (e: React.MouseEvent) => void
  disabled?: boolean
}

type AsLink = CommonProps & {
  href: string
  target?: string
  rel?: string
}

type Props = AsButton | AsLink

export default function Button(props: Props) {
  const { variant = 'primary', size = 'default', children, className = '' } = props
  const base = variant === 'primary' ? 'btn-primary' : 'btn-secondary'
  const sizeCls = size === 'sm' ? 'text-xs px-3.5 py-2' : ''
  const cls = `${base} ${sizeCls} ${className}`.trim()

  if ('href' in props && props.href !== undefined) {
    const isExternal = typeof props.href === 'string' && /^https?:\/\//.test(props.href)
    if (isExternal) {
      return (
        <a href={props.href} target={props.target} rel={props.rel || 'noopener noreferrer'} className={cls}>
          {children}
        </a>
      )
    }
    return <Link href={props.href} className={cls}>{children}</Link>
  }
  return (
    <button
      type={(props as AsButton).type || 'button'}
      onClick={(props as AsButton).onClick}
      disabled={(props as AsButton).disabled}
      className={cls}
    >
      {children}
    </button>
  )
}
