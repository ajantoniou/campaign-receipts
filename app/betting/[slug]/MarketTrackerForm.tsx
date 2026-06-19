'use client'

import { useState } from 'react'
import { Mail } from 'lucide-react'

export default function MarketTrackerForm({ slug }: { slug: string }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: 'market',
          source_slug: slug,
        }),
      })
      if (!res.ok) throw new Error('Failed to subscribe')
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <section className="mt-8 border border-[#00FF00]/30 bg-[#00FF00]/10 p-6 rounded text-center">
        <h3 className="text-[#00FF00] font-bold mb-2">Tracking Active!</h3>
        <p className="text-sm text-[#00FF00]/80">
          We will alert {email} when dark money anomalies are detected for this market.
        </p>
      </section>
    )
  }

  return (
    <section className="mt-8 border border-[#333] bg-[#111] p-6 rounded text-center">
      <Mail className="w-6 h-6 text-[#888] mx-auto mb-3" />
      <h3 className="text-white font-bold mb-2">Track this specific market</h3>
      <p className="text-sm text-[#888] mb-4 max-w-md mx-auto">
        Get an email alert the moment our cron worker detects a new FEC filing or dark money anomaly related to this market.
      </p>
      <form className="flex gap-2 max-w-md mx-auto" onSubmit={handleSubmit}>
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address" 
          required
          disabled={status === 'loading'}
          className="flex-1 bg-[#222] border border-[#333] rounded px-4 py-2 text-sm text-white focus:outline-none focus:border-[#58A6FF] disabled:opacity-50"
        />
        <button 
          type="submit" 
          disabled={status === 'loading'}
          className="bg-[#333] text-white px-4 py-2 rounded text-sm font-bold hover:bg-[#444] transition-colors disabled:opacity-50"
        >
          {status === 'loading' ? 'WAIT' : 'TRACK'}
        </button>
      </form>
      {status === 'error' && (
        <p className="text-[#b3271e] text-xs mt-3">An error occurred. Please try again.</p>
      )}
    </section>
  )
}
