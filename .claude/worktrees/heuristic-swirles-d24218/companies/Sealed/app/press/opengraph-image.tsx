import fs from 'node:fs/promises'
import path from 'node:path'

export const alt = 'SEALED — The 2024 Trump platform was removed. We saved every word.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// The default Next.js OG file convention: return a Response with the
// pre-rendered PNG bytes. We render this card via Puppeteer in
// `scripts/build-press-release.mjs` (committed to public/press/) so the
// runtime cost here is a static file read.
export default async function PressOpenGraphImage() {
  const buf = await fs.readFile(
    path.join(process.cwd(), 'public', 'press', 'og-press-launch.png'),
  )
  return new Response(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
