"""Shared spoken-audio QC patterns — import from script-qc, elevenlabs-tts, audio-qc, production-qc."""
import re

# Production leaks that must never appear in TTS or Scribe transcript (2026-05-21 ep1).
BANNED_TRANSCRIPT_RE = re.compile(
    r'\b('
    r'slug\b|voice:\s*jessica|voice:\s*sarah|voice:\s*betsy|pillar:|deep link|'
    r'fec sources|on screen|elevenlabs|eleven labs|voice narrative|'
    r'https?://|https\b|http\b|\.com/|www\.'
    r')\b',
    re.IGNORECASE,
)

BANNED_TRANSCRIPT_EXTRA = re.compile(
    r'campaignreceipts\.com|gccampaignreceipts|lines only|'
    r'thousand thousand|eight thousand thousand|on screen|'
    r'box one|box two|box three|committee name · date|'
    r'\bvo\s*[-:–—]|\bvo:\b|'
    r'\b\d{1,2},\d{3},\d{3}\b|'  # comma-millions read aloud wrong ($8,000,000)
    r'\bAI\s+pac\b|'  # ElevenLabs misread of AIPAC
    r'\bsuper\s+pass(es)?\b',  # ElevenLabs reads 'super PAC' as 'super pass' (2026-06-01)
    re.IGNORECASE,
)


def transcript_fails_qc(transcript: str) -> tuple[bool, str]:
    """Return (failed, reason)."""
    if not transcript or len(transcript.strip()) < 20:
        return True, "empty or too-short transcript"
    t = transcript.strip()
    m = BANNED_TRANSCRIPT_RE.search(t)
    if m:
        return True, f"banned phrase in audio: {m.group(0)!r}"
    m2 = BANNED_TRANSCRIPT_EXTRA.search(t)
    if m2:
        return True, f"banned leak in audio: {m2.group(0)!r}"
    return False, ""
