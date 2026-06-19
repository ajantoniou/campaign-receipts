// Resend wrapper. Single sender domain (campaignreceipts.com is
// verified per founder). All transactional + outreach mail flows
// through here so we have one retry/log path.

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const FROM_AUTH = 'CampaignReceipts <auth@campaignreceipts.com>'
const FROM_TEAM = 'CampaignReceipts <hello@campaignreceipts.com>'
// Default Reply-To for human-correspondence ("team") mail — auto-replies
// to positive journalist replies, custom-pull responses, etc. Routes to
// founder's Gmail via +campaignreceipts alias. Auth mail (magic links)
// intentionally has no Reply-To since users shouldn't reply to it.
const REPLY_TO_TEAM = 'antonioualfred+campaignreceipts@gmail.com'

export type SendArgs = {
  to: string
  subject: string
  html: string
  text?: string
  from?: 'auth' | 'team'
  replyTo?: string
  tags?: { name: string; value: string }[]
}

export type SendResult = { ok: true; id: string } | { ok: false; error: string }

export async function sendMail(args: SendArgs): Promise<SendResult> {
  if (!RESEND_API_KEY) return { ok: false, error: 'RESEND_API_KEY missing' }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: args.from === 'team' ? FROM_TEAM : FROM_AUTH,
      to: [args.to],
      subject: args.subject,
      html: args.html,
      text: args.text,
      // Explicit replyTo wins; otherwise team mail routes to founder's
      // Gmail via +alias and auth mail has no reply-to.
      reply_to: args.replyTo ?? (args.from === 'team' ? REPLY_TO_TEAM : undefined),
      tags: args.tags,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 200)}` }
  }
  const json = (await res.json()) as { id?: string }
  return { ok: true, id: json.id || '' }
}

export function magicLinkEmail(verifyUrl: string) {
  return {
    subject: 'Sign in to CampaignReceipts',
    html: `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#0a0a0a;color:#e7e7e7;padding:32px">
<div style="max-width:480px;margin:0 auto;background:#141414;border:1px solid #262626;border-radius:12px;padding:32px">
<div style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#a3a3a3;margin-bottom:12px">CampaignReceipts</div>
<h1 style="font-size:20px;font-weight:600;margin:0 0 12px;color:#fafafa">Sign in</h1>
<p style="margin:0 0 24px;color:#a3a3a3;font-size:14px;line-height:1.6">Click the link below to sign in. It expires in 30 minutes.</p>
<a href="${verifyUrl}" style="display:inline-block;background:#f59e0b;color:#0a0a0a;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:8px">Sign in →</a>
<p style="margin:24px 0 0;color:#525252;font-size:12px;line-height:1.6">If the button doesn't work, paste this into your browser:<br><span style="color:#737373;word-break:break-all">${verifyUrl}</span></p>
</div></body></html>`,
    text: `Sign in to CampaignReceipts\n\n${verifyUrl}\n\nLink expires in 30 minutes.`,
  }
}
