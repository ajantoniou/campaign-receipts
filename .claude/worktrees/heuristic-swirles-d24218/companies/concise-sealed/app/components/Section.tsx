import type { ReactNode } from 'react'

type SectionProps = {
  id?: string
  eyebrow?: string
  title: string
  children: ReactNode
  className?: string
  innerClassName?: string
}

export function Section({ id, eyebrow, title, children, className = '', innerClassName = 'max-w-5xl' }: SectionProps) {
  return (
    <section
      id={id}
      className={`scroll-mt-24 border-y border-slate-800 bg-black px-4 py-20 ${className}`}
    >
      <div className={`mx-auto ${innerClassName}`}>
        {eyebrow ? (
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-amber-500/90">{eyebrow}</p>
        ) : null}
        <h2 className="mb-10 text-center text-3xl font-bold text-white sm:text-4xl">{title}</h2>
        {children}
      </div>
    </section>
  )
}
