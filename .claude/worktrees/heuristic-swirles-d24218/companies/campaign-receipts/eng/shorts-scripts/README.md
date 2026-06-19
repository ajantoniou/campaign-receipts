# Shorts scripts

**Voice:** Aria only. Write FOR the hook voice — see [`brand/voice-writing.md`](../../brand/voice-writing.md).

Copy [`_TEMPLATE.md`](_TEMPLATE.md) per promise. **Never** trim `eng/longform-scripts/` — different character, different sentences.

TTS:

```bash
python3 scripts/pipeline/elevenlabs-tts.py --shorts \
  --script eng/shorts-scripts/<slug>.md \
  --out _build/<slug>/vo-short.mp3 \
  --piece <slug>-short
```
