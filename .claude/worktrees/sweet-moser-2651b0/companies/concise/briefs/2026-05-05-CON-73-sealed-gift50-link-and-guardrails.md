# CON-73: Shareable “Gift/Referral” Link (50% Off) + Guardrails
**Owner:** Founder (LS dashboard) + Chief Accountant (margin) + CTO (landing wiring)
**Date:** 2026-05-05
**Status:** TODO

## Objective

Make SEALED inherently shareable:

- Every buyer can send a **one-click link** that applies **50% off** automatically.

## Implementation

### 1) Create discount code in Lemon Squeezy

- **Code:** `GIFT50`
- **Discount:** 50%
- **Applies to:** both Standard + Bundle variants

### 2) Shareable link format (auto-applies code)

Lemon Squeezy supports prefilled checkout fields via query params.

Use:

`https://demiurgiclabs.lemonsqueezy.com/checkout/buy/<VARIANT_ID>?checkout[discount_code]=GIFT50`

### 3) Guardrails (add only if needed)

Start permissive for virality. If abuse appears, add:

- redemption cap (e.g., 3,000 total)
- time window (e.g., 7 days)
- minimum cart rules (if LS supports)

## Acceptance criteria

- Link works on mobile, desktop, and inside apps (SMS/DM)
- Checkout shows discount applied automatically
- Code redemption is trackable in LS dashboard

