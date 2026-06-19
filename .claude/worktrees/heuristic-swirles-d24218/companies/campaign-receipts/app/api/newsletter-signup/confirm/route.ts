import { NextRequest, NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase'
import { verifyNewsletterConfirmationToken } from '@/lib/newsletter-signup'

export const dynamic = 'force-dynamic'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://campaignreceipts.com'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const email = (url.searchParams.get('email') || '').trim().toLowerCase()
  const token = url.searchParams.get('token') || ''
  const secret = process.env.NEWSLETTER_CONFIRM_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!email || !token || !secret) {
    return NextResponse.redirect(new URL('/weekly?newsletter=invalid', SITE), 302)
  }

  const valid = verifyNewsletterConfirmationToken({ email, token, secret })
  if (!valid) {
    return NextResponse.redirect(new URL('/weekly?newsletter=invalid', SITE), 302)
  }

  const { error } = await supabaseService
    .from('cr_free_subscribers')
    .update({ confirmed_at: new Date().toISOString(), unsubscribed_at: null })
    .eq('email', email)

  if (error) {
    console.error('newsletter confirmation failed:', error.message)
    return NextResponse.redirect(new URL('/weekly?newsletter=error', SITE), 302)
  }

  return NextResponse.redirect(new URL('/weekly?newsletter=confirmed', SITE), 302)
}
