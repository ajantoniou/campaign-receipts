'use client'

import { useState } from 'react'

export function ReviewRequestForm() {
  const [email, setEmail] = useState('')
  const [outlet, setOutlet] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const formData = new FormData()
      formData.append('email', email)
      formData.append('first_name', outlet)
      formData.append('source_book_id', 'press-review-request')

      const response = await fetch('/api/email/subscribe', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        setSubmittedEmail(email)
        setSubmitted(true)
        setEmail('')
        setOutlet('')
      } else {
        const text = await response.text().catch(() => '')
        setErrorMessage(text || `Could not submit (${response.status}). Try again or email press@sealed2016.com directly.`)
      }
    } catch (error) {
      console.error('Review request error:', error)
      setErrorMessage('Network error — try again, or email press@sealed2016.com directly.')
    } finally {
      setIsLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-md border border-verdict-kept/40 bg-verdict-kept-soft/60 px-6 py-4">
        <p className="font-semibold text-verdict-kept">Press copy on the way to {submittedEmail}.</p>
        <p className="mt-2 text-sm text-ink-700">
          A human will follow up within 24 hours with the review PDF and answer any methodology
          questions. For anything time-sensitive, email{' '}
          <a href="mailto:press@sealed2016.com" className="underline">press@sealed2016.com</a>.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage ? (
        <div className="rounded-md border border-civic-red/40 bg-civic-red-soft/60 px-4 py-3 text-sm text-civic-red-dark">
          {errorMessage}
        </div>
      ) : null}
      <div>
        <label htmlFor="outlet" className="block font-mono text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-civic-blue mb-1">
          Outlet / your name
        </label>
        <input
          id="outlet"
          type="text"
          placeholder="Tangle / Pirate Wires / your byline"
          value={outlet}
          onChange={(e) => setOutlet(e.target.value)}
          required
          className="w-full px-4 py-3 bg-parchment-50 border border-ink-900/20 rounded-md text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-civic-blue/50 focus:border-civic-blue"
        />
      </div>
      <div>
        <label htmlFor="email" className="block font-mono text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-civic-blue mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          placeholder="editor@outlet.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 bg-parchment-50 border border-ink-900/20 rounded-md text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-civic-blue/50 focus:border-civic-blue"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-civic-blue text-parchment-50 font-semibold py-3 rounded-md hover:bg-civic-blue-dark transition disabled:opacity-50"
      >
        {isLoading ? 'Sending…' : 'Request review copy'}
      </button>
      <p className="text-xs text-ink-500">
        Goes to the founder&rsquo;s inbox. PDF follow-up within 24 hours. No marketing list.
      </p>
    </form>
  )
}
