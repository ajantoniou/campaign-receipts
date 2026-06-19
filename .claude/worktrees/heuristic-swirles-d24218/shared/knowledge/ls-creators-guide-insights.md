# Lemon Squeezy Creator's Guide — Extracted Insights
**Source:** `shared/knowledge/ls-creators-guide-2024.pdf` (22 pages, Lemon Squeezy 2024)
**Extracted:** 2026-05-04 by Chief of Staff
**Applies to:** Concise (primary), Campaign Receipts, NT Ministry

---

## 1. Product strategy insights

### Digital products: the core value proposition
- Created once, sold indefinitely — no marginal cost per unit
- Higher profit margins than physical goods
- Grow audiences AND generate revenue simultaneously
- The best educational products make the reader feel they've been given a shortcut

### "Think like a beginner" framework (directly applicable to Concise)
When creating educational products, ask:
- What are the invaluable lessons you wish someone had told you when starting out?
- What was a time/money saver you discovered that was game-changing?
- What tips helped you earn more money? What didn't work and cost you money?

**→ Concise application:** The SEALED book should answer "what do you wish you'd known about these promises before they were broken?" Frame it as insider knowledge the reader can't get from a Google search.

### Membership / subscription upsell path
- One-time PDF sale → newsletter subscription → membership with premium access
- Memberships bundle ongoing value: new monthly content + community + access
- As membership grows, add value that retains current AND attracts new members

**→ Campaign Receipts application:** Free newsletter → Patreon ($2/wk Basic, $5/wk Premium) → eventual "members get the monthly deep-dive PDF" bundle. This is exactly the right sequence.

**→ NT Ministry application:** Free YouTube → Patreon supporter → eventual course or study guide bundle.

### Downloadable product design principle
Two valid reasons to buy a downloadable:
1. Saves time or money on a common problem
2. Enables something outside the buyer's skill set

**→ SEALED framing:** The book saves the buyer the 40 hours it would take to research all 25 promises themselves. That's the pitch.

---

## 2. Lemon Squeezy platform: operational best practices

### Product setup checklist (for CON-25 founder action)
1. **Name + Description** — 120-160 characters for description (SEO sweet spot). Focus on value, not features.
2. **Pricing** — Set initial price; can always change later to test higher/lower. LS supports both one-time and subscription pricing on same product via variants.
3. **Media** — Up to 10 images on product page. Use to tell the product story visually (cover, sample pages, table of contents screenshot).
4. **Files** — Up to 5GB of files per product. Add bonus resources alongside main PDF to delight customers and drive repeat purchases.
5. **Variants** — Use for different price tiers ($22 standard / $27 bundle). Each variant can have different files.
6. **Redirect After Purchase** — Set a thank-you page URL on our own site. Use this for: upsell to newsletter, upsell to Patreon, social proof ask ("share your copy").
7. **Publish** — Save as draft first; publish when files + images + redirect are all set.

### Two distribution modes (CTO needs to wire both for SEALED)
1. **Direct checkout link** — `https://my.lemonsqueezy.com/checkout/buy/{variant_id}` — use everywhere: social, email, Reddit, newsletter CTA
2. **Checkout overlay** — Embed snippet on our own landing page (sealed-press.onrender.com). Customer purchases without leaving the site. Copy-paste, no code needed.

**→ CON-25 CTO task:** After founder creates product + gets variant IDs, CTO should wire BOTH — the buy button on the landing page should use the overlay embed, not a redirect. Keeps conversion on our domain.

### "Redirect After Purchase" — underused growth lever
After purchase, send customer to a page that:
- Thanks them
- Asks for a share / tweet
- Surfaces the newsletter signup (if they bought without subscribing first)
- Optionally upsells the $27 bundle if they bought $22

**→ Issue needed:** CTO to build `/thank-you` page on sealed-press that does the above.

### License keys (future feature)
LS can issue license keys with expiry and activation limits — relevant if Concise later ships software tools or templated research subscriptions. Not needed now but worth knowing.

---

## 3. GTM / marketing insights

### You don't need a website to start selling
LS checkout link works standalone — post directly to Reddit, Twitter, email. The landing page is a conversion enhancer, not a prerequisite.

**→ Sales Agent can start Reddit organic seeding with just the checkout link. Don't wait for landing page perfection.**

### Checkout link = universal CTA
Use LS checkout link as the CTA in:
- Reddit posts / comments
- Newsletter welcome email
- Lead-magnet thank-you page
- YouTube description (NT Ministry future: study guide)
- Email drip sequence

### Discount codes as growth tool
LS supports discount codes natively. Use for:
- Launch week promo ("LAUNCH20" for 20% off first 48 hours)
- Reddit exclusives ("REDDIT10" to track that channel's conversion)
- Affiliate / partner codes (if we partner with political newsletters)

**→ Issue needed:** Concise Sales Agent should plan a launch-week discount code strategy.

---

## 4. Issues / tasks to create (see companion issue list)

| Issue | Company | Assignee | Priority |
|---|---|---|---|
| CON-25 follow-up: wire checkout overlay (not redirect) on landing page | Concise | CTO | high |
| CON-new: Build /thank-you page with upsell + share ask + newsletter capture | Concise | CTO | high |
| CON-new: Sales Agent launch-week discount code strategy (LAUNCH + channel-specific codes) | Concise | Sales Agent | medium |
| CON-new: Add 3-5 product images to LS listing (cover + sample page + TOC) | Concise | Book Illustrator | medium |
| CR-new: Wire LS checkout link into welcome email drip and lead-magnet PDF | Campaign Receipts | CTO | medium |
| NTM-future: When first study guide ships, use LS for delivery | NT Ministry | CEO | low |

---

## 5. Quotes worth keeping (for founder context)

- "The reader isn't looking for something they can find in a quick Google search. They sought you out because they want to know your insights, successes, and failures."
- "These kinds of delightful surprises [bonus resources] can turn one-time customers into repeat customers."
- "You can use this link on Facebook, Instagram, Twitter, Pinterest, and more. Basically, anywhere you can add a link can be turned into a sales funnel."
- "You don't necessarily need your own website to start making money."

---

*This file lives in `shared/knowledge/` — all CTOs, Sales Agents, and CEOs should reference it when working on product launch and distribution issues.*
