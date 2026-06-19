#!/usr/bin/env python3
"""
Book-style politician caricatures (Trump / Adelson lane) — FLUX Pro, cached under public/brand/caricatures/.

Usage:
  python3 politician-caricature.py --list
  python3 politician-caricature.py --ensure cori-bush --piece cr-bell-bush-aipac-primary
  python3 politician-caricature.py --ensure cori-bush,wesley-bell --piece <slug>
  python3 politician-caricature.py --ensure cori-bush --force   # regenerate

Storyboard: vendor politician-caricature + caricature_slug (or image-kenburns + caricature_slug).
produce-from-storyboard.py calls ensure before ken-burns.
"""
import json
import sys
from pathlib import Path

REPO = Path("/Applications/DrAntoniou Projects/AgentCompanies")
CR = REPO / "companies/campaign-receipts"
MANIFEST = CR / "public/brand/caricatures.manifest.json"
MIN_BYTES = 8000

PROMPT = (
    "Editorial caricature portrait of {name}, {role}. "
    "Single-line ink with restrained two-tone wash on cream paper, "
    "civic-document / New Yorker editorial style, three-quarter angle, "
    "neutral expression, no text, no logos, no photoreal, no photograph."
)
NEGATIVE = (
    "photograph, photorealistic, hyperreal, 3d render, text, watermark, logo, "
    "campaign poster, cable news chyron, smiling stock photo"
)


def load_manifest():
    if not MANIFEST.is_file():
        print(f"ERR: missing {MANIFEST}", file=sys.stderr)
        sys.exit(2)
    return json.loads(MANIFEST.read_text())


def resolve_existing(entry):
    for rel in [entry.get("path")] + (entry.get("legacy_paths") or []):
        if not rel:
            continue
        p = CR / rel
        if p.is_file() and p.stat().st_size >= MIN_BYTES:
            return p
    return None


def build_prompt(entry):
    return PROMPT.format(name=entry["name"], role=entry.get("role", "politician"))


def generate(slug, piece_id, force=False):
    data = load_manifest()
    entry = data["politicians"].get(slug)
    if not entry:
        print(f"ERR: unknown caricature_slug {slug!r}", file=sys.stderr)
        sys.exit(2)
    out_rel = entry["path"]
    out_path = CR / out_rel
    if not force:
        hit = resolve_existing(entry)
        if hit:
            return hit
        # Fallback: Wikipedia portrait cache (fetch-wikipedia-photos.mjs).
        # Prevents FAL hits when the caricature isn't yet generated and the
        # account is rate-limited / out of credit. CR new-news ships clean
        # with a Wikipedia portrait until the FLUX caricature lane is funded.
        wiki = CR / "public/photos/wikipedia" / f"{slug}.jpg"
        if wiki.is_file() and wiki.stat().st_size >= MIN_BYTES:
            print(f"  [caricature {slug}] FAL-skip → using Wikipedia portrait {wiki.relative_to(CR)}")
            return wiki
    out_path.parent.mkdir(parents=True, exist_ok=True)
    import importlib.util
    spec = importlib.util.spec_from_file_location("fal_stills", CR / "scripts/pipeline/fal-stills-gen.py")
    fal = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(fal)
    still = {
        "id": slug,
        "prompt": build_prompt(entry),
        "image_size": "portrait_4_3",
    }
    api_key = fal.get_api_key()
    _, path, cost, err = fal.gen_still(still, "flux-pro", api_key, out_path.parent, piece_id or slug)
    if err or not path:
        print(f"ERR: caricature {slug}: {err}", file=sys.stderr)
        sys.exit(2)
    if path != out_path and path.exists():
        path.replace(out_path)
    print(f"✅ caricature {slug} → {out_path.relative_to(CR)} (${cost:.3f})")
    return out_path


def resolve_portrait_path(slug):
    """Cached caricature, legacy path, or Wikipedia fallback — no API spend."""
    data = load_manifest()
    entry = data["politicians"].get(slug)
    if entry:
        hit = resolve_existing(entry)
        if hit:
            return hit
    wiki = CR / "public/photos/wikipedia" / f"{slug}.jpg"
    if wiki.is_file() and wiki.stat().st_size >= MIN_BYTES:
        return wiki
    return None


def ensure_caricature(slug, piece_id="manual", force=False):
    """Callable from produce-from-storyboard."""
    return generate(slug, piece_id, force=force)


def main():
    args = sys.argv[1:]

    def get(flag, default=None):
        if flag in args:
            i = args.index(flag)
            return args[i + 1] if i + 1 < len(args) else default
        return default

    if "--list" in args:
        data = load_manifest()
        for slug, e in data["politicians"].items():
            hit = resolve_existing(e)
            status = "cached" if hit else "missing"
            print(f"  {slug:<22} {status:<8} {e['name']}")
        return

    slugs = get("--ensure") or get("--generate")
    if not slugs:
        print(__doc__)
        sys.exit(0)
    piece = get("--piece", "caricature-batch")
    force = "--force" in args
    for slug in slugs.split(","):
        slug = slug.strip()
        if slug:
            ensure_caricature(slug, piece_id=piece, force=force)


if __name__ == "__main__":
    main()
