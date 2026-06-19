'use client'

// Self-serve cancel control. Calls POST /api/subscription/cancel. LS cancels at
// period end, so we tell the user they keep access until the month ends.
import { useState } from 'react'

export default function CancelButton({
  product,
  label,
  endsAt,
}: {
  product: 'software' | 'newsletter'
  label: string
  endsAt: string | null
}) {
  const [state, setState] = useState<'idle' | 'confirm' | 'working' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  const endsLabel = endsAt
    ? new Date(endsAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : null

  async function doCancel() {
    setState('working')
    try {
      const r = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Could not cancel.')
      setState('done')
    } catch (e: any) {
      setMsg(e.message || 'Could not cancel.')
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <p className="font-sans text-[13px] text-ink-2 m-0">
        Canceled. You keep {label} until your month ends{endsLabel ? ` (${endsLabel})` : ''}.
      </p>
    )
  }

  if (state === 'confirm' || state === 'working') {
    return (
      <div className="flex flex-col gap-2">
        <p className="font-sans text-[13px] text-ink-2 m-0">
          Cancel anytime. You keep access until your month ends{endsLabel ? ` (${endsLabel})` : ''}.
        </p>
        <div className="flex gap-2">
          <button
            onClick={doCancel}
            disabled={state === 'working'}
            className="rounded-full bg-broken text-paper font-sans text-[13px] px-4 py-1.5 disabled:opacity-60"
          >
            {state === 'working' ? 'Canceling…' : 'Yes, cancel'}
          </button>
          <button
            onClick={() => setState('idle')}
            disabled={state === 'working'}
            className="rounded-full ring-1 ring-line text-ink-2 font-sans text-[13px] px-4 py-1.5"
          >
            Keep it
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => setState('confirm')}
        className="font-sans text-[13px] text-ink-3 underline underline-offset-2 hover:text-ink-2"
      >
        Cancel {label}
      </button>
      {state === 'error' && <p className="mt-1 font-sans text-[13px] text-broken m-0">{msg}</p>}
    </div>
  )
}
