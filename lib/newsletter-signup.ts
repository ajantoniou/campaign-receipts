import crypto from 'crypto'

export type NewsletterSource =
  | 'homepage-mid'
  | 'footer'
  | 'politician'
  | 'article'
  | 'bill'
  | 'weekly-page'
  | 'weekly-page'
  | 'pricing'
  | 'market'

export const NEWSLETTER_SOURCES: readonly NewsletterSource[] = [
  'homepage-mid',
  'footer',
  'politician',
  'article',
  'bill',
  'weekly-page',
  'pricing',
  'market',
] as const

type RawNewsletterSignup = {
  email?: unknown
  source?: unknown
  source_slug?: unknown
  website?: unknown
}

export type NewsletterSignup =
  | {
      ok: true
      value: {
        email: string
        source: NewsletterSource
        sourceSlug: string | null
        bot: boolean
      }
    }
  | { ok: false; error: string }

export function isNewsletterSource(source: unknown): source is NewsletterSource {
  return typeof source === 'string' && NEWSLETTER_SOURCES.includes(source as NewsletterSource)
}

export function normalizeNewsletterSignup(raw: RawNewsletterSignup): NewsletterSignup {
  const email = typeof raw.email === 'string' ? raw.email.trim().toLowerCase() : ''
  const source = isNewsletterSource(raw.source) ? raw.source : null
  const sourceSlug =
    typeof raw.source_slug === 'string' && raw.source_slug.trim()
      ? raw.source_slug.trim().slice(0, 120)
      : null
  const website = typeof raw.website === 'string' ? raw.website.trim() : ''

  if (website) {
    return {
      ok: true,
      value: {
        email: email || 'bot@example.invalid',
        source: source || 'homepage-mid',
        sourceSlug,
        bot: true,
      },
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'valid email required' }
  }

  if (!source) {
    return { ok: false, error: 'source required' }
  }

  return {
    ok: true,
    value: {
      email,
      source,
      sourceSlug,
      bot: false,
    },
  }
}

export function newsletterConfirmationToken(email: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(email.toLowerCase(), 'utf8').digest('hex')
}

export function verifyNewsletterConfirmationToken({
  email,
  secret,
  token,
}: {
  email: string
  secret: string
  token: string
}): boolean {
  const expected = newsletterConfirmationToken(email, secret)
  const expectedBuffer = Buffer.from(expected, 'hex')
  const tokenBuffer = Buffer.from(token, 'hex')
  return (
    expectedBuffer.length === tokenBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, tokenBuffer)
  )
}

export function buildConfirmationUrl({
  email,
  baseUrl,
  secret,
  source,
}: {
  email: string
  baseUrl: string
  secret: string
  source: NewsletterSource
}): string {
  const url = new URL('/api/newsletter-signup/confirm', baseUrl)
  url.searchParams.set('email', email.toLowerCase())
  url.searchParams.set('token', newsletterConfirmationToken(email, secret))
  url.searchParams.set('source', source)
  return url.toString()
}

export function newsletterConfirmationEmail(confirmUrl: string) {
  return {
    subject: 'Confirm The Friday Receipt',
    html: `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#faf6ef;color:#241f1a;padding:32px">
<div style="max-width:520px;margin:0 auto;background:#fffaf2;border:1px solid #ded3c2;border-radius:8px;padding:28px">
<div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#756a5d;margin-bottom:12px">CampaignReceipts</div>
<h1 style="font-family:Georgia,serif;font-size:28px;line-height:1.1;margin:0 0 12px;color:#241f1a">Confirm The Friday Receipt</h1>
<p style="margin:0 0 20px;color:#51483e;font-size:15px;line-height:1.6">One email Friday: new donors, donor-moved votes, and donor-moved bills.</p>
<a href="${confirmUrl}" style="display:inline-block;background:#241f1a;color:#faf6ef;text-decoration:none;font-weight:600;font-size:14px;padding:12px 18px;border-radius:999px">Confirm my email</a>
<div style="margin:26px 0 0;padding:16px 18px;background:#f3ecdf;border:1px solid #ded3c2;border-radius:8px">
<div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#9a8f00;font-weight:700;margin-bottom:6px">What members get</div>
<p style="margin:0 0 10px;color:#51483e;font-size:13px;line-height:1.6">You’re on the free list — you’ll get the <strong>headline</strong> trail each week. Members get the <strong>full receipt</strong>: the explained money trail, the workings, and a one-tap link into the donor map — <strong>$9/mo</strong>, cancel anytime.</p>
<a href="${new URL('/pricing', confirmUrl).origin}/pricing" style="display:inline-block;background:#fffaf2;color:#241f1a;border:1px solid #241f1a;text-decoration:none;font-weight:600;font-size:13px;padding:9px 14px;border-radius:999px">See what members get →</a>
</div>
<p style="margin:22px 0 0;color:#756a5d;font-size:12px;line-height:1.6">If the button does not work, paste this into your browser:<br><span style="word-break:break-all">${confirmUrl}</span></p>
</div></body></html>`,
    text: `Confirm The Friday Receipt\n\nOne email Friday: new donors, donor-moved votes, and donor-moved bills.\n\n${confirmUrl}\n\n— What members get —\nYou're on the free list (the weekly headline trail). Members get the full receipt: the explained money trail and a one-tap link into the donor map — $9/mo, cancel anytime: ${new URL('/pricing', confirmUrl).origin}/pricing`,
  }
}
