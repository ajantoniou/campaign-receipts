'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled error in app router:', error)
  }, [error])

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center px-4 space-y-6">
      <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Oops</p>
      <h1 className="text-4xl font-semibold">Something went wrong.</h1>
      <p className="max-w-xl text-center text-slate-300">
        The server could not render this page. You can try again or come back
        later once we have resolved the issue.
      </p>
      <button
        type="button"
        onClick={reset}
        className="px-6 py-3 bg-blue-600 text-white rounded-full shadow-lg transition hover:bg-blue-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-blue-300"
      >
        Retry
      </button>
    </main>
  )
}
