import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const storageReady =
    Boolean(process.env.SUPABASE_URL?.trim()) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim())

  return NextResponse.json({
    status: storageReady ? 'ok' : 'degraded',
  })
}
