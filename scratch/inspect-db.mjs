import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspect() {
  console.log('--- RACES ---')
  const { data: races } = await supabase.from('cr_races').select('id, slug, headline, is_active').limit(5)
  console.log(races)

  console.log('--- BILLS ---')
  const { data: bills } = await supabase.from('cr_bills').select('id, congress, bill_type, bill_number, title, short_title').limit(5)
  console.log(bills)

  console.log('--- POLITICIANS ---')
  const { data: pols } = await supabase.from('cr_politicians').select('id, slug, name, party, state, branch').limit(5)
  console.log(pols)
}

inspect().catch(console.error)
