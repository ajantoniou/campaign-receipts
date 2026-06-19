# VotingCitizen trial disclosure — SEALED thank-you copy

 **Context:**  
 Concise issue `CON-167 / SEAL-005` asks us to surface the optional **1-month VotingCitizen newsletter + dashboard trial** on the SEALED Lemon Squeezy thank-you/confirmation experience while making it explicit that the perk is a **separate service** and not bundled into the SEALED file deliverable. Lemon Squeezy has no native “partner perk” field, so we rely on the post-purchase redirect + follow-up messaging to keep the offer transparent and compliant.

 ---

 ## 1. Lemon Squeezy validation

 - The platform explicitly encourages rentention-friendly redirects in its creator guidance: see `shared/knowledge/ls-creators-guide-insights.md` §2 (“Redirect After Purchase”) which lists thanking the customer, asking for a share, and surfacing newsletter upsells as best practices. That same section confirms redirects are built for downstream offers as long as you do not mislead the customer.
 - Our paired perk obeys the compliance trigger by (1) keeping the VotingCitizen offer off the SEALED product listing (no change to price/files), (2) presenting it immediately after purchase via the `/thank-you` page, and (3) using a **second, separate email from VotingCitizen** to activate the trial. Lemon Squeezy still owns the financial transaction, while VotingCitizen owns the trial activation, so there is no deception about what the buyer paid for.
 - We do **not** pass purchase data from Lemon Squeezy to VotingCitizen beyond the email address included in the post-purchase flow (the same address the buyer intentionally typed), and VotingCitizen handles any additional opt-in/out requirements. This keeps the perk within the “optional disclosure” framework that Lemon Squeezy’s merchant terms allow when the customer is fully informed and the main product is delivered as advertised.

 ## 2. Audience fit (positioning)

 The trial is aimed at readers who want **hyperlocal or civic signal** — people who vote for or follow **their** mayor, council, state senator, or other officials and want to stay ahead of what those offices touch — and readers with **strong issue commitments** who want a consistent read on **federal or cross-state legislation** in lanes they care about (examples: abortion access, gun rights, climate, education). It is **not** described as a substitute for SEALED’s primary-source archive.

 ---

 ## 3. Copy + activation cues

 ### Thank-you page copy (mirror of `app/thank-you/page.tsx`)

 > Optional VotingCitizen block: separate civic briefing for readers who want hyperlocal or national legislative signal (elected officials they follow, or issue-focused legislation). Look for a follow-up from VotingCitizen with the activation link — opt-in only; SEALED files remain with Lemon Squeezy either way. Full wording lives in `app/thank-you/page.tsx`.

 ### Suggested VotingCitizen follow-up email stub

 > Subject: “Your VotingCitizen 1-month trial—activate it now”  
 > Body (short version): “Thanks for buying SEALED. Optional: activate a 1-month VotingCitizen hyperlocal + legislative briefing trial — built for people who want to stay in the know because they elect local or state officials, or who track national legislation on issues they care about. Click [activate link]. No charge for the trial month; unsubscribe any time. Ignore this if you only wanted SEALED — your download stays in Lemon Squeezy.”

 The CTA in this email should point to the VotingCitizen `/subscribe` form (or a Resend-powered link) so the customer explicitly consents to join the VotingCitizen list. The email should mention that the trial is separate from the SEALED purchase.

 ---

 ## 4. Operational handoffs

 - **CTO:** Ensure Lemon Squeezy’s “redirect after purchase” points to `https://sealed-press.onrender.com/thank-you` (or the Render domain in use) and that the webhook / support mail routing (existing `/api/lemon-squeezy/webhook`) remains unchanged. This page is where the customer sees the partner disclosure. If the thank-you URL changes, update the `metadata` on this doc and slack the change.
 - **CTO + Legal:** If you add any additional LS variants (bundle, discount, etc.), double-check that the VotingCitizen copy still appears on the redirect. The optional trial should not mention any discount codes or gating mechanics for SEALED itself.
 - **Head of Growth:** Keep this doc updated if the offer structure shifts (different partner, multi-month trial, paywall). Mention the change in the next `SESSION_DECISIONS.md` entry under the “VotingCitizen at checkout” section.

 ---

 ## 5. Compliance reminder

 - The VotingCitizen trial is a voluntary enhancement, not a condition of purchase. We keep the redemption + access instructions separate from the SEALED SKU so that Lemon Squeezy sees only the digital product you paid for.
 - Privacy details for the SEALED purchase still live at `/privacy`; mention the partner offer there if you later expand it (e.g., “Sometimes we point buyers to VotingCitizen—see the optional trial section for more on how we handle that data”). For now, the thank-you copy links to `/privacy` and the partner’s site.

 ---

 ## Next steps

 - [ ] CTO confirms the thank-you redirect and email wiring (once the trial path is live, update this doc with the actual VotingCitizen activation link).
 - [ ] Legal reviews the follow-up email to ensure the “optional partner perk” language stays within Lemon Squeezy’s merchant terms.
 - [ ] Head of Growth collects a screenshot of the thank-you page with the partner copy for the sprint report / `SESSION_DECISIONS.md` entry.
