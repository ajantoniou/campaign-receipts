#!/usr/bin/env node
//
// scripts/sync-markets.mjs
// Triggers the Next.js API endpoint to batch-sync prediction markets.
// This is executed by the Render cron worker.

const url = (process.env.NEXT_PUBLIC_SITE_URL || 'https://campaignreceipts.com') + '/api/cron/sync-markets'
console.log(`Triggering market sync at ${url}...`)

try {
  const secret = process.env.CRON_SECRET ? `?secret=${process.env.CRON_SECRET}` : ''
  const res = await fetch(url + secret)
  const text = await res.text()
  console.log(`Response [${res.status}]:`, text)
  if (!res.ok) {
    process.exit(1)
  }
} catch (e) {
  console.error('Failed to trigger sync:', e.message)
  process.exit(1)
}
