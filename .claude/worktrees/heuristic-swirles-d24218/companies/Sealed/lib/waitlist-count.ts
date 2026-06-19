import { createClient } from '@supabase/supabase-js'

/** Exact row count using service role — server-only (`public.email_subscribers`). */
export async function getWaitlistCount(): Promise<number | null> {
  const url = process.env.SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) return null

  try {
    const supabase = createClient(url, key)
    const { count, error } = await supabase
      .from('email_subscribers')
      .select('*', { count: 'exact', head: true })
    if (error) {
      console.warn('[waitlist]', 'count unavailable', error.message)
      return null
    }
    return typeof count === 'number' ? count : null
  } catch (e) {
    console.warn('[waitlist]', e instanceof Error ? e.message : 'count threw')
    return null
  }
}
