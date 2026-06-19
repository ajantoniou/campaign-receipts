#!/usr/bin/env node
// D1 cold-outreach email hand-fill.
//
// IMPORTANT: These email addresses are educated guesses based on each
// outlet's known email pattern (first.last@outlet.com is the dominant
// pattern at NYT, WaPo, Politico, etc). Some will bounce. That's fine —
// bouncing on Resend just tags the message; the next attempt skips them.
//
// We pre-populate ONLY the journalists for the D1 send. Other cohorts
// get filled later with Hunter.io enrichment if D1 reply rates justify
// the $49/mo spend.

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

// Email patterns inferred from each outlet's public records / past
// bylines. Conservative — only fills where the pattern is well-known.
const EMAILS = {
  // Substack (newsletter authors — most have @ contact addresses)
  'Judd Legum': 'judd@popular.info',
  'Aaron Rupar': 'aaron@publicnotice.co',
  'Heather Cox Richardson': 'heathercoxrichardson@substack.com',
  'Robert Reich': 'rbreich@substack.com',
  'Matt Stoller': 'matt@mattstoller.com',

  // Independent / accountability beat
  'Walker Bragman': 'walker@levernews.com',
  'David Sirota': 'david@levernews.com',
  'Lee Fang': 'lee@leefang.com',
  'Anna Massoglia': 'amassoglia@crp.org',
  'Andrew Perez': 'andrew@levernews.com',
  'Donald Shaw': 'don@readsludge.com',
  'Alex Kotch': 'alex@readsludge.com',

  // Major outlets — first.last@domain is the dominant pattern
  'Jane Mayer': 'jane_mayer@newyorker.com',
  'Stephanie Saul': 'stephanie.saul@nytimes.com',
  'Eric Lipton': 'eric.lipton@nytimes.com',
  'Annie Karni': 'annie.karni@nytimes.com',
  'Robert Faturechi': 'robert.faturechi@propublica.org',
  'Justin Elliott': 'justin@propublica.org',
  'Andrew Solender': 'andrew.solender@axios.com',
  'Burgess Everett': 'burgess.everett@semafor.com',
  'Marianna Sotomayor': 'marianna.sotomayor@washpost.com',
  'Olivia Beavers': 'obeavers@politico.com',
  'Sahil Kapur': 'sahil.kapur@nbcuni.com',
  'Manu Raju': 'manu.raju@cnn.com',
  'Lisa Mascaro': 'lmascaro@ap.org',
}

let filled = 0
let skipped = 0
for (const [name, email] of Object.entries(EMAILS)) {
  const { error, data } = await supabase
    .from('cr_outreach_targets')
    .update({ email })
    .eq('display_name', name)
    .is('email', null)
    .select('id')
  if (error) {
    console.log(`  ! ${name}: ${error.message}`)
    skipped++
    continue
  }
  if (data && data.length > 0) {
    console.log(`  ✓ ${name} → ${email}`)
    filled++
  } else {
    skipped++
  }
}
console.log(`\nFilled ${filled} emails, skipped ${skipped}.`)
