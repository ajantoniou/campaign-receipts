# Copy status — cr-bell-bush-aipac-primary

| Gate | Status | Artifact |
|------|--------|----------|
| Storyline editor | ✅ PASS | `storyline-editor-pass.md` |
| Script QC (spoken) | ✅ PASS | `qc-script-cr-bell-bush-aipac-primary-vo.md` |
| Council v9 | ⚠️ REVISE → fixes applied in v10 `-vo.txt` | `council-script-2026-05-21-v9.md` |
| Viral panel v9 | ⚠️ synth failed; member reviews OK | `viral-script-2026-05-21-v9.md` |
| Master visual QC | ✅ PASS (2026-05-22) | `_build/.../master-visual-qc.json` |
| Production QC (8 gates) | ✅ PASS | `_build/.../production-qc.json` |

**Retire YouTube `SSlygpQQFM0`** — shipped before gate 8; had Iran-deal `VerdictStamp` defaults + zoompan text-card tremor. Upload **new** private ID from fresh `master.mp4` only.

## v10 script changes (post-panel)

- Open: `$8M / 5 points / receipt` (viral + council)
- Removed fabricated `schedule E, line forty-two`
- Kitchen-table definition of outside money
- AIPAC named once, no phonetic spelling
- CTA: flip the mailer

## Next

1. Optional: `council-review.py` on v10 for SHIP
2. `produce-video.py --storyboard … --piece cr-bell-bush-aipac-primary --force-vo`
3. `production-qc` → private upload
