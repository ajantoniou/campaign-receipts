// Suppress automated WordPress scanner 404 noise from the Render logs.
// /wp-admin/install.php (and similar PHP install paths) get continuously
// probed by attempted-exploit bots. Next.js's default 404 is the right
// response but it floods the log feed.
//
// This middleware short-circuits known scanner paths with a small 404
// body, no-store cache, and an early return so Render's request log
// still records them but the response is minimal.

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Paths that are 100% scanner traffic for a non-WordPress site.
const SCANNER_PATHS = [
  /^\/wp-admin\//i,
  /^\/wp-login\.php/i,
  /^\/wp-content\//i,
  /^\/wp-includes\//i,
  /^\/xmlrpc\.php/i,
  /^\/wordpress\//i,
  /^\/wp\//i,
  /\.php(\?|$)/i,        // any .php request
  /^\/\.env/i,           // env-file probes
  /^\/\.git\//i,         // git-dir probes
  /^\/phpmyadmin\//i,
  /^\/phpinfo\.php/i,
]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (SCANNER_PATHS.some((rx) => rx.test(pathname))) {
    return new NextResponse(null, {
      status: 404,
      headers: { 'cache-control': 'no-store' },
    })
  }
  return NextResponse.next()
}

export const config = {
  // Run on all paths except _next assets and the favicon.
  matcher: ['/((?!_next/|favicon|api/).*)'],
}
