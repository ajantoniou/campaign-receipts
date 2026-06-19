import { appendFile, mkdir } from 'fs/promises'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Minimal Web Vitals ingest (step 31). Logs redacted metrics to server stdout;
 * wire to analytics later without blocking launch.
 */
export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const slug = typeof body === 'object' && body !== null && 'pathname' in body
    ? String((body as { pathname?: string }).pathname ?? '')
    : ''

  const receivedAt = new Date().toISOString()
  const record = { pathname: slug, receivedAt, payload: body ?? null }
  void logVitals(record).catch((error) => {
    console.warn('[vitals] log append failed', error)
  })

  console.info('[vitals]', JSON.stringify({ pathname: slug.slice(0, 200), receivedAt }))
  return NextResponse.json({ ok: true })
}

const logDir = path.join(process.cwd(), 'runtime', 'vitals')
const logFile = path.join(logDir, 'vitals.jsonl')

async function logVitals(entry: unknown) {
  await mkdir(logDir, { recursive: true })
  await appendFile(logFile, JSON.stringify(entry) + '\n')
}
