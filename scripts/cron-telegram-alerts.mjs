// scripts/cron-telegram-alerts.mjs
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('FATAL: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing')
  process.exit(1)
}

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) {
  console.log('WARNING: TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_ID missing, simulating alerts.')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

const MIN_ALERT_THRESHOLD_USD = 1_000_000 // $1M+ Whale Alert

async function run() {
  console.log(`[cron-telegram-alerts] Starting...`)

  // 1. Fetch recent huge PAC expenditures (simulate querying cr_recent_activity or cr_pac_contributions)
  // We'll query cr_pac_contributions since it exists and has large amounts.
  const { data: contributions, error } = await supabase
    .from('cr_pac_contributions')
    .select('id, politician_id, committee_id, total_amount, cr_committees!inner(name), cr_politicians!inner(name, state)')
    .gte('total_amount', MIN_ALERT_THRESHOLD_USD)
    .order('total_amount', { ascending: false })
    .limit(5)

  if (error) {
    console.error('[cron-telegram-alerts] Error fetching whale data:', error)
    process.exit(1)
  }

  console.log(`[cron-telegram-alerts] Found ${contributions?.length || 0} whale activities`)

  for (const item of contributions || []) {
    const committeeName = item.cr_committees?.name || 'Unknown PAC'
    const politicianName = item.cr_politicians?.name || 'Unknown Candidate'
    const state = item.cr_politicians?.state || 'US'
    const amountFmt = `$${(item.total_amount / 1000000).toFixed(1)}M`

    const message = `
🚨 <b>WHALE ALERT</b> 🚨

💰 <b>Amount:</b> ${amountFmt}
🏦 <b>From:</b> ${committeeName}
🎯 <b>To:</b> ${politicianName} (${state})

<i>Track live donor influence and improve your Polymarket odds.</i>
`
    console.log(`[cron-telegram-alerts] Dispatching alert:\n`, message)

    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHANNEL_ID) {
      try {
        const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHANNEL_ID,
            text: message,
            parse_mode: 'HTML'
          })
        })
        const data = await res.json()
        if (!data.ok) {
          console.error(`[cron-telegram-alerts] Telegram API Error:`, data)
        }
      } catch (err) {
        console.error(`[cron-telegram-alerts] Network error to Telegram API:`, err)
      }
    } else {
      // Simulation mode
      console.log(`[cron-telegram-alerts] Simulated send to Telegram channel`)
    }
  }

  console.log(`[cron-telegram-alerts] Done.`)
}

run().catch(console.error)
