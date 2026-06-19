'use client'

// CompRequestForm — replaces mailto:alex@ on /for-journalists + /pricing.
// Per rev-7 strategy panel: "Conversion attribution + faster reply."
//
// Three modes: 'comp_code' (journalist asking for 30-day Pro comp),
// 'pro_waitlist' (general Pro waitlist signup), 'tip' (story tip
// submission).
//
// On submit: POST /api/comp-request → inserts to cr_comp_requests,
// best-effort Resend notification to founder, returns ok.

import { useState, useEffect } from 'react'

type Mode = 'comp_code' | 'pro_waitlist' | 'tip' | 'engine_waitlist' | 'feedback' | 'friday_receipts' | 'product_price'

type Engine = 'bills' | 'donor_to_vote' | 'donor_to_bill' | 'tips_to_verdicts'

type Product = 'journalist-database' | 'bill-donor-newsletter'

/** One selectable price-discovery option: stored value + the label shown. */
type PriceBand = { value: string; label: string }

type Props = {
  mode: Mode
  /** For mode='engine_waitlist': which engine the user is signing up for. */
  engine?: Engine
  /** For mode='product_price': which paid product this lead is for. */
  product?: Product
  /** For mode='product_price': the selectable price bands / tiers. */
  priceBands?: PriceBand[]
  /** For mode='product_price': overrides for heading/subhead/cta/prompt. */
  productCopy?: {
    eyebrow?: string
    heading?: string
    subhead?: string
    cta?: string
    pricePrompt?: string
    outletLabel?: string
    outletPlaceholder?: string
    roleLabel?: string
    rolePlaceholder?: string
    useCaseLabel?: string
    useCasePlaceholder?: string
  }
  /** For mode='feedback': free-text topic so we can route to the right reviewer. */
  feedbackTopic?: string
  /** Optional UTM defaults (server can pass from query string) */
  utm?: {
    source?: string
    medium?: string
    campaign?: string
    content?: string
  }
}

const CONFIG: Record<Mode, {
  heading: string
  subhead: string
  cta: string
  successHeading: string
  successBody: string
  fields: {
    storyTopic?: { label: string; placeholder: string }
    role?: { label: string; placeholder: string }
    outlet?: { label: string; placeholder: string }
    notes?: { label: string; placeholder: string }
  }
}> = {
  comp_code: {
    heading: 'Request a Pro comp',
    subhead: "For working journalists. Stored in our reviewer queue. We onboard newsrooms in batches; you'll get an email when your comp is ready.",
    cta: 'Send comp request →',
    successHeading: 'Got it.',
    successBody: "Your request is in the queue. We onboard newsrooms in weekly batches — watch your inbox.",
    fields: {
      outlet: { label: 'Outlet', placeholder: 'The Atlantic, ProPublica, etc.' },
      role: { label: 'Role', placeholder: 'Reporter, editor, fellow…' },
      storyTopic: { label: 'What are you reporting on?', placeholder: 'A short sentence on the story you\'re evaluating Pro for' },
    },
  },
  pro_waitlist: {
    heading: 'Join the Pro waitlist',
    subhead: 'We notify you when Pro fully launches. No card required.',
    cta: 'Join the waitlist →',
    successHeading: "You're on the list.",
    successBody: "We'll email you when Pro launches with priority onboarding for waitlist members.",
    fields: {
      outlet: { label: 'Organization (optional)', placeholder: 'Newsroom, think tank, freelance, etc.' },
      role: { label: 'Role (optional)', placeholder: 'Reporter, analyst, researcher…' },
    },
  },
  tip: {
    heading: 'Send a tip',
    subhead: "Politician's claim you want our reviewer panel to grade? Send it. Public corrections log; 48h reply SLA.",
    cta: 'Send tip →',
    successHeading: 'Tip received.',
    successBody: "Stored to our review queue. We'll email if the verdict ships + cite you in the notes if you want.",
    fields: {
      storyTopic: { label: 'Tip subject', placeholder: 'Politician + claim or instrument' },
      notes: { label: 'Details + primary-source pointer', placeholder: 'URL, transcript, filing — what we need to verify' },
    },
  },
  engine_waitlist: {
    heading: 'Join the engine waitlist',
    subhead: "We'll email you when this engine unlocks. First 1,000 signups vote on launch pricing.",
    cta: 'Join the waitlist →',
    successHeading: "You're on the list.",
    successBody: "We'll email you when the engine launches with early-access pricing for waitlist members. Watch your inbox.",
    fields: {
      outlet: { label: 'Organization (optional)', placeholder: 'Newsroom, think tank, university, freelance, citizen' },
      role: { label: 'Role (optional)', placeholder: 'Reporter, researcher, student, active citizen…' },
    },
  },
  feedback: {
    heading: 'Send a citation, dispute, or correction',
    subhead: "Reviewed daily by our cron worker + LLM, then by editorial. Credible submissions are added to the corpus + logged in the public corrections log.",
    cta: 'Send →',
    successHeading: 'In the queue.',
    successBody: "Our daily cron will review your submission. If it's credible, you'll see the result in our corrections log + a heads-up email if you supplied one.",
    fields: {
      notes: { label: 'Submission', placeholder: 'Politician + claim + primary-source URL + what we should fix' },
    },
  },
  product_price: {
    // Defaults; per-page copy comes through the productCopy prop.
    heading: 'Get on the list',
    subhead: 'Tell us what you would pay. No card. No commitment.',
    cta: 'Send →',
    successHeading: "You're on the list.",
    successBody: "We logged what you would pay. We email you the day it opens. Watch your inbox.",
    fields: {
      outlet: { label: 'Where you work (optional)', placeholder: 'Newsroom, firm, freelance' },
      role: { label: 'Your job (optional)', placeholder: 'Reporter, editor, researcher' },
    },
  },
  friday_receipts: {
    heading: 'Bill Donor Influence — every week in your inbox',
    subhead: "Each week we name the donors behind a bill. Who paid to sponsor it, and who got paid to vote for it. Free. One unsubscribe click.",
    cta: 'Get the newsletter →',
    successHeading: 'You\'re subscribed.',
    successBody: "Your first email is on the way. Editorial-curated. No tracking pixels. Unsubscribe link in every email.",
    fields: {},
  },
}

const ENGINE_LABEL: Record<Engine, string> = {
  bills: 'New Bills',
  donor_to_vote: 'Donor → Vote',
  donor_to_bill: 'Donor → Bill',
  tips_to_verdicts: 'Tips → Verdicts (AI)',
}

export default function CompRequestForm({ mode, engine, product, priceBands, productCopy, feedbackTopic, utm }: Props) {
  const baseCfg = CONFIG[mode]
  // For product_price, page-supplied copy overrides the defaults.
  const cfg = mode === 'product_price' && productCopy
    ? {
        ...baseCfg,
        heading: productCopy.heading ?? baseCfg.heading,
        subhead: productCopy.subhead ?? baseCfg.subhead,
        cta: productCopy.cta ?? baseCfg.cta,
        fields: {
          ...baseCfg.fields,
          outlet: {
            label: productCopy.outletLabel ?? baseCfg.fields.outlet?.label ?? 'Where you work',
            placeholder: productCopy.outletPlaceholder ?? baseCfg.fields.outlet?.placeholder ?? '',
          },
          role: {
            label: productCopy.roleLabel ?? baseCfg.fields.role?.label ?? 'Your job',
            placeholder: productCopy.rolePlaceholder ?? baseCfg.fields.role?.placeholder ?? '',
          },
        },
      }
    : baseCfg
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [outlet, setOutlet] = useState('')
  const [role, setRole] = useState('')
  const [storyTopic, setStoryTopic] = useState('')
  const [notes, setNotes] = useState('')
  const [wtp, setWtp] = useState<'45' | '95' | '245' | 'free_only' | ''>('')
  const [priceBand, setPriceBand] = useState('')
  const [useCase, setUseCase] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Honeypot field — bots fill it, humans don't
  const [website, setWebsite] = useState('')

  // Mine UTM from URL on mount (in case server didn't pass)
  const [urlUtm, setUrlUtm] = useState(utm || {})
  useEffect(() => {
    if (typeof window === 'undefined') return
    const p = new URLSearchParams(window.location.search)
    setUrlUtm({
      source: utm?.source || p.get('utm_source') || undefined,
      medium: utm?.medium || p.get('utm_medium') || undefined,
      campaign: utm?.campaign || p.get('utm_campaign') || undefined,
      content: utm?.content || p.get('utm_content') || undefined,
    })
  }, [utm])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (website) {
      // Bot caught — silently "succeed"
      setSubmitted(true)
      return
    }
    setSubmitting(true)
    try {
      const resp = await fetch('/api/comp-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Honeypot reaches the server too — direct-POST bots skip this
          // client entirely, so the server-side check is the one that bites.
          website: website || undefined,
          request_type: mode,
          // friday_receipts is email-only inline form; server doesn't
          // require name on that type but we send the local-part of the
          // email so the founder digest has something to display.
          name: name || (mode === 'friday_receipts' ? email.split('@')[0] : ''),
          email,
          outlet: outlet || undefined,
          role: role || undefined,
          story_topic: storyTopic || undefined,
          notes: notes || undefined,
          engine: engine || undefined,
          willingness_to_pay: wtp || undefined,
          product: product || undefined,
          price_band: priceBand || undefined,
          use_case: useCase || undefined,
          feedback_topic: feedbackTopic || undefined,
          utm_source: urlUtm.source,
          utm_medium: urlUtm.medium,
          utm_campaign: urlUtm.campaign,
          utm_content: urlUtm.content,
        }),
      })
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}))
        throw new Error(body.error || 'Submission failed')
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-kept/30 bg-kept-bg p-6 sm:p-8">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-kept mb-2">
          ✓ Submitted
        </div>
        <h3 className="font-display text-[24px] sm:text-[28px] leading-[1.1] text-ink m-0">
          {cfg.successHeading}
        </h3>
        <p className="mt-3 font-sans text-[15px] text-ink-2 leading-relaxed">
          {cfg.successBody}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-line bg-paper p-6 sm:p-8">
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-2">
        {mode === 'product_price'
          ? (productCopy?.eyebrow ?? 'Price check')
          : mode === 'comp_code' ? 'For working journalists' : mode === 'pro_waitlist' ? 'Pro waitlist' : 'Tip line'}
      </div>
      <h3 className="font-display text-[24px] sm:text-[28px] leading-[1.1] text-ink m-0">
        {cfg.heading}
      </h3>
      <p className="mt-2 font-sans text-[14px] text-ink-2 leading-relaxed">
        {cfg.subhead}
      </p>

      {/* Honeypot — display:none so humans don't see it. Bots will fill it. */}
      <label className="hidden" aria-hidden>
        Website
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </label>

      <div className={`mt-5 ${mode === 'friday_receipts' ? 'flex flex-col sm:flex-row gap-3' : 'grid sm:grid-cols-2 gap-3'}`}>
        {/* Friday Receipts is email-only inline; everything else collects name + details */}
        {mode !== 'friday_receipts' && (
          <Field label="Name" required value={name} onChange={setName} placeholder="Your name" />
        )}
        <Field label="Email" type="email" required value={email} onChange={setEmail} placeholder="you@newsroom.com" />
        {cfg.fields.outlet && (
          <Field label={cfg.fields.outlet.label} value={outlet} onChange={setOutlet} placeholder={cfg.fields.outlet.placeholder} />
        )}
        {cfg.fields.role && (
          <Field label={cfg.fields.role.label} value={role} onChange={setRole} placeholder={cfg.fields.role.placeholder} />
        )}
      </div>

      {cfg.fields.storyTopic && (
        <div className="mt-3">
          <Field label={cfg.fields.storyTopic.label} value={storyTopic} onChange={setStoryTopic} placeholder={cfg.fields.storyTopic.placeholder} />
        </div>
      )}

      {cfg.fields.notes && (
        <div className="mt-3">
          <Field label={cfg.fields.notes.label} value={notes} onChange={setNotes} placeholder={cfg.fields.notes.placeholder} textarea />
        </div>
      )}

      {/* Engine-waitlist mode: willingness-to-pay survey + use-case
          field. Real price-discovery vs guessed pricing. */}
      {mode === 'engine_waitlist' && (
        <>
          <div className="mt-5">
            <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-2 mb-2">
              What is this engine worth to you? <span className="text-ink-3 normal-case tracking-normal font-sans">(real pricing signal — no commitment)</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {([
                ['45', '$45/mo'],
                ['95', '$95/mo'],
                ['245', '$245/mo'],
                ['free_only', 'Free only'],
              ] as const).map(([val, label]) => (
                <label
                  key={val}
                  className={
                    'cursor-pointer rounded-md border px-3 py-2.5 text-center transition-colors font-sans text-[13px] ' +
                    (wtp === val
                      ? 'bg-ink text-paper border-ink'
                      : 'bg-paper-2 text-ink-2 border-line hover:border-ink-3')
                  }
                >
                  <input
                    type="radio"
                    name="wtp"
                    value={val}
                    checked={wtp === val}
                    onChange={() => setWtp(val)}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div className="mt-3">
            <Field
              label="What would you use it for?"
              value={useCase}
              onChange={setUseCase}
              placeholder="e.g. tracking pharma money for a healthcare beat"
            />
          </div>
        </>
      )}

      {/* Product price-discovery: pick a band/tier. The selected label is
          stored verbatim in cr_comp_requests.price_band. */}
      {mode === 'product_price' && priceBands && priceBands.length > 0 && (
        <>
          <div className="mt-5">
            <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-2 mb-2">
              {productCopy?.pricePrompt ?? 'What would you pay?'} <span className="text-ink-3 normal-case tracking-normal font-sans">(no card — just a signal)</span>
            </span>
            <div className={`grid gap-2 ${priceBands.length > 2 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
              {priceBands.map((band) => (
                <label
                  key={band.value}
                  className={
                    'cursor-pointer rounded-md border px-3 py-2.5 text-center transition-colors font-sans text-[13px] leading-snug ' +
                    (priceBand === band.value
                      ? 'bg-ink text-paper border-ink'
                      : 'bg-paper-2 text-ink-2 border-line hover:border-ink-3')
                  }
                >
                  <input
                    type="radio"
                    name="price_band"
                    value={band.value}
                    checked={priceBand === band.value}
                    onChange={() => setPriceBand(band.value)}
                    className="sr-only"
                  />
                  {band.label}
                </label>
              ))}
            </div>
          </div>
          <div className="mt-3">
            <Field
              label={productCopy?.useCaseLabel ?? 'What would you use it for?'}
              value={useCase}
              onChange={setUseCase}
              placeholder={productCopy?.useCasePlaceholder ?? 'One short sentence'}
            />
          </div>
        </>
      )}

      {error && (
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-broken">
          {error}
        </p>
      )}

      <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-full bg-ink text-paper hover:bg-ink-2 disabled:opacity-50 font-sans text-[14px] font-medium px-5 py-2.5 transition-colors border border-ink"
        >
          {submitting ? 'Submitting…' : cfg.cta}
        </button>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
          48-hour reply · no tracking pixels · stored at cr_comp_requests
        </span>
      </div>
    </form>
  )
}

function Field({
  label, value, onChange, type = 'text', required, placeholder, textarea,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  placeholder?: string
  textarea?: boolean
}) {
  return (
    <label className="block">
      <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-2 mb-1.5">
        {label}{required && ' *'}
      </span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          required={required}
          placeholder={placeholder}
          className="w-full bg-paper-2 border border-line focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15 rounded-md px-3 py-2 font-sans text-[14px] text-ink placeholder:text-ink-3 transition resize-y"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder={placeholder}
          className="w-full bg-paper-2 border border-line focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15 rounded-md px-3 py-2 font-sans text-[14px] text-ink placeholder:text-ink-3 transition"
        />
      )}
    </label>
  )
}
