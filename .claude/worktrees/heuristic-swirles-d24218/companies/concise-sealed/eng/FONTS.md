# SEALED typography (tracker step 17)

Fonts load via **`next/font/google`** in [`app/layout.tsx`](../app/layout.tsx) — optimized self-host at build (no runtime Google CSS request).

| Role | Face | CSS variable | Tailwind |
|------|------|----------------|----------|
| Body / UI | Source Sans 3 | `--font-sealed-body` | Default `font-sans` |
| Display / title | Lora | `--font-sealed-display` | `font-sealed-display` |

Optional pure **woff2** in `public/fonts/` is unnecessary unless Demiurgic branding mandates a licensed non-Google face.
