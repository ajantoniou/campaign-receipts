const GAMMA = 'https://gamma-api.polymarket.com'
const POLITICS_TAG = 'politics'

async function fetchPoliticsEvents() {
  const url = `${GAMMA}/events?closed=false&limit=30&order=volume&ascending=false&tag_slug=${POLITICS_TAG}`
  console.log(`Fetching from: ${url}`)
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) {
    console.error('Failed to fetch:', res.statusText)
    return
  }
  const events = await res.json()
  console.log(`Fetched ${events.length} events`)
  for (const ev of events.slice(0, 10)) {
    console.log(`\nEvent: ${ev.title} (slug: ${ev.slug}, id: ${ev.id})`)
    const subs = ev.markets || []
    console.log(`Markets count: ${subs.length}`)
    for (const m of subs.slice(0, 3)) {
      console.log(`  Market Question: ${m.question}`)
      console.log(`  Outcomes: ${m.outcomes}`)
      console.log(`  Outcome Prices: ${m.outcomePrices}`)
      console.log(`  Volume: ${m.volume}`)
    }
  }
}

fetchPoliticsEvents().catch(console.error)
