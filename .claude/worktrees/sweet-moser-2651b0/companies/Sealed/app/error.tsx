'use client'

import { useEffect } from 'react'

type ErrorProps = {
  error: Error
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('App error boundary caught:', error)
  }, [error])

  return (
    <main className="min-h-screen bg-parchment-100 text-ink-900 flex items-center justify-center px-6 py-16">
      <div className="max-w-xl text-center space-y-4">
        <p className="sealed-eyebrow-quiet text-center">Something went wrong</p>
        <h1 className="font-serif text-4xl font-bold text-ink-900">We hit an error.</h1>
        <div className="gold-rule mx-auto max-w-[8rem]" aria-hidden />
        <p className="font-serif text-lg text-ink-700">
          We&apos;re logging the issue and sending the error to our console. Refresh to try again, or come back shortly.
        </p>
        <button
          onClick={() => reset()}
          className="sealed-btn-secondary mt-2"
        >
          Retry page
        </button>
      </div>
    </main>
  )
}
