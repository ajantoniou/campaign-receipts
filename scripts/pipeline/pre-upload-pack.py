#!/usr/bin/env python3
"""
Pre-upload pack — thumbnail + metadata + ship checklist roster.

Runs after render, before youtube-upload.py. Writes:
  _build/<slug>/thumbnail.jpg
  _build/<slug>/description.md  (or build dir for shorts)
  eng/qc-reports/<slug>/upload-metadata.md

Usage:
  python3 pre-upload-pack.py --slug sealed-aipac-iran-deal-v7 --mode longform \\
    --build _build/sealed-aipac-iran-deal-v7 --master _build/.../master.mp4

  python3 pre-upload-pack.py --slug sealed-002-aipac-embassy --mode short \\
    --build scripts/shorts/_build/002 --master public/shorts/sealed-002-aipac-embassy.mp4
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

REPO = Path("/Applications/DrAntoniou Projects/AgentCompanies")
CR = REPO / "companies/campaign-receipts"
META_DIR = CR / "eng/youtube-meta"
PIPE = CR / "scripts/pipeline"
ROSTER = CR / "eng/PRODUCTION-ROSTER.md"
MUSIC = REPO / "companies/Sealed/public/movie/_build_v4/music.mp3"


def run(cmd, label):
    print(f"\n▶ {label}")
    print(" ".join(str(c) for c in cmd))
    r = subprocess.run(cmd)
    if r.returncode != 0:
        print(f"❌ {label} failed", file=sys.stderr)
        sys.exit(r.returncode)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slug", required=True)
    ap.add_argument("--mode", choices=("short", "longform"), required=True)
    ap.add_argument("--build", required=True)
    ap.add_argument("--master", help="Final mp4 for ship-checklist")
    ap.add_argument("--storyboard", help="Longform storyboard path")
    ap.add_argument("--skip-thumb", action="store_true")
    ap.add_argument("--skip-ship", action="store_true")
    args = ap.parse_args()

    meta_path = META_DIR / f"{args.slug}.json"
    if not meta_path.is_file():
        print(f"ERR: missing {meta_path}", file=sys.stderr)
        sys.exit(1)
    meta = json.loads(meta_path.read_text())

    build = CR / args.build if not Path(args.build).is_absolute() else Path(args.build)
    build.mkdir(parents=True, exist_ok=True)

    qc_dir = CR / "eng/qc-reports" / args.slug
    qc_dir.mkdir(parents=True, exist_ok=True)

    # Locked upload metadata (viral panel 01 + 04 + 06 + 07)
    # 2026-05-22 (afternoon): existing `monetization` block already drives the
    # AI-disclosure splice + ad-friendly call print. This pass adds a per-slug
    # `monetization.qc_report` warn line parallel to the existing `packaging`
    # warn, so the YouTube monetization persona (07) artifact is surfaced in
    # `upload-metadata.md` for every ship. Warn-only today; next session:
    # flip the `qc_report` check to hard-fail once the canon set has reports
    # on disk (see PRODUCTION-ROSTER "binding before upload" paragraph).
    upload_md = qc_dir / "upload-metadata.md"
    tags = ", ".join(meta.get("tags", []))
    pkg = meta.get("packaging")
    mon = meta.get("monetization") or {}
    qc_report = mon.get("qc_report")
    body = [
        f"# Upload metadata — {args.slug}",
        "",
        "**MrBeast packaging:** "
        + (f"`{pkg}`" if pkg else "⚠️ missing — run `personas/viral-panel/06-mrbeast-packaging.md` then update `eng/youtube-meta/<slug>.json`"),
        "",
        "**YouTube monetization QC report:** "
        + (f"`{qc_report}`" if qc_report else "⚠️ missing — run `personas/viral-panel/07-youtube-monetization.md` then add `monetization.qc_report` field to `eng/youtube-meta/<slug>.json` (warn-only today; hard-fail next session)"),
        "",
        f"**Title (ship):** {meta['title']}",
        "",
        "**Alt titles:**",
    ]
    for t in meta.get("title_alt", []):
        body.append(f"- {t}")
    body.extend([
        "",
        f"**Tags:** {tags}",
        "",
        "## Description",
        "",
        meta.get("description", ""),
        "",
        "## Persona roster",
        f"See `{ROSTER.relative_to(CR)}` — council + viral panel run before upload.",
        "",
        f"**Music asset:** `{MUSIC.relative_to(REPO)}` ({'exists' if MUSIC.is_file() else 'MISSING'})",
    ])
    upload_md.write_text("\n".join(body))

    # Monetization gate (founder lock 2026-05-22): if youtube-meta has a
    # `monetization.ai_disclosure_line`, append it to description.md so the
    # YouTube Studio classifier (mass-produced AI policy, 2025-07-15) sees
    # explicit narration provenance. See `personas/viral-panel/07-youtube-monetization.md`.
    desc = meta.get("description", "")
    disclosure = mon.get("ai_disclosure_line")
    if disclosure and disclosure not in desc:
        desc = desc.rstrip() + f"\n\n— {disclosure}\n"
    (build / "description.md").write_text(desc + ("\n" if not desc.endswith("\n") else ""))
    (build / "youtube-meta.json").write_text(json.dumps(meta, indent=2))

    print(f"✅ upload-metadata: {upload_md}")
    if mon:
        ad_call = mon.get("ad_friendly_call", "?")
        report_tag = " · qc_report" if qc_report else " · ⚠️ qc_report missing"
        print(f"   monetization: ad-friendly={ad_call}{' · disclosed' if disclosure else ''}{report_tag}")
    else:
        print(f"   monetization: ⚠️  no `monetization` block in youtube-meta — see personas/viral-panel/07-youtube-monetization.md")

    if not args.skip_thumb:
        th = meta.get("thumbnail", {})
        thumb_out = build / "thumbnail.jpg"
        # CR new-news = navy/high-contrast MrBeast-style; SEALED = audit-doc parchment.
        # Slug heuristic: any "cr-" prefix or program=cr-new-news in meta.
        is_cr_news = (
            args.slug.startswith("cr-")
            or meta.get("program") == "cr-new-news"
            or th.get("template") == "cr-new-news"
        )
        cmd = [
            "node", str(PIPE / "generate-thumbnail.mjs"),
            "--headline", th.get("headline", "SEALED"),
            "--subline", th.get("subline", ""),
            "--verdict", th.get("verdict", "BROKEN"),
            "--out", str(thumb_out),
        ]
        if is_cr_news:
            cmd.extend(["--template", "cr-new-news"])
            portrait = th.get("portrait")
            if portrait:
                p = CR / portrait if not Path(portrait).is_absolute() else Path(portrait)
                cmd.extend(["--portrait", str(p)])
        run(cmd, "generate-thumbnail.mjs")

    # Ship checklist
    if not args.skip_ship and args.master:
        master = CR / args.master if not Path(args.master).is_absolute() else Path(args.master)
        cmd = [
            "python3", str(PIPE / "ship-checklist.py"),
            "--mode", args.mode,
            "--build", str(build),
        ]
        if args.mode == "short":
            cmd.extend(["--master", str(master)])
        else:
            sb = args.storyboard or f"eng/storyboards/{args.slug}.json"
            cmd.extend(["--storyboard", str(CR / sb if not Path(sb).is_absolute() else sb)])
        run(cmd, "ship-checklist.py")

    # Community post draft: generated every pre-upload pass so Studio posting
    # can happen right after article/landing-page publish.
    run(
        ["python3", str(PIPE / "generate-youtube-post.py"), "--slug", args.slug],
        "generate-youtube-post.py",
    )

    print(f"\n✅ pre-upload-pack complete for {args.slug}")
    print(f"   Next: youtube-upload.py --video ... --title \"{meta['title'][:60]}...\"")
    print(f"          --description-file {build / 'description.md'}")
    print(f"          --thumbnail {build / 'thumbnail.jpg'} --privacy {meta.get('privacy', 'public')}")


if __name__ == "__main__":
    main()
