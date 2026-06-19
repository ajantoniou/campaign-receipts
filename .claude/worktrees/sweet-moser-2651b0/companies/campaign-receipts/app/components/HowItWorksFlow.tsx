'use client'

// HowItWorksFlow — a lightweight, on-brand animated walkthrough. Shows the
// visitor WHAT THEY GET as a chain of steps that reveal one after another, then
// loops. No video, no heavy library — pure CSS keyframes + a tiny interval so
// the reveal restarts every few seconds. Respects prefers-reduced-motion
// (everything is shown at once, no motion).
//
// Used on:
//   /bills (Newsletter): a bill → who sponsored → who paid them → who voted
//   /for-journalists: search any name → sourced dossier in one click

import { useState, useEffect } from 'react'

export type FlowStep = {
  label: string // mono kicker, e.g. "Step 1"
  title: string // ≤6 words
  body: string // ≤12 words
}

export default function HowItWorksFlow({
  kicker,
  heading,
  steps,
}: {
  kicker: string
  heading: string
  steps: FlowStep[]
}) {
  const [active, setActive] = useState(0)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Reveal one step at a time, loop back to the start after a beat.
  useEffect(() => {
    if (reduced) return
    const id = setInterval(() => {
      setActive((a) => (a + 1) % (steps.length + 1))
    }, 1100)
    return () => clearInterval(id)
  }, [reduced, steps.length])

  const isShown = (i: number) => reduced || active === 0 || i < active

  return (
    <div className="max-w-[760px] mx-auto">
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-3">
        {kicker}
      </div>
      <h2 className="font-display text-[28px] sm:text-[34px] leading-[1.1] tracking-[-0.005em] text-ink">
        {heading}
      </h2>

      <ol className="mt-7 list-none p-0 m-0 flex flex-col gap-0">
        {steps.map((s, i) => (
          <li key={i} className="relative">
            {/* connector line down to the next step */}
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className={[
                  'absolute left-[18px] top-[40px] bottom-[-12px] w-px bg-line transition-opacity duration-500',
                  isShown(i + 1) ? 'opacity-100' : 'opacity-0',
                ].join(' ')}
              />
            )}
            <div
              className={[
                'flex items-start gap-4 pb-6 transition-all duration-500 ease-out will-change-transform',
                isShown(i)
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-3',
              ].join(' ')}
            >
              <span className="shrink-0 grid place-items-center size-9 rounded-full border border-ink bg-paper font-mono text-[13px] text-ink">
                {i + 1}
              </span>
              <div className="min-w-0 pt-1">
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3 mb-1">
                  {s.label}
                </div>
                <div className="font-display text-[20px] sm:text-[22px] leading-[1.15] text-ink">
                  {s.title}
                </div>
                <p className="mt-1 font-sans text-[14px] text-ink-2 leading-relaxed m-0">
                  {s.body}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
