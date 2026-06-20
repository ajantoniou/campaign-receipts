import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const { error } = await supabase.from('cr_prediction_markets').delete().neq('slug', 'fake-slug-to-delete-all');
  if (error) console.error('Delete error:', error);
  else console.log('Successfully wiped cr_prediction_markets');
}
run();
