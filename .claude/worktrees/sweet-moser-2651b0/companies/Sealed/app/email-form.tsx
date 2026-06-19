'use client'

import { useState } from 'react'

export function EmailForm() {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const formData = new FormData()
      formData.append('email', email)
      formData.append('first_name', firstName)
      formData.append('source_book_id', 'sealed')

      const response = await fetch('/api/email/subscribe', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        setEmailSubmitted(true)
        setEmail('')
        setFirstName('')
      } else {
        const text = await response.text().catch(() => '')
        setErrorMessage(text || `Could not subscribe (${response.status}). Try again later.`)
      }
    } catch (error) {
      console.error('Subscribe error:', error)
      setErrorMessage('Network error — check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {emailSubmitted ? (
        <div className="rounded-md border border-verdict-kept/40 bg-verdict-kept-soft/60 px-6 py-4 mb-8">
          <p className="font-semibold text-verdict-kept">Thanks for signing up.</p>
          <p className="mt-2 text-sm text-ink-700">
            Watch your inbox for the sample PDF. If checkout isn&apos;t live yet, you&apos;ll get the purchase link when
            the store opens. Check spam if nothing arrives within a few minutes.
          </p>
        </div>
      ) : (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          {errorMessage ? (
            <div className="rounded-md border border-civic-red/40 bg-civic-red-soft/60 px-4 py-3 text-sm text-civic-red-dark text-left">
              {errorMessage}
            </div>
          ) : null}
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-parchment-50 border border-ink-900/20 rounded-md text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-civic-blue/50 focus:border-civic-blue"
          />
          <input
            type="text"
            placeholder="Your name (optional)"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full px-4 py-3 bg-parchment-50 border border-ink-900/20 rounded-md text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-civic-blue/50 focus:border-civic-blue"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-civic-blue text-parchment-50 font-semibold py-3 rounded-md hover:bg-civic-blue-dark transition disabled:opacity-50"
          >
            {isLoading ? 'Subscribing...' : 'Get the Free 5-Page Preview'}
          </button>
        </form>
      )}

      <p className="text-xs text-ink-500 mt-6">
        No spam — sample PDF now, purchase link when checkout opens, and occasional edition updates if we ship them.
      </p>
    </>
  )
}
