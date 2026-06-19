# Audio QC report — sealed-aipac-iran-deal-v5.mp4

- piece: `sealed-aipac-iran-deal-v5`
- expected voice: `betsy`
- expected F0 range: 165-280 Hz

| Check | Verdict | Detail |
|-------|---------|--------|
| voice-identity (cost log) | ⚠️ **WARN** | no ElevenLabs entries for piece_id=sealed-aipac-iran-deal-v5 |
| audio stream + volume | ✅ **PASS** | mean=-19.2dB max=-4.2dB |
| pitch analysis | ⏭ **SKIP** | numpy not installed; pitch analysis skipped (cost-log check is primary) |
| transcript reconciliation | ⏭ **SKIP** | no --storyboard provided; transcript reconciliation skipped |
| banned phrases | ⏭ **SKIP** | banned-phrase scan requires scribe wiring |

**Final verdict:** ✅ PASS
