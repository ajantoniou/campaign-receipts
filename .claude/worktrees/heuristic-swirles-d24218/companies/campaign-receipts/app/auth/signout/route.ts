import { NextResponse } from 'next/server'
import { clearSessionCookie } from '@/lib/auth'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://campaignreceipts.com'

export async function POST() {
  clearSessionCookie()
  return NextResponse.redirect(new URL('/', SITE), 302)
}

export async function GET() {
  clearSessionCookie()
  return NextResponse.redirect(new URL('/', SITE), 302)
}
