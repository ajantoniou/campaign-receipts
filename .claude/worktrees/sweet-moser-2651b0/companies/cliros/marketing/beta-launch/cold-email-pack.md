# Cliros Beta Launch — Cold Email Pack

**Audience:** Georgia real estate closing attorneys (solo + small firm).
**Cohort goal:** 25-50 attorneys, ~5 reports each = 125-250 real-world QC runs.
**Ask:** One line of feedback per report. No money.
**Why now:** Persona QC pipeline + property imagery just shipped (see `companies/cliros/supabase/migrations/20260522_persona_pipeline.sql` and `20260523_beta_feedback.sql`). The thing works end-to-end on real GA files for ~$2 in API spend per report.

---

## Hero asset (already captured + hosted)

A live screenshot of the dashboard report page is the single strongest social proof — it shows:
1. The property's Street View + parcel map (top of report)
2. The QC chain pills (`✓ Chain 10 · ✓ Liens 10 · ✓ Defects 10 · ✓ AOL 10`)
3. The four download buttons (Title Search Report, Client Report, AOL, Raw Source Data)
4. AI spend ($2.54) — proves it's a real run, not a mockup

**Public URL (use this verbatim in the `{{hero_url}}` slot of HTML emails):**

```
https://jivahkfdkduxasnzpzgx.supabase.co/storage/v1/object/public/cliros-marketing/beta-launch/hero-dashboard.png
```

The image is also checked in at `marketing/beta-launch/hero-dashboard.png`.

**Re-capture (whenever you want a fresher property):**

```bash
cd companies/cliros/app
source ../../../.env
npx tsx scripts/capture_hero_image.ts                                # latest ready report
npx tsx scripts/capture_hero_image.ts <report_id>                    # specific report
```

The script signs in as alex@antoniou.net via a Supabase admin magic link, navigates to a real
report, screenshots the imagery + QC pills + header + deliverables, and uploads to the public
`cliros-marketing` bucket. Headless, no manual steps.

---

## Subject line variants (split test in Instantly)

A. `Free during beta: title search + AOL in under 5 minutes (GA)`
B. `Built a title engine for GA closers — want to break it for me?`
C. `60 seconds: would this save your firm 10 hours a week?`

(A is the safe pick — it leads with "free" and the geography. B is curiosity bait. C is a value-prop hook.)

---

## Email 1 — Day 1 (initial invite)

**Subject:** `{{subject}}`

```
Hi {{first_name}},

I'm Alex — I built Cliros, a title engine for Georgia closing attorneys. Full GSCCCA chain, judgment / tax / federal lien search, AND a Fannie Mae B7-2-06 compliant AOL draft — under 5 minutes per file.

[HERO IMAGE: hero-dashboard.png]
(live dashboard, real Atlanta property — every box is QC'd by 4 AI specialists before delivery)

We just opened a small beta cohort. I'd love for you to run a few of your real files through it — free, no card, no cap — and tell me what's missing or wrong.

The trade: one line of feedback after each report. There's a thumbs-up/thumbs-down + comment box right in the dashboard; goes straight to my inbox.

Goal at launch: 10x your closing throughput, cut abstractor cost up to 80%. We only get there if you tell me what's still off.

→ cliros.ai/signup
(Use the code BETA-{{first_name_lower}} on the signup screen so I can attribute your feedback.)

Or just reply with one address and I'll run it tonight, free.

Alex
alex@cliros.ai · (404) xxx-xxxx
```

**HTML version** (Instantly will paste this as raw HTML):

```html
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#0f172a;max-width:580px;">
  <p>Hi {{first_name}},</p>
  <p>I'm Alex — I built <strong>Cliros</strong>, a title engine for Georgia closing attorneys. Full GSCCCA chain, judgment / tax / federal lien search, AND a Fannie Mae B7-2-06 compliant AOL draft — under 5 minutes per file.</p>
  <p style="margin:18px 0;">
    <img src="https://jivahkfdkduxasnzpzgx.supabase.co/storage/v1/object/public/cliros-marketing/beta-launch/hero-dashboard.png" alt="Cliros dashboard — real Atlanta title report with QC chain"
         style="display:block;width:100%;max-width:580px;border-radius:8px;border:1px solid #e2e8f0;" />
    <span style="display:block;font-size:12px;color:#64748b;margin-top:6px;text-align:center;">
      Live dashboard — every box QC'd by 4 AI specialists before delivery ($2.54 in compute per run)
    </span>
  </p>
  <p>We just opened a <strong>small beta cohort</strong>. I'd love for you to run a few of your real files through it — free, no card, no cap — and tell me what's missing or wrong.</p>
  <p>The trade: one line of feedback after each report. There's a thumbs-up/down + comment box right in the dashboard; goes straight to my inbox.</p>
  <p>Goal at launch: <strong>10x your closing throughput, cut abstractor cost up to 80%</strong>. We only get there if you tell me what's still off.</p>
  <p style="margin:22px 0;">
    <a href="https://cliros.ai/signup?ref=BETA-{{first_name_lower}}"
       style="background:#0f172a;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600;">
      Request beta access →
    </a>
  </p>
  <p style="font-size:13px;color:#64748b;">
    Or just reply with one address and I'll run it tonight, free.
  </p>
  <p style="margin-top:24px;">
    Alex<br/>
    <span style="font-size:13px;color:#64748b;">alex@cliros.ai</span>
  </p>
</div>
```

---

## Email 2 — Day 4 (single follow-up)

**Subject:** `Re: Free beta access — Cliros title engine`

```
Hi {{first_name}},

Quick follow-up. A few attorneys ran files this week and the feedback's been gold — we shipped two engine fixes in 24 hours based on what they flagged.

Door's still open: cliros.ai/signup — free, no card.

One real file is enough to tell. Reply with an address and I'll have a report on your desk before COB.

Alex
```

---

## Email 3 — Day 7 (closing the cohort)

**Subject:** `Closing the beta cohort this week`

```
Hi {{first_name}},

Last nudge — closing the first beta cohort Friday. Beta testers lock in introductory pricing when we exit preview (launch is $200/report; testers get a meaningful discount).

If you want to try it before the door closes: cliros.ai/signup

What you get, free during beta:
• Full chain of title (50 years)
• Judgment + tax lien + federal record search
• Fannie Mae B7-2-06 compliant AOL draft
• Plain-English homeowner summary
• All four documents, one screen, under 5 minutes

Only ask is one line of honest feedback per report.

Alex
```

---

## Send mechanics

1. **List**: GA Bar real estate section directory or LinkedIn search for "real estate attorney" + "Atlanta" / "Marietta" / "Savannah" — start with 30 names. Quality > quantity at this stage.
2. **Sending domain**: cliros.ai must be SPF/DKIM/DMARC authenticated before sending (check `dig` records). Sender = `alex@cliros.ai` (forwards inbound to `antonioualfred-cliros@gmail.com`). Replies will land in the gmail forwarder, same place beta feedback notifications go.
3. **Inbox warmup**: Instantly's built-in warmup must run for 7-14 days before cold sending, or use the LinkedIn DM channel instead.
4. **Cap**: 30 sends/day per inbox to stay out of spam folders.

## Tracking

- Signup attribution: the email contains `?ref=BETA-{{first_name_lower}}` and a code `BETA-{{first_name_lower}}`. We log the `ref` query param on signup → `users.signup_ref`.
- Feedback attribution: every feedback submission emails Alex with the user's email + property address + rating + comment.
- Daily review: read every feedback email, ship one engine fix that day, send a personal reply.

## What "good" looks like in 7 days

- 5+ attorneys signed up
- 15+ real reports run
- 5+ feedback submissions (positive or negative — both are useful)
- 1+ "this would actually save me time" reply → ask for a 20-min call
- Engine fixes shipped: 3-5 based on feedback themes

If after 7 days we have zero feedback, the problem isn't the engine — it's the email. Rewrite subject lines and try again.
