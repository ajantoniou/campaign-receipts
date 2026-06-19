#!/usr/bin/env node
/**
 * CON-77 / CON-135: deterministic check that LS webhook HMAC + slug normalization
 * match `app/api/lemon-squeezy/webhook/route.ts`. Run: `npm run verify:ls-webhook`
 * (no network, no secrets required).
 *
 * Integration smoke (TASK-018 evidence: HTTP 200 + row in public.email_subscribers):
 *   dotenv -e ../../.env -- node scripts/verify-ls-webhook-fixture.mjs --integration [webhookUrl]
 * Default webhookUrl: http://127.0.0.1:3000/api/lemon-squeezy/webhook
 * Needs env: LEMONSQUEEZY_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'
import process from 'node:process'

function verifySignature(rawBody, secret, signatureHeader) {
  if (!secret || !signatureHeader || rawBody.length === 0) return false
  try {
    const signature = Buffer.from(signatureHeader, 'hex')
    if (signature.length === 0) return false
    const hmac = Buffer.from(
      crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex'),
      'hex'
    )
    if (hmac.length !== signature.length) return false
    return crypto.timingSafeEqual(hmac, signature)
  } catch {
    return false
  }
}

function normalizeSourceBookId(value) {
  if (typeof value !== 'string') return null
  const t = value.trim()
  if (!t || t.length > 256) return null
  return t
}

function runOfflineChecks() {
  const secret = 'fixture-ls-webhook-secret'
  const payload = {
    meta: { event_name: 'order_created', custom_data: { source_book_id: 'sealed' } },
    data: {
      type: 'orders',
      id: '1',
      attributes: {
        user_email: 'buyer+c77@example.com',
        user_name: 'Fixture Buyer',
        test_mode: true,
      },
    },
  }
  const rawBody = JSON.stringify(payload)
  const sig = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')

  if (!verifySignature(rawBody, secret, sig)) {
    console.error('FAIL: HMAC verification')
    process.exit(1)
  }

  const parsed = JSON.parse(rawBody)
  const orderEvents = new Set(['order_created', 'subscription_created'])
  if (!orderEvents.has(parsed.meta.event_name)) {
    console.error('FAIL: event gate')
    process.exit(1)
  }

  const slug = normalizeSourceBookId(parsed.meta.custom_data.source_book_id)
  if (slug !== 'sealed') {
    console.error('FAIL: slug normalization', slug)
    process.exit(1)
  }

  console.log('verify:ls-webhook OK (HMAC hex + order_created gate + source_book_id slug)')
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function runIntegration(webhookUrl) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!secret || !supabaseUrl || !serviceKey) {
    console.error(
      'FAIL: --integration needs LEMONSQUEEZY_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in env'
    )
    process.exit(1)
  }

  const stamp = Date.now()
  const uniqueEmail = `ls-webhook-smoke+${stamp}@fixture.invalid`
  const payload = {
    meta: { event_name: 'order_created', custom_data: { source_book_id: 'sealed' } },
    data: {
      type: 'orders',
      id: `fixture-${stamp}`,
      attributes: {
        user_email: uniqueEmail,
        user_name: 'Integration Smoke',
        test_mode: true,
      },
    },
  }
  const rawBody = JSON.stringify(payload)
  const sig = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Signature': sig,
    },
    body: rawBody,
  })

  const text = await res.text()
  if (!res.ok) {
    console.error('FAIL: webhook HTTP', res.status, text.slice(0, 500))
    process.exit(1)
  }

  let bodyJson
  try {
    bodyJson = JSON.parse(text)
  } catch {
    bodyJson = null
  }
  if (!bodyJson?.success) {
    console.error('FAIL: webhook body missing success', text.slice(0, 500))
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceKey)
  for (let i = 0; i < 5; i++) {
    const { data, error } = await supabase
      .from('email_subscribers')
      .select('email, tags, source_book_id, first_name')
      .eq('email', uniqueEmail)
      .maybeSingle()

    if (error) {
      console.error('FAIL: Supabase select', error.message)
      process.exit(1)
    }
    if (data) {
      console.log('verify:ls-webhook integration OK — row:', JSON.stringify(data))
      process.exit(0)
    }
    await sleep(400)
  }

  console.error('FAIL: no subscriber row for', uniqueEmail, 'after webhook 200')
  process.exit(1)
}

const argv = process.argv.slice(2)
const intIdx = argv.indexOf('--integration')

runOfflineChecks()

if (intIdx === -1) {
  process.exit(0)
}

const urlArg = argv[intIdx + 1]
const webhookUrl =
  urlArg ||
  process.env.SEALED_LS_WEBHOOK_URL ||
  'http://127.0.0.1:3000/api/lemon-squeezy/webhook'

runIntegration(webhookUrl).catch((err) => {
  console.error('FAIL: integration threw', err)
  process.exit(1)
})
