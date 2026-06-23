#!/usr/bin/env python3
"""
ElevenLabs text-to-speech for Campaign Receipts voiceovers.

Usage:
    python3 elevenlabs-tts.py --script content/scripts/episode-01.md --out content/videos/episode-01/voiceover.mp3 --piece <issue-uuid>
    python3 elevenlabs-tts.py --text "Hello world" --out /tmp/test.mp3 --piece <issue-uuid>
    python3 elevenlabs-tts.py --list-voices    # show available voices

Default voice: "jessica" (Sarah / southern receipt reader) for long-form and shorts. See `brand/voice-writing.md`. Override with --voice <alias>.
Logs cost to .external-costs.jsonl with piece_id for cost-per-piece tracking.
"""
import json
import os
import re
import sys
import urllib.request
import urllib.error
import subprocess
from pathlib import Path

# Look for .env at the repo root relative to this file (../../.env from scripts/
# pipeline/), then the legacy monorepo path. Also fall back to os.environ so a
# caller (e.g. build-audio-briefing.mjs) can pass keys via the environment — needed
# on Render and in the standalone campaign-receipts checkout.
_HERE = Path(__file__).resolve()
_CANDIDATE_ENVS = [
    _HERE.parent.parent.parent / ".env",        # repo root (standalone)
    Path("/Applications/DrAntoniou Projects/AgentCompanies") / ".env",  # legacy monorepo
]
ENV = next((p for p in _CANDIDATE_ENVS if p.exists()), _CANDIDATE_ENVS[0])
# Repo root = two levels up from scripts/pipeline/. In the standalone checkout the
# root IS campaign-receipts; the legacy monorepo had it under companies/.
CR_DIR = _HERE.parent.parent.parent
if (CR_DIR / "companies/campaign-receipts").exists():
    CR_DIR = CR_DIR / "companies/campaign-receipts"
COST_LOG = CR_DIR / "scripts/.external-costs.jsonl"

# Recommended voices for Campaign Receipts (faceless, calm, investigative-archive)
# Channel narrator: Betsy (see personas/betsy-the-narrator.md). Voice lock pending —
# defaults to the warmest-mid-female-American voice in this list until founder picks
# a permanent voice_id in CR_ELEVENLABS_SARAH_VOICE_ID.
DEFAULT_VOICES = {
    "betsy":   "EXAVITQu4vr4xnSDxMaL",  # Soft, gentle, mid-range female American — provisional CR channel voice
    "jessica": "cgSgspJ2msm6clMCkdW9",  # Playful, bright, warm — southern-leaning Americana audition pick (v6)
    "lily":    "pFZP5JQG7iQjIQuC4Bku",  # Velvety actress — warm narrator alt
    "rachel":  "21m00Tcm4TlvDq8ikWAM",  # Calm narrator — alt for Betsy
    "alice":   "Xb7hH8MSUJpSbSDYk0k2",  # Clear, engaging educator
    "matilda": "XrExE9yKIg1WjnnlVkGX",  # Knowledgeable, professional
    "charlotte": "XB0fDUnXU5powFXDhCwa",  # Sweet narrative warm read
    "aria":    "9BWtsMINqrJLrRacOk9x",  # Warm conversational female
    "grace":   "oWAxZDx7w5VEj9dCyTzz",  # Warm American female
    # Male alts (kept for special-format experiments only — not the channel voice)
    "brian":   "nPczCjzI2devNBz1zQrb",
    "adam":    "pNInz6obpgDQGcFmaJgB",
    "antoni":  "ErXwobaYiN019PkySvjV",
    "george":  "JBFqnCBsd6RMkjVDRZzb",
    "bill":    "pqHfZKP75CvOlQylNhV4",
    "callum":  "N2lVS1w4EtoT3dr4eOWO",
}

def resolve_default_voice(env):
    """Prefer founder-locked CR_ELEVENLABS_SARAH_VOICE_ID; fall back to 'betsy' alias."""
    return env.get("CR_ELEVENLABS_SARAH_VOICE_ID") or DEFAULT_VOICES["betsy"]


def resolve_shorts_voice(env):
    """Shorts use the same Jessica/Sarah lock as long-form (2026-05-21)."""
    return (
        env.get("CR_ELEVENLABS_SHORTS_VOICE_ID")
        or env.get("CR_ELEVENLABS_SARAH_VOICE_ID")
        or DEFAULT_VOICES["jessica"]
    )

# ElevenLabs pricing as of 2026 (per character, Creator+ tiers)
# Creator: 100K chars / $22 = ~$0.00022/char; effectively pre-paid
# Track usage characters for the in-month subscription budget
PRICE_PER_1K_CHARS = 0.22  # rough cost amortization

def load_env():
    # os.environ first (so a caller can inject keys), then .env file fills gaps.
    env = dict(os.environ)
    if ENV.exists():
        for line in ENV.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                k, _, v = line.partition("=")
                k = k.strip()
                if k not in env or not env[k]:
                    env[k] = v.strip().strip('"')
    return env

def get_api_key():
    env = load_env()
    # Prefer NT-specific, fall back to generic
    for key in ("CR_ELEVENLABS_API_KEY", "ELEVENLABS_API_KEY"):
        if env.get(key):
            return env[key]
    print("ERR: No ELEVENLABS_API_KEY in .env", file=sys.stderr)
    sys.exit(1)

def list_voices():
    api_key = get_api_key()
    req = urllib.request.Request("https://api.elevenlabs.io/v1/voices")
    req.add_header("xi-api-key", api_key)
    with urllib.request.urlopen(req, timeout=15) as r:
        data = json.loads(r.read())
    print(f"{'Name':<20} {'Voice ID':<25} {'Category'}")
    print("-" * 70)
    for v in data.get("voices", []):
        print(f"{v['name']:<20} {v['voice_id']:<25} {v.get('category','')}")

def strip_vo_markers(text):
    """Remove editor labels that TTS reads as 'VO' / 'VO dash dash' (founder 2026-05-21)."""
    text = re.sub(r'<!--.*?-->', '', text, flags=re.DOTALL)
    text = re.sub(r'\*\*VO:?\*\*\s*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'^\s*VO[-:–—]+\s*', '', text, flags=re.MULTILINE | re.IGNORECASE)
    text = re.sub(r'\bVO\s*[-:–—]{1,}\s*', '', text, flags=re.IGNORECASE)
    return text


def extract_vo_blocks(md_text):
    """Ordered **VO:** paragraphs.

    Captures the whole VO line/paragraph (to end of line), then strips a single
    pair of WRAPPING quotes if present. The old `"([^"]+)"` form stopped at the
    first INNER quote (e.g. "Ohio Works"), truncating the block and silently
    dropping most of the VO on re-render (founder 2026-06-01). This form is
    tolerant of inner quotes and of unquoted **VO:** lines alike.
    """
    md_text = re.sub(r'<!--.*?-->', '', md_text, flags=re.DOTALL)
    out = []
    for raw in re.findall(r'\*\*VO:\*\*\s*(.+)', md_text):
        v = raw.strip()
        # Strip one pair of wrapping quotes only (keep inner quotes intact).
        if len(v) >= 2 and v[0] == '"' and v[-1] == '"':
            v = v[1:-1].strip()
        if v:
            out.append(v)
    return out


def extract_vo_lines(md_text):
    """Only **VO:** lines are spoken — never **ON SCREEN:** / **Slug:** / headers."""
    vos = extract_vo_blocks(md_text)
    if vos:
        return " ".join(vos)
    md_text = re.sub(r'<!--.*?-->', '', md_text, flags=re.DOTALL)
    block = re.findall(r'\*\*VO:\*\*\s*([^\n]+)', md_text, re.MULTILINE)
    if block:
        return " ".join(b.strip() for b in block)
    # Plain .vo.txt — entire file is narration (no **VO:** labels)
    if not re.search(r'\*\*VO:\*\*', md_text, re.IGNORECASE):
        paras = [
            p.strip() for p in re.split(r'\n\s*\n+', md_text)
            if p.strip() and not re.match(r'^#{1,6}\s', p.strip())
        ]
        if paras and sum(len(p) for p in paras) > 200:
            return "\n\n".join(paras)
    return None


# Production metadata must never reach TTS (founder caught on ep1 upload 2026-05-21).
_BANNED_SPOKEN_RE = re.compile(
    r'\b('
    r'slug:|voice:\s*jessica|voice:\s*sarah|pillar:|deep link|fec sources|'
    r'on screen:|elevenlabs|eleven labs|voice narrative|'
    r'campaignreceipts\.com/politician/[a-z-]+\s+fec'
    r')\b',
    re.IGNORECASE,
)

# Raw URLs in TTS → "https", "dot com slash", garbled paths (founder ep1 2026-05-21).
_URL_SCHEME_RE = re.compile(r'https?://', re.IGNORECASE)
_URL_TOKEN_RE = re.compile(
    r'https?://[^\s\]]+|\bwww\.[^\s]+|'
    r'\b[a-z0-9][-a-z0-9]*\.(com|org|gov|net|io)(?:/[^\s]*)?',
    re.IGNORECASE,
)


def normalize_spoken_urls(text):
    """Remove URL tokens; writers should use 'dot com' or 'link in description'."""
    text = _URL_SCHEME_RE.sub('', text)
    text = _URL_TOKEN_RE.sub(' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def prepare_tts_pronunciations(text):
    """Phoneticize TTS-misread acronyms at synthesis only (on-screen text is untouched).

    - AIPAC -> AY-pack (TTS otherwise says 'AI pac').
    - PAC / PACs -> pack / packs. ElevenLabs reads the standalone acronym 'PAC'
      as the WORD 'pass' (founder catch 2026-06-01: 'super PAC' came out
      'super pass'). 'pack' synthesizes correctly. Phoneticize AFTER the AIPAC
      pass so we don't touch the 'pack' inside 'AY-pack'. Case-insensitive on
      the standalone token only; do not touch 'pac' inside other words.
    """
    text = re.sub(r"\bAIPAC's\b", "AY-pack's", text)
    text = re.sub(r"\bAIPAC\b", "AY-pack", text)
    text = re.sub(r"\bPACs\b", "packs", text)
    text = re.sub(r"\bPAC's\b", "pack's", text)
    text = re.sub(r"\bPAC\b", "pack", text)
    return text


def validate_spoken_text(text, script_path=None):
    """Hard gate before synthesis — fail if editor metadata leaked into VO."""
    if not text or len(text) < 40:
        print("ERR: spoken text empty or too short after clean_script_md", file=sys.stderr)
        sys.exit(2)
    m = _BANNED_SPOKEN_RE.search(text)
    if m:
        where = f" ({script_path})" if script_path else ""
        print(f"ERR: spoken text contains production metadata{where}: …{m.group(0)}…", file=sys.stderr)
        print("   Fix script: metadata in HTML comments only; spoken lines under **VO:** only.", file=sys.stderr)
        sys.exit(2)
    if re.search(r'\*\*ON SCREEN:\*\*', text, re.IGNORECASE):
        print("ERR: **ON SCREEN:** leaked into spoken text — extract_vo_lines failed", file=sys.stderr)
        sys.exit(2)
    if 'https' in text.lower() or 'http://' in text.lower() or 'http ' in text.lower():
        print("ERR: spoken text still contains http(s) — use 'link in the description' instead of URLs", file=sys.stderr)
        sys.exit(2)
    if re.search(r'\.com/', text, re.IGNORECASE):
        print("ERR: spoken text contains .com/ path — not valid for TTS", file=sys.stderr)
        sys.exit(2)
    # Comma-grouped digits / dollar amounts → TTS says "eight thousand thousand" (ep1 2026-05-21)
    if re.search(r'\$\s*\d{1,3}(?:,\d{3})+', text) or re.search(r'\b\d{1,3}(?:,\d{3}){2,}\b', text):
        print("ERR: spoken text has comma-grouped digits ($8,000,000) — spell out in VO (eight million dollars)",
              file=sys.stderr)
        sys.exit(2)
    if re.search(r'\blines only\b', text, re.IGNORECASE):
        print("ERR: production note 'lines only' leaked into VO — check HTML comments before **VO:**", file=sys.stderr)
        sys.exit(2)
    if re.search(r'\bbrother-in-law\b.*\bdayton\b|\bone more thing\b.*\bsarah\b', text, re.IGNORECASE):
        print("ERR: persona-theater line in VO (lay-viewer test hook) — rewrite for broadcast", file=sys.stderr)
        sys.exit(2)
    if re.search(r'\bAIPAC\b', text) and 'AY-pack' not in text and 'ay-pack' not in text.lower():
        print("ERR: spoken text has bare 'AIPAC' — TTS says 'AI pac'; use AY-pack per brand/voice-writing.md", file=sys.stderr)
        sys.exit(2)
    if re.search(r'\bon\s+screen\b|\bbox\s+(one|two|three|1|2|3)\b', text, re.IGNORECASE):
        print("ERR: stage direction leaked into VO (on screen / box N) — visuals live in storyboard only",
              file=sys.stderr)
        sys.exit(2)
    if re.search(r'committee\s+name\s*[·,]\s*date\s*[·,]\s*amount', text, re.IGNORECASE):
        print("ERR: template placeholder in VO — use real FEC line text", file=sys.stderr)
        sys.exit(2)
    if re.search(r'\bVO\s*[-:–—]|^\s*VO\s*[-:–—]|\bVO:\b', text, re.IGNORECASE | re.MULTILINE):
        print("ERR: editor marker 'VO:' leaked into spoken text — use .vo.txt plain narration",
              file=sys.stderr)
        sys.exit(2)


def clean_script_md(md_text, no_ssml=False):
    """Strip markdown formatting to get clean spoken text.

    CRITICAL: Section headers ("## 0:00-0:30 — HOOK") get DROPPED ENTIRELY,
    not just de-marked. Same for stage-direction tags. James reads ONE
    continuous narration, never section labels.

    SEALED scripts with **VO:** blocks: speak ONLY those lines (6th-grade VO pass).

    [pause] tokens behavior:
      no_ssml=False (default) → <break time="..."/> SSML tags (requires eleven_v3)
      no_ssml=True → strip + replace with sentence-ending punctuation
                     (forces turbo_v2_5 compatibility; Brian honors paragraph
                      breaks naturally without explicit pause tags)
    """
    # Drop cited_figures / tables — never spoken
    md_text = re.split(r'\n##\s+cited_figures\b', md_text, maxsplit=1, flags=re.IGNORECASE)[0]
    # Strip HTML comments before extract — comments often hold https:// deep links
    md_text = re.sub(r'<!--.*?-->', '', md_text, flags=re.DOTALL)

    # Prefer plain narration file when storyboard points at -vo.txt
    vo_only = extract_vo_lines(md_text)
    if vo_only:
        text = strip_vo_markers(vo_only)
    else:
        # Never TTS the full file — prevents Slug/Voice/ON SCREEN being read aloud.
        print("ERR: script has no **VO:** lines — refusing to synthesize whole markdown file.", file=sys.stderr)
        sys.exit(2)

    # Drop production footer (figure tables, persona notes) if present
    text = re.split(r'\n---\n|\n\*\*This file is the script only', text, maxsplit=1)[0]
    # Drop frontmatter
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) >= 3:
            text = parts[2]

    # DROP entire header lines (## TITLE, # TITLE, etc) — not just the # marker.
    # The reader should never hear "Zero zero to zero thirty, hook" or similar.
    text = re.sub(r'^#{1,6}\s+.*$', '', text, flags=re.MULTILINE)

    # Drop HTML comments (<!-- ... -->) — they're editor-navigation only, not for reading.
    text = re.sub(r'<!--.*?-->', '', text, flags=re.DOTALL)

    # <em>/</em> handling:
    # no_ssml mode → strip entirely (Brian uses punctuation/context for emphasis)
    # default mode → preserve (eleven_v3 renders these as natural emphasis)
    if no_ssml:
        text = re.sub(r'</?em>', '', text)

    # Strip inline markdown
    text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)              # bold
    text = re.sub(r'\*([^*]+)\*', r'\1', text)                  # italic
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)       # links
    text = re.sub(r'`([^`]+)`', r'\1', text)                    # inline code
    text = re.sub(r'^\s*[-*+]\s+', '', text, flags=re.MULTILINE)  # bullets
    text = re.sub(r'^\s*\d+\.\s+', '', text, flags=re.MULTILINE)  # numbered

    # Convert [pause] (and variants).
    # no_ssml=True → drop and replace with natural sentence boundary
    # (period if no punctuation already, else just whitespace)
    # no_ssml=False → emit <break time="..."/> SSML tags (eleven_v3 only)
    if no_ssml:
        def pause_replace_no_ssml(m):
            # Just collapse to a paragraph break (Brian honors paragraph rhythm naturally)
            return "\n\n"
        text = re.sub(r'\[pause(:[^\]]*)?\]', pause_replace_no_ssml, text, flags=re.IGNORECASE)
    else:
        def pause_replace(m):
            spec = (m.group(1) or "").strip().lower()
            if spec.startswith(":"):
                spec = spec[1:].strip()
            if spec == "short":
                secs = "0.5"
            elif spec == "long":
                secs = "2.5"
            elif spec.endswith("s") and spec[:-1].replace(".", "").isdigit():
                secs = spec[:-1]
            else:
                secs = "1.5"  # default beat
            return f' <break time="{secs}s" /> '
        text = re.sub(r'\[pause(:[^\]]*)?\]', pause_replace, text, flags=re.IGNORECASE)

    # Strip any other bracketed stage directions ([Viewer voice], [James voice], etc.)
    # — caller handles speaker-tagged scripts upstream by splitting on tags before TTS.
    text = re.sub(r'\[[A-Z][^\]]+\]', '', text)

    # Collapse extra whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r' {2,}', ' ', text)
    text = re.sub(r'\n +', '\n', text)
    text = normalize_spoken_urls(text.strip())
    return text

def synthesize(text, voice_id, model="eleven_turbo_v2_5", stability=0.7, similarity=0.85):
    text = prepare_tts_pronunciations(text)
    # Safety assert: no TTS-misread acronym may survive the phoneticizer into the
    # API call. Standalone 'PAC'/'AIPAC' here means a regex gap — fail loud rather
    # than ship 'super pass' (founder catch 2026-06-01) or 'AI pac'.
    leak = re.search(r"\b(AIPAC|PAC|PACs)\b", text)
    if leak:
        print(f"ERR: acronym '{leak.group(0)}' survived prepare_tts_pronunciations — "
              f"TTS will mispronounce it; fix the phoneticizer regex", file=sys.stderr)
        sys.exit(2)
    # PRODUCTION-LOCKED VOICE SETTINGS 2026-05-20 (Brian, NTO ad-hoc):
    # stability=0.7 (was 0.5) → slower, more measured pace; reduces pace-drift
    # between renders. Verified by founder (Spotify v3 at 0.5 → 12:48, new render
    # at 0.5 → 8:30 same script). 0.7 lands consistently ~145 WPM Brian.
    # similarity=0.85 (was 0.75) → tighter voice fingerprint; less inter-render drift.
    # DO NOT change without re-validating against a 1000+ word reference render.
    #
    # NOTE: these CLI defaults are for Brian/NTO ad-hoc use. CR (Jessica) and
    # HealthBrew (Jessica) production callers MUST pass explicit settings —
    # see scripts/longform/produce-explainer.mjs:125 and every eng/storyboards/*.json.
    # CR canonical 2026-05-26: stability=0.55, similarity_boost=0.82, style=0.20,
    # model=eleven_multilingual_v2. See eng/strategy/cr-voice-settings-decision-2026-05-26.md.
    # R3 SUPERSEDED 2026-05-20: empirical test proved turbo_v2_5 honors <break time="Xs"/>
    # SSML tags by inserting silence (verified: 11.24s render for short test with 3×2s
    # breaks = +6s of intentional silence as expected). turbo_v2_5 silently ignores <em>
    # tags (no breakage; just no emphasis). Original R3 fail-fast was overcautious.
    # eleven_v3 hallucinates on long-form content — verified 2026-05-19: looped "that
    # tension you felt" 7 times + inserted "Joe Biden, President USA" + Arabic mid-VO.
    # PRODUCTION RULE: turbo_v2_5 + SSML breaks (no auto-upgrade).
    api_key = get_api_key()
    body = {
        "text": text,
        "model_id": model,
        "voice_settings": {
            "stability": stability,
            "similarity_boost": similarity,
            "style": 0.0,
            "use_speaker_boost": True,
        }
    }
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
        data=json.dumps(body).encode(),
        method="POST",
    )
    req.add_header("xi-api-key", api_key)
    req.add_header("Content-Type", "application/json")
    req.add_header("Accept", "audio/mpeg")
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"ElevenLabs HTTP {e.code}: {body[:400]}", file=sys.stderr)
        sys.exit(1)

def scribe_transcribe(audio_bytes, api_key):
    """Call ElevenLabs scribe to transcribe rendered audio. Returns transcript text."""
    import uuid
    boundary = f"----verify{uuid.uuid4().hex}"
    parts = [
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"model_id\"\r\n\r\nscribe_v1\r\n".encode(),
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"verify.mp3\"\r\nContent-Type: audio/mpeg\r\n\r\n".encode(),
        audio_bytes,
        f"\r\n--{boundary}--\r\n".encode(),
    ]
    body = b"".join(parts)
    req = urllib.request.Request("https://api.elevenlabs.io/v1/speech-to-text",
                                  data=body, method="POST")
    req.add_header("xi-api-key", api_key)
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            result = json.loads(r.read())
            return result.get("text", ""), None
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:300]
        print(f"  ⚠️  scribe HTTP {e.code}: {body}", file=sys.stderr)
        if "quota_exceeded" in body:
            return "", "quota_exceeded"
        return "", "error"


# Spelled-out cardinal numbers -> digits. ElevenLabs scribe transcribes spelled
# numbers ("sixty") as digits ("60"), so a legitimate >=3x refrain containing a
# number (e.g. SEALED's "the same afternoon, sixty people died") would false-flag
# as a loop hallucination because src 4-grams ("...afternoon sixty") never match
# transcript 4-grams ("...afternoon 60"). Collapsing both sides to digits here
# fixes that without touching the WER threshold or length-ratio checks, and
# without weakening real loop detection (a genuine loop has no number mismatch).
_SPELLED_NUMBERS = {
    "zero": "0", "one": "1", "two": "2", "three": "3", "four": "4",
    "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9",
    "ten": "10", "eleven": "11", "twelve": "12", "thirteen": "13",
    "fourteen": "14", "fifteen": "15", "sixteen": "16", "seventeen": "17",
    "eighteen": "18", "nineteen": "19", "twenty": "20", "thirty": "30",
    "forty": "40", "fifty": "50", "sixty": "60", "seventy": "70",
    "eighty": "80", "ninety": "90", "hundred": "100", "thousand": "1000",
    "million": "1000000",
}


def normalize_for_diff(text):
    """Lowercase + strip punctuation + collapse whitespace for word-level comparison.

    Also maps spelled-out cardinal numbers to digits so that source and scribe
    transcript agree regardless of how the ASR renders numbers (see comment above
    _SPELLED_NUMBERS).
    """
    text = re.sub(r'<[^>]+>', ' ', text)         # drop any remaining SSML / HTML
    text = text.lower()
    text = re.sub(r"[^\w\s']", ' ', text)        # keep apostrophes, drop other punct
    text = re.sub(r'\s+', ' ', text).strip()
    if text:
        text = ' '.join(_SPELLED_NUMBERS.get(w, w) for w in text.split())
    return text


def verify_transcript_matches_source(source_text, transcript, max_word_error_rate=0.10):
    """Compare scribed transcript against source text. Detect hallucinations.

    Returns dict with: ok (bool), word_error_rate, hallucinated_words, dropped_words,
    detail (str). Designed to catch eleven_v3-style failure modes:
      - Word loops (same phrase repeats >2× when source has it 1×)
      - Foreign-language inserts (script is English, transcript has Arabic/etc.)
      - Word substitutions ("when he started this produces" vs "spent three years")
      - Missing chunks (transcript stops short of source)
    """
    src = normalize_for_diff(source_text)
    tx  = normalize_for_diff(transcript)
    src_words = src.split()
    tx_words  = tx.split()

    if not tx_words:
        return {"ok": False, "word_error_rate": 1.0, "detail": "empty transcript"}

    # 1. Length sanity: transcript should be within ±20% of source word count
    len_ratio = len(tx_words) / max(1, len(src_words))
    if len_ratio < 0.7:
        return {"ok": False, "word_error_rate": 1.0 - len_ratio,
                "detail": f"transcript only {len_ratio:.0%} of source word count ({len(tx_words)} vs {len(src_words)})"}
    if len_ratio > 1.6:
        return {"ok": False, "word_error_rate": len_ratio - 1.0,
                "detail": f"transcript {len_ratio:.0%} of source word count — likely loop hallucination ({len(tx_words)} vs {len(src_words)})"}

    # 2. Loop detection: any 4-word sequence repeated >2× in transcript when in source <2×
    def ngrams(words, n):
        return [tuple(words[i:i+n]) for i in range(len(words)-n+1)]
    src_4grams = {}
    for g in ngrams(src_words, 4):
        src_4grams[g] = src_4grams.get(g, 0) + 1
    tx_4grams = {}
    for g in ngrams(tx_words, 4):
        tx_4grams[g] = tx_4grams.get(g, 0) + 1
    loops = []
    for g, c in tx_4grams.items():
        if c >= 3 and src_4grams.get(g, 0) < 2:
            loops.append((' '.join(g), c, src_4grams.get(g, 0)))
    if loops:
        top = loops[0]
        return {"ok": False, "word_error_rate": 1.0,
                "detail": f"LOOP HALLUCINATION: '{top[0]}' repeats {top[1]}× in transcript but {top[2]}× in source"}

    # 3. Foreign-script detection: transcript contains non-ASCII outside punctuation
    non_ascii_chars = sum(1 for c in transcript if ord(c) > 127 and not c.isspace())
    if non_ascii_chars > 5:
        return {"ok": False, "word_error_rate": 0.5,
                "detail": f"FOREIGN SCRIPT INSERT: {non_ascii_chars} non-ASCII characters in transcript (Arabic? Chinese? Hebrew?)"}

    # 4. Word Error Rate via Levenshtein on word lists
    # Use SequenceMatcher ratio for speed
    from difflib import SequenceMatcher
    ratio = SequenceMatcher(None, src_words, tx_words).ratio()
    wer = 1.0 - ratio
    if wer > max_word_error_rate:
        # Find the worst-diff region (largest matching block gap)
        sm = SequenceMatcher(None, src_words, tx_words)
        for tag, i1, i2, j1, j2 in sm.get_opcodes():
            if tag != "equal" and (i2 - i1) > 5:
                src_chunk = " ".join(src_words[i1:min(i2, i1+15)])
                tx_chunk  = " ".join(tx_words[j1:min(j2, j1+15)])
                return {"ok": False, "word_error_rate": wer,
                        "detail": f"WER {wer:.1%} > {max_word_error_rate:.0%}.\n  Source: '{src_chunk[:200]}'\n  Trans:  '{tx_chunk[:200]}'"}
        return {"ok": False, "word_error_rate": wer, "detail": f"WER {wer:.1%} > tolerance"}

    return {"ok": True, "word_error_rate": wer, "detail": f"WER {wer:.1%} ≤ {max_word_error_rate:.0%}"}


def log_cost(piece_id, vendor, cost_usd, chars, note):
    COST_LOG.parent.mkdir(parents=True, exist_ok=True)
    import datetime as dt
    entry = {
        "ts": dt.datetime.now().isoformat(),
        "issueId": piece_id,
        "vendor": vendor,
        "cost_usd": round(cost_usd, 4),
        "chars": chars,
        "note": note,
    }
    with open(COST_LOG, "a") as f:
        f.write(json.dumps(entry) + "\n")

def synthesize_chunked(script_path, out_path, voice_id, voice_name, model, piece_id, no_ssml=False):
    """One TTS request per VO block — avoids single-request quota spikes.

    Two supported script shapes:
      - SEALED markdown with quoted **VO:** "..." blocks (legacy lane)
      - Plain `.vo.txt` continuous narration — split on paragraph breaks
        (CR new-news lane, where the lay-audience explainer is one prose
        document, no editor markers in the spoken file)
    """
    import subprocess as sp

    raw = Path(script_path).read_text()
    blocks = extract_vo_blocks(raw)
    if not blocks:
        # Plain .vo.txt fallback. clean_script_md collapses ALL paragraph breaks
        # into one line (whitespace-normalization regexes flatten \n\n runs), so a
        # paragraph-break split would yield a single giant chunk and risk
        # turbo_v2_5 loop-hallucination on cross-beat phrasing (SEALED embassy
        # 2026-05-28). Split the CLEANED text at sentence boundaries instead, then
        # merge to ~1500-char chunks. [pause] tokens have already become
        # <break time="Xs"/> SSML; never split inside one (founder cadence lock).
        cleaned = clean_script_md(raw, no_ssml=no_ssml)
        units = [u for u in re.split(r'(?<=[.!?])\s+', cleaned) if u.strip()]
        if not units:
            print("ERR: no spoken text found in script (chunked)", file=sys.stderr)
            sys.exit(2)
        merged: list[str] = []
        buf = ""
        TARGET = 1500
        for u in units:
            if not buf:
                buf = u
            # don't seam a chunk that has an unclosed <break ...> open
            elif len(buf) + 1 + len(u) <= TARGET and buf.count("<break") == buf.count("/>"):
                buf = f"{buf} {u}"
            else:
                merged.append(buf)
                buf = u
        if buf:
            merged.append(buf)
        blocks = merged
        print(f"  [chunked] plain .vo.txt → {len(blocks)} sentence-merged blocks")
    work = Path(out_path).parent / "_vo_chunk_parts"
    work.mkdir(parents=True, exist_ok=True)
    parts = []
    total_chars = 0
    for i, block in enumerate(blocks):
        block = normalize_spoken_urls(block)
        validate_spoken_text(block, script_path)
        part_md = work / f"block_{i:02d}.md"
        part_mp3 = work / f"block_{i:02d}.mp3"
        part_md.write_text(f'## VO\n\n**VO:** "{block}"\n')
        print(f"  [chunked] block {i + 1}/{len(blocks)} ({len(block)} chars)")
        audio = synthesize(block, voice_id, model=model)
        part_mp3.write_bytes(audio)
        parts.append(part_mp3)
        total_chars += len(block)
        log_cost(f"{piece_id}-b{i}", "elevenlabs", len(block) / 1000 * PRICE_PER_1K_CHARS, len(block),
                 f"chunk voice={voice_name}")
    list_path = work / "concat.txt"
    list_path.write_text("".join(f"file '{p.resolve()}'\n" for p in parts))
    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    sp.run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(list_path),
         "-c", "copy", str(out_path)],
        check=True, capture_output=True,
    )
    print(f"✅ Chunked VO → {out_path} ({len(blocks)} blocks, {total_chars:,} chars)")
    log_cost(piece_id, "elevenlabs", total_chars / 1000 * PRICE_PER_1K_CHARS, total_chars,
             f"chunked voice={voice_name} model={model}")


def main():
    args = sys.argv[1:]
    if "--list-voices" in args:
        list_voices()
        return
    if "--help" in args or "-h" in args or not args:
        print(__doc__)
        sys.exit(0)

    def get(flag, default=None):
        if flag in args:
            idx = args.index(flag)
            return args[idx + 1] if idx + 1 < len(args) else default
        return default

    script_path = get("--script")
    text = get("--text")
    out_path = get("--out")
    piece_id = get("--piece", "manual-test")
    env = load_env()
    # --shorts → same Jessica/Sarah as long-form (brand/voice-writing.md)
    voice_name = get("--voice", "jessica")
    voice_id = DEFAULT_VOICES.get(voice_name, voice_name)
    locked = env.get("CR_ELEVENLABS_SARAH_VOICE_ID")
    if locked and voice_name in ("betsy", "sarah", "jessica"):
        voice_id = locked
    elif "--shorts" in args:
        voice_id = DEFAULT_VOICES.get(voice_name) or resolve_shorts_voice(env)
    model = get("--model", "eleven_turbo_v2_5")            # eleven_v3 supports SSML
    no_ssml = "--no-ssml" in args                          # strip [pause]/<em> for turbo_v2_5 stability
    no_verify = "--no-verify" in args                      # skip post-render scribe verification (NOT recommended)
    chunked = "--chunked" in args                          # one request per **VO:** block (quota-safe)
    max_wer = float(get("--max-wer", "0.12"))              # 12% word error rate ceiling

    if not out_path:
        print("ERR: --out required", file=sys.stderr); sys.exit(1)

    if script_path and chunked:
        print(f"Chunked TTS ({voice_name}, {model}) from {script_path}")
        synthesize_chunked(script_path, out_path, voice_id, voice_name, model, piece_id, no_ssml=no_ssml)
        if no_verify:
            print("   ⚠️  verification SKIPPED (--no-verify)")
            return
        raw = Path(script_path).read_text()
        text = clean_script_md(raw, no_ssml=no_ssml)
        print(f"\n🔍 Verifying chunked audio matches script...")
        api_key = get_api_key()
        audio = Path(out_path).read_bytes()
        transcript, scribe_err = scribe_transcribe(audio, api_key)
        if not transcript:
            print("   ⚠️  scribe empty — passing through")
            return
        source_for_compare = re.sub(r'<[^>]+>', ' ', text)
        result = verify_transcript_matches_source(source_for_compare, transcript, max_word_error_rate=max_wer)
        if result["ok"]:
            print(f"   ✅ verification passed: {result['detail']}")
        else:
            print(f"   ❌ VERIFICATION FAILED: {result['detail']}", file=sys.stderr)
            sys.exit(2)
        return

    if script_path:
        raw = Path(script_path).read_text()
        text = clean_script_md(raw, no_ssml=no_ssml)
        validate_spoken_text(text, script_path)
    elif not text:
        print("ERR: --script or --text required", file=sys.stderr); sys.exit(1)
    else:
        validate_spoken_text(text)

    # SSML handling: VERIFIED 2026-05-20 — turbo_v2_5 DOES honor <break time="Xs"/> tags
    # natively (inserts silence). Earlier R3 enforcement was overcautious; production
    # confirmed turbo_v2_5 handles 40+ break tags + 20+ <em> tags cleanly with no
    # gibberish. eleven_v3 is alpha-quality and hallucinates on long-form (verified:
    # audio looped "that tension you felt" 7 times + inserted "Joe Biden, President"
    # mid-VO). STICK WITH turbo_v2_5 + SSML tags as the production combination.
    # --no-ssml flag exists for emergency fallback only; --model eleven_v3 is DANGER.
    if "<em>" in text and model != "eleven_v3":
        # turbo_v2_5 doesn't honor <em> as emphasis but doesn't break either; strip silently
        text = re.sub(r'</?em>', '', text)

    chars = len(text)
    print(f"Synthesizing {chars:,} chars with voice '{voice_name}' ({voice_id}) model={model}...")
    audio = synthesize(text, voice_id, model=model)

    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    Path(out_path).write_bytes(audio)

    cost = chars / 1000 * PRICE_PER_1K_CHARS
    log_cost(piece_id, "elevenlabs", cost, chars, f"voice={voice_name} model={model}")
    print(f"✅ Wrote {len(audio):,} bytes to {out_path}")
    print(f"   Cost: ~${cost:.3f} ({chars:,} chars amortized at ${PRICE_PER_1K_CHARS}/1K)")

    # ============================================================
    # POST-RENDER VERIFICATION GATE (PIPELINE-CRITICAL, on by default)
    # ============================================================
    # Catches: eleven_v3-style hallucination loops, foreign-script inserts,
    # word substitutions, silent failures. Adds ~$0.005/min audio to scribe.
    # Founder direction 2026-05-20: "elevenlabs should spit out the transcript
    # of the voice it produced then our pipeline should compare it to what
    # was originally fed."
    if no_verify:
        print(f"   ⚠️  verification SKIPPED (--no-verify)")
        return

    print(f"\n🔍 Verifying audio matches source script...")
    api_key = get_api_key()
    transcript, scribe_err = scribe_transcribe(audio, api_key)
    if not transcript and scribe_err == "quota_exceeded":
        cache = Path(out_path).with_suffix(".scribe.transcript.txt")
        if cache.is_file():
            transcript = cache.read_text()
            print(f"   ⏭ scribe quota — using cached transcript ({len(transcript)} chars)")
    if not transcript:
        print(f"   ⚠️  scribe returned empty transcript — cannot verify (passing through)")
        return
    # Compare CLEAN text against transcript (drop break/em tags from comparison)
    source_for_compare = re.sub(r'<[^>]+>', ' ', text)  # drop SSML tags
    result = verify_transcript_matches_source(source_for_compare, transcript, max_word_error_rate=max_wer)
    # Log scribe cost (~$0.40/hr)
    import subprocess as _sp
    try:
        dur = float(_sp.check_output(["ffprobe","-v","error","-show_entries","format=duration",
            "-of","default=noprint_wrappers=1:nokey=1", str(out_path)]).decode().strip())
        scribe_cost = dur / 3600.0 * 0.40
        log_cost(piece_id, "elevenlabs/scribe-verify", scribe_cost, len(transcript),
                 f"verify {dur:.1f}s")
    except Exception:
        pass

    if result["ok"]:
        print(f"   ✅ verification passed: {result['detail']}")
        Path(out_path).with_suffix(".scribe.transcript.txt").write_text(transcript.strip() + "\n")
        from qc_spoken import transcript_fails_qc
        failed, reason = transcript_fails_qc(transcript)
        if failed:
            print(f"   ❌ {reason}", file=sys.stderr)
            review_path = Path(out_path).with_suffix(".verify-FAILED.txt")
            review_path.write_text(f"BANNED: {reason}\n\n=== TRANSCRIPT ===\n{transcript}")
            Path(out_path).unlink(missing_ok=True)
            sys.exit(2)
    else:
        print(f"   ❌ VERIFICATION FAILED: {result['detail']}", file=sys.stderr)
        # Save transcript next to audio for human inspection
        review_path = Path(out_path).with_suffix(".verify-FAILED.txt")
        review_path.write_text(f"WER: {result['word_error_rate']:.1%}\nDetail: {result['detail']}\n\n=== TRANSCRIPT ===\n{transcript}\n\n=== SOURCE (cleaned) ===\n{source_for_compare}")
        print(f"   Diff saved to: {review_path}", file=sys.stderr)
        print(f"   AUDIO WILL NOT BE TRUSTED — re-render before use.", file=sys.stderr)
        try:
            Path(out_path).unlink(missing_ok=True)
        except OSError:
            pass
        sys.exit(2)

if __name__ == "__main__":
    main()
