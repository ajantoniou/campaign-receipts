# SEALED digital product — realistic copy protection

**Truth:** A standard **PDF cannot be copy-proof.** Anyone can screenshot, OCR, or forward the file. Strategy is **risk reduction**, **license clarity**, and **buyer-friendly friction**—not fantasy DRM.

---

## What Lemon Squeezy gives you (merchant-of-record)

- **Gated download links** after payment—casual sharing is harder than an open Dropbox.
- **License receipts** tied to purchase email.
- Revoke/reissue support varies by platform policy—document CS playbook don’t promise police action.

---

## Layer 1 — Legal + clear expectations (ship with v1)

- **Terms of Service** (already on site): personal license; no redistribution, resale, or ML training without permission.
- **Inside the PDF:** footer on every chapter spread:

  > Licensed to [buyer email or order ID]. Personal use only. © SEALED Press.

  Implement as part of PDF generation pipeline when building final exports (Mailchimp merge field or LS customer email if tooling supports).

---

## Layer 2 — Soft deterrence (recommended)

| Technique | Effort | Effect |
|-----------|--------|--------|
| **Visible watermark** (email or order short hash on margin) | Low | Stops casual “upload to Telegram” |
| **Per-order filename** e.g. `SEALED-intro-j7k9.pdf` | Low | Trace leaks back to account |
| **Minor quote variants** (optional future): rotate punctuation/spacing in preview-only chunks | High | Not worth it for v1 |

---

## Layer 3 — What we do **not** pretend to do

- **No “uncrackable” DRM** on standard PDF readers—raises support cost and annoys honest buyers.
- **No chasing every pirate**—DMCA for obvious mirrors only if ROI makes sense.

---

## Audiobook / ePub

- **Audio:** Host on LS / podcast-style delivery; discourage bulk rip but assume motivated users can capture audio—same license story.
- **ePub:** Same license block in metadata `dc:rights`.

---

## Escalation

Repeated resale discovered → **account-level** response (disable future purchases per ToS), not public drama.

---

## Decision

**v1:** LS delivery + license text in PDF + optional light watermark when generating finals.  
**v1.1:** Evaluate BookFusion / Vitalsource only if revenue justifies enterprise reader costs.
