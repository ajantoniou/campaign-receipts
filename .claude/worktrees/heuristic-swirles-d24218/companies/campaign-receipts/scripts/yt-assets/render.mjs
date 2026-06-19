#!/usr/bin/env node
// Render YouTube banner + avatar HTML to PNG via Puppeteer.
//
// Outputs:
//   scripts/yt-assets/banner.png   (2048 x 1152, < 6MB target)
//   scripts/yt-assets/avatar.png   (800 x 800, well under 4MB)
//
// Both meet YouTube Studio's upload requirements:
//   Banner: at least 2048x1152, max 6MB
//   Avatar: at least 98x98, PNG or GIF (no animations), max 4MB

import puppeteer from 'puppeteer'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function renderOne({ html, out, width, height }) {
  const browser = await puppeteer.launch({ headless: 'new' })
  const page = await browser.newPage()
  await page.setViewport({ width, height, deviceScaleFactor: 1 })
  await page.goto(`file://${join(__dirname, html)}`, { waitUntil: 'networkidle0' })
  // Ensure web fonts (if any) settle. We use system serif/sans/mono fallbacks
  // so there's nothing to wait for, but give the layout one frame.
  await new Promise((r) => setTimeout(r, 200))
  await page.screenshot({
    path: join(__dirname, out),
    type: 'png',
    omitBackground: false,
    clip: { x: 0, y: 0, width, height },
  })
  await browser.close()
  console.log(`✓ wrote ${out} (${width}x${height})`)
}

await renderOne({ html: 'banner.html', out: 'banner.png', width: 2048, height: 1152 })
await renderOne({ html: 'avatar.html', out: 'avatar.png', width: 800, height: 800 })
console.log('Done.')
