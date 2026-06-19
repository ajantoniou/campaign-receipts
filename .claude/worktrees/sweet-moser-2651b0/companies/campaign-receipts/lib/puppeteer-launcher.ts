/**
 * Cross-environment Puppeteer launcher.
 *
 * - Local dev (macOS / Linux desktop): uses `puppeteer` (bundled Chromium).
 * - Production (Render Node runtime — no system Chromium): uses
 *   `puppeteer-core` driven by `@sparticuz/chromium` for a serverless-
 *   compatible binary.
 *
 * Detection: any non-vercel/render production env is treated as bundled-Chromium
 * (NODE_ENV !== 'production' OR running locally with VERCEL/RENDER unset).
 * On Render the env var `RENDER` is set to `true` automatically, which we use
 * as the deterministic signal to switch to serverless mode.
 *
 * Usage:
 *   import { launchBrowser } from '@/lib/puppeteer-launcher'
 *   const browser = await launchBrowser()
 *   try { ... } finally { await browser.close() }
 */
import type { Browser } from 'puppeteer-core'

const SHARED_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
]

export async function launchBrowser(): Promise<Browser> {
  // Render sets RENDER=true. We could also key on VERCEL/AWS_LAMBDA_*; in
  // practice this app only deploys to Render, so one signal is enough.
  const isServerless =
    process.env.RENDER === 'true' ||
    process.env.NODE_ENV === 'production'

  if (isServerless) {
    // Dynamic import so the local-dev path doesn't have to load the
    // serverless-chromium module (it tarballs a ~50MB binary).
    //
    // @sparticuz/chromium v148 exports a `Chromium` class as the default,
    // with static `args` (getter → string[]) and `executablePath()` (async)
    // members. v148 removed the `headless` property — pass `'shell'`
    // explicitly per the upstream README example.
    const chromiumMod = await import('@sparticuz/chromium')
    const puppeteerCore = await import('puppeteer-core')
    const chromium = chromiumMod.default
    const execPath = await chromium.executablePath()
    return puppeteerCore.default.launch({
      args: [...chromium.args, ...SHARED_ARGS],
      executablePath: execPath,
      headless: 'shell',
    }) as unknown as Browser
  }

  // Local dev — full puppeteer with bundled Chromium.
  const puppeteer = (await import('puppeteer')).default
  return puppeteer.launch({
    args: SHARED_ARGS,
  }) as unknown as Browser
}
