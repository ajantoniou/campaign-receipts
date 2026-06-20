'use server';

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function joinWaitlist(email: string, marketId: string) {
  if (!email || !marketId) {
    return { success: false, error: 'Email and market ID are required.' };
  }

  try {
    // Try to insert into Supabase first
    const { error } = await supabase
      .from('cr_waitlist')
      .insert({ email, market_id: marketId });

    if (error) {
      // If table doesn't exist yet, fallback to local JSON for the prototype
      console.warn("Supabase insert failed, falling back to local JSON:", error.message);
      const filePath = path.join(process.cwd(), 'waitlist.json');
      let waitlist = [];
      if (fs.existsSync(filePath)) {
        waitlist = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      }
      waitlist.push({ email, marketId, timestamp: new Date().toISOString() });
      fs.writeFileSync(filePath, JSON.stringify(waitlist, null, 2));
    }

    return { success: true };
  } catch (err: any) {
    console.error("Waitlist error:", err);
    return { success: false, error: 'Failed to join waitlist.' };
  }
}
