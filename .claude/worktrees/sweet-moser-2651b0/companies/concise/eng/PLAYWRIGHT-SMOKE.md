# Playwright smoke pilot — Concise landing

## Why this exists

- Provides a lightweight Playwright scaffold (`TASK-088`) for any future company pilot.
- Targets the `/` landing page so we can verify the hero, CTA, and email capture remain ship-shape before deploys.

## How to run

1. Install dependencies (already part of the repo): `npm install`.
2. From `companies/concise`, run `npm run test:playwright`.
3. The command starts `next dev` on `http://127.0.0.1:3000` (configured in `playwright.config.ts`), reusing an existing server when detected.

**Note:** `playwright.config.ts` forces `NODE_ENV=development` for the spawned dev server. Playwright defaults to `NODE_ENV=test`, which can prevent Next from processing Tailwind in `globals.css`.

## Assertions

- Hero heading (`Concise Books`) and sub-heading (`Coming Soon`) are visible.
- The “Notify Me” CTA renders.
- Both email and name placeholders appear so the capture form renders.

## Next steps

- Extend this suite when we onboard a pilot company (add checkout flows, PDF downloads, etc.).
- Wire into CI/dependency graph once a stable smoke run proves reliable.
