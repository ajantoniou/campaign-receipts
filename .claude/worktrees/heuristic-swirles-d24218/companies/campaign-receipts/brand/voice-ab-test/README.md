# Sarah Voice A/B Test

Founder feedback: current Sarah voice (ElevenLabs **Bella**, `EXAVITQu4vr4xnSDxMaL`) sounds robotic, not warm — see https://youtube.com/shorts/0UuZ5J7m4dI

## Snippet

Identical 12-second VO rendered across one baseline + five candidates with canonical Sarah teacher settings:
`stability=0.55, similarity_boost=0.75, style=0.15, speed=0.93, model=eleven_multilingual_v2`.

> Hey. So in twenty sixteen, Donald Trump promised to drain the swamp.
> Eighty-two million dollars later, the swamp got paid.
> Let me show you the receipts.

## Candidates

| Voice | voice_id | Notes |
|---|---|---|
| Bella (current) | `EXAVITQu4vr4xnSDxMaL` | baseline — robotic |
| Aria | `9BWtsMINqrJLrRacOk9x` | warm conversational female |
| Grace | `oWAxZDx7w5VEj9dCyTzz` | **substituted** for retired Sarah-stock `cgSgspJ2msvubVrgalSO` (API 404) |
| Charlotte | `XB0fDUnXU5powFXDhCwa` | sweet narrative warm read |
| Lily | `pFZP5JQG7iQjIQuC4Bku` | warm, sweet, conversational |
| Matilda | `XrExE9yKIg1WjnnlVkGX` | warm American narrator |

## How to listen

```
open "file:///Applications/DrAntoniou Projects/AgentCompanies/companies/campaign-receipts/brand/voice-ab-test/index.html"
```

Headphones recommended.

## Winner

_TBD — founder picks, then update this section with the chosen voice + voice_id and set
`CR_ELEVENLABS_SARAH_VOICE_ID` accordingly. The mp3s themselves are gitignored
(see `.gitignore` in this folder)._

## Cost

5 candidate renders + 1 baseline = ~$0.30 of ElevenLabs credits.
