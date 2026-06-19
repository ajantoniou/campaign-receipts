# Campaign Receipts — Remotion pointer

**This company uses the monorepo Remotion build at `/remotion/`.** There
is no per-company Remotion project to install or maintain here.

## Render a clip

```bash
node scripts/pipeline/render-remotion.mjs \
  --composition MoneyFlow \
  --duration 6 \
  --props '{"source": {"name": "Adelson", "amount": 82000000}, "destinations": [{"label": "Iran deal killed"}]}' \
  --out _build/<slug>/clips/<id>.mp4
```

Outputs 1280×720 @ 30fps h264 mp4. Drops directly into
`produce-from-storyboard.py`.

## Add a CR-specific composition

If you need a Campaign-Receipts-only composition (e.g. uses a CR
brand asset other companies shouldn't see), add it to
`/remotion/src/compositions/cr-<name>.tsx` and register it in
`/remotion/src/Root.tsx` with the `cr-` prefix preserved in the
`id`. This keeps the cross-company catalog uncluttered while still
sharing the install.

## Hosting

Local node renders today. When daily volume exceeds ~10 clips/day,
the adapter will switch to the Render-hosted renderer
(`/render-remotion-renderer.yaml`) — same JSON contract, no
storyboard changes required.

## Storyboard JSON

In `eng/storyboards/<slug>.json` set `model: "remotion"`:

```json
{
  "id": "s6-02",
  "duration_s": 6,
  "vo_text": "...",
  "model": "remotion",
  "composition": "MoneyFlow",
  "props": { "source": {...}, "destinations": [...] }
}
```

The driver's vendor-pick branch routes any clip with `model: "remotion"`
to this adapter automatically.
