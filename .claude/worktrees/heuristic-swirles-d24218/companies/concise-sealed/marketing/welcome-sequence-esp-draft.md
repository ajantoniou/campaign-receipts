---
Owner: Head of Growth
Persona: head-of-growth
Tracker: SEALED step 39
---

# Welcome Sequence - ESP Draft (Concise SEALED)

Map to ESP fields once the Lemon Squeezy + Mailchimp bridge is live (`eng/MAILCHIMP.md`).

## Email 1 — Immediate (signup)
**Subject lines:**
- You’re on the SEALED early list
- SEALED intro: primary sources, no hot take
**Preview text:** Thanks for joining. The SEALED bundle ships first on Lemon Squeezy verification.
**Goal:** Deliver the promise, reinforce the digital bundle, and invite readers to dig into the methodology.

### HTML
```html
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #111827; font-family: 'Inter', Arial, sans-serif; }
    .email-container { max-width: 640px; margin: 0 auto; background-color: #0b1122; color: #f9fafb; }
    .header { padding: 24px; text-align: center; letter-spacing: 6px; font-size: 18px; font-weight: 600; }
    .body { padding: 32px 36px; line-height: 1.6; }
    .body h1 { font-size: 30px; margin-bottom: 16px; }
    .body p { margin-bottom: 16px; }
    .cta { text-align: center; padding: 24px 0; }
    .cta a {
      text-decoration: none;
      padding: 14px 40px;
      border-radius: 999px;
      background-color: #fbbf24;
      color: #111827;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .footer { padding: 20px 36px 32px; font-size: 11px; color: #9ca3af; text-align: center; }
    .footer a { color: #fbbf24; text-decoration: none; }
  </style>
</head>
<body>
<table class="email-container" width="100%" cellpadding="0" cellspacing="0">
  <tr><td class="header">SEALED</td></tr>
  <tr>
    <td class="body">
      <h1>Primary sources, not commentary.</h1>
      <p>Thanks for joining the SEALED waitlist. We are sending a digital bundle (PDF + ePub + audiobook) built from 2015–2016 transcripts, so you can compare promises vs. delivery in your own time.</p>
      <p>Every quote stays faceless, every claim links to an official record, and the first launch locks in the bundle before the checkout link drops.</p>
      <p>Want to understand the methodology we use to frame each quote? Start with the same appendix we send to early buyers.</p>
    </td>
  </tr>
  <tr>
    <td class="cta">
      <a href="https://concise-sealed.onrender.com/#method">Read the methodology</a>
    </td>
  </tr>
  <tr>
    <td class="footer">
      <p>&copy; 2026 Concise SEALED. All rights reserved.</p>
      <p><a href="https://concise-sealed.onrender.com/privacy">Privacy Policy</a> | <a href="https://concise-sealed.onrender.com/terms">Terms</a> | <a href="[unsubscribe-link]">Unsubscribe</a></p>
    </td>
  </tr>
</table>
</body>
</html>
```

### Plain text

Subject: Thanks for joining SEALED 🚨  
Preview: Primary sources. No hot take.  

```
Hi {{first_name|default:"reader"}},

Thanks again for joining SEALED. The launch ships as a digital bundle: PDF + ePub + audiobook. Every quote stays traced to 2015–2016 sources so you can weigh promise vs. delivery yourself.

When we go live, Lemon Squeezy will send your download link. In the meantime, read how we frame the quotes:
https://concise-sealed.onrender.com/#method

Concise SEALED | https://concise-sealed.onrender.com | Unsubscribe: [unsubscribe-link]
```

## Email 2 — Value / proof (D+3)
**Subject lines:**
- What “primary source” means here
- SEALED samples: debates, transcripts, citations
**Preview text:** Every quote ties back to real transcripts. Sample the PDF before checkout.
**Goal:** Highlight that SEALED is archival text and point to the reading sample.

### HTML
```html
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #0f172a; font-family: 'Inter', Arial, sans-serif; }
    .email-container { max-width: 640px; margin: 0 auto; background-color: #0f172a; color: #e2e8f0; }
    .header { padding: 24px; text-align: center; font-size: 18px; letter-spacing: 4px; }
    .body { padding: 32px 36px; }
    .body h1 { font-size: 28px; margin-bottom: 12px; color: #fbbf24; }
    .body p { margin-bottom: 16px; }
    .quote { background: #111827; border-left: 4px solid #fbbf24; padding: 16px; font-style: italic; margin-bottom: 16px; }
    .cta { text-align: center; padding: 16px 0; }
    .cta a {
      padding: 14px 40px;
      border-radius: 999px;
      background: #111827;
      border: 1px solid #fbbf24;
      color: #fbbf24;
      font-weight: 600;
      text-decoration: none;
    }
    .footer { padding: 20px 36px 32px; font-size: 11px; color: #9ca3af; text-align: center; }
    .footer a { color: #fbbf24; text-decoration: none; }
  </style>
</head>
<body>
<table class="email-container" width="100%" cellpadding="0" cellspacing="0">
  <tr><td class="header">SEALED</td></tr>
  <tr>
    <td class="body">
      <h1>Primary sources only.</h1>
      <div class="quote">
        “SEALED isn’t commentary—it is time-capsule text from 2015–2016 with every quote footnoted to transcripts and debates.”
      </div>
      <p>If you want the same fidelity before checkout, download the sample PDF and see how we present context, citations, and the questions we leave open.</p>
      <p>This is the same email we plan to send with every Spotlight quote, no editorial spin—just the evidence you asked for.</p>
    </td>
  </tr>
  <tr>
    <td class="cta">
      <a href="https://concise-sealed.onrender.com/sample">Download the sample PDF</a>
    </td>
  </tr>
  <tr>
    <td class="footer">
      <p>&copy; 2026 Concise SEALED. All rights reserved.</p>
      <p><a href="https://concise-sealed.onrender.com/privacy">Privacy Policy</a> | <a href="https://concise-sealed.onrender.com/terms">Terms</a> | <a href="[unsubscribe-link]">Unsubscribe</a></p>
    </td>
  </tr>
</table>
</body>
</html>
```

### Plain text

Subject: What “primary source” means here  
Preview: Debates, transcripts, citations.  

```
Hi {{first_name|default:"reader"}},

SEALED isn’t commentary—it is time-capsule text from 2015–2016 with every quote tied to an official record. If you want to see the format before checkout, download the sample PDF:
https://concise-sealed.onrender.com/sample

Concise SEALED | https://concise-sealed.onrender.com | Unsubscribe: [unsubscribe-link]
```

## Email 3 — Launch / urgency (checkout live)
**Subject lines:**
- SEALED is open — your download link
- The SEALED bundle is available now
**Preview text:** The digital bundle is live. Your checkout link is ready, with a 30-day refund window.
**Goal:** Share the Lemon Squeezy checkout URL, remind readers of the bundle, and mention refund window.

### HTML
```html
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #0b1122; font-family: 'Inter', Arial, sans-serif; }
    .email-container { max-width: 640px; margin: 0 auto; background-color: #0b1122; color: #f9fafb; }
    .header { padding: 24px; text-align: center; letter-spacing: 6px; font-size: 18px; }
    .body { padding: 32px 36px; }
    .body h1 { font-size: 30px; margin-bottom: 12px; }
    .body p { margin-bottom: 18px; }
    .cta { text-align: center; padding: 16px 0 28px; }
    .cta a {
      padding: 16px 44px;
      border-radius: 999px;
      background: #fbbf24;
      color: #0b1122;
      font-weight: 600;
      text-decoration: none;
    }
    .footer { padding: 20px 36px 32px; font-size: 11px; color: #9ca3af; text-align: center; }
    .footer a { color: #fbbf24; text-decoration: none; }
  </style>
</head>
<body>
<table class="email-container" width="100%" cellpadding="0" cellspacing="0">
  <tr><td class="header">SEALED</td></tr>
  <tr>
    <td class="body">
      <h1>The bundle is live.</h1>
      <p>Checkout is open and your download link is ready. Buy the SEALED bundle (PDF + ePub + audiobook) with the same 30-day Lemon Squeezy refund policy we always honor. Your supporting page includes the sample, methodology, and reminder that every quote remains faceless.</p>
      <p>Use the link below or the bundle link from `lib/checkout-urls.ts` if you prefer the two-book package.</p>
    </td>
  </tr>
  <tr>
    <td class="cta">
      <a href="https://demiurgiclabs.lemonsqueezy.com/checkout/buy/sealed-standard">Go to checkout</a>
    </td>
  </tr>
  <tr>
    <td class="footer">
      <p>&copy; 2026 Concise SEALED. All rights reserved.</p>
      <p><a href="https://concise-sealed.onrender.com/privacy">Privacy Policy</a> | <a href="https://concise-sealed.onrender.com/terms">Terms</a> | <a href="[unsubscribe-link]">Unsubscribe</a></p>
    </td>
  </tr>
</table>
</body>
</html>
```

### Plain text

Subject: SEALED is open — your download link  
Preview: Bundle + audiobook inside.  

```
Hi {{first_name|default:"reader"}},

The SEALED bundle (PDF + ePub + audiobook) is now available. Checkout uses Lemon Squeezy’s standard refund window (30 days). Use this link to land on the download immediately:
https://demiurgiclabs.lemonsqueezy.com/checkout/buy/sealed-standard

Want the bundle + extras? Swap to the bundle link in `lib/checkout-urls.ts`.

Concise SEALED | https://concise-sealed.onrender.com | Unsubscribe: [unsubscribe-link]
```
