#!/usr/bin/env python3
"""
Extract verbatim Trump quotes from the Grab It Nation EPUB into structured JSON + Markdown.

Source: companies/concise/books-source/grabit-nation/Grab-It-Nation.epub
Output:
  research/grabit-nation-quotes.json   — machine-readable structured data
  research/grabit-nation-quotes.md     — human-readable, organized by chapter

Deterministic. No LLM in the loop. No content filtering. Run any time:

    python3 scripts/extract-grabit-nation.py

The EPUB has 104 chapter XHTML files; 86 contain a verbatim Trump quote in a
<blockquote>, with the source attribution in the <p> immediately following.
Some chapter files are structural (Contents, Disclaimer, section dividers
like "On the Economy") and have no quote — those are skipped, not flagged
as errors.
"""

import json
import re
import zipfile
from html import unescape
from pathlib import Path
from typing import Optional

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
EPUB_PATH = REPO_ROOT / "companies" / "concise" / "books-source" / "grabit-nation" / "Grab-It-Nation.epub"
OUT_DIR = Path(__file__).resolve().parent.parent / "research"
JSON_OUT = OUT_DIR / "grabit-nation-quotes.json"
MD_OUT = OUT_DIR / "grabit-nation-quotes.md"


def strip_tags(s: str) -> str:
    """Remove HTML tags and collapse whitespace; keep entities decoded."""
    s = re.sub(r"<[^>]+>", " ", s)
    s = unescape(s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def parse_chapter(filename: str, xml_text: str) -> Optional[dict]:
    """Return a dict for chapters that contain a verbatim quote, else None."""
    title_match = re.search(r'<h1[^>]*chapter-title[^>]*>([^<]+)</h1>', xml_text)
    number_match = re.search(r'<h1[^>]*chapter-number[^>]*>([^<]+)</h1>', xml_text)
    quote_match = re.search(r'<blockquote[^>]*>(.*?)</blockquote>', xml_text, re.DOTALL)
    if not (title_match and quote_match):
        return None

    title = strip_tags(title_match.group(1))
    number = strip_tags(number_match.group(1)) if number_match else None
    quote = strip_tags(quote_match.group(1))

    # Source is usually a <p> following the blockquote, e.g.
    # <p>Source: 2016 CNN-Telemundo Republican debate , Feb 25, 2016</p>
    src_match = re.search(
        r'</blockquote>\s*<p[^>]*>\s*Source:\s*(.+?)</p>', xml_text, re.DOTALL,
    )
    if not src_match:
        # Some chapters use "Sources:" or omit the prefix.
        src_match = re.search(
            r'</blockquote>\s*<p[^>]*>(.+?)</p>', xml_text, re.DOTALL,
        )
    source = strip_tags(src_match.group(1)) if src_match else None
    if source:
        source = re.sub(r"^Source[s]?:\s*", "", source).strip()

    # Parse a date out of the source line if present.
    date_match = None
    if source:
        date_match = re.search(
            r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})',
            source,
        )
    date = date_match.group(1) if date_match else None

    # Heuristic year extraction if no full date found.
    year = None
    if source:
        y = re.search(r'(20[01]\d|199\d)', source)
        if y:
            year = int(y.group(1))

    # Order in book — pull from filename prefix e.g. "13_china.xhtml" → 13
    order_match = re.match(r'^(\d+)_', filename)
    order = int(order_match.group(1)) if order_match else None

    return {
        "order": order,
        "chapter_number": number,
        "title": title,
        "filename": filename,
        "quote": quote,
        "source": source,
        "date": date,
        "year": year,
    }


def main():
    if not EPUB_PATH.exists():
        raise SystemExit(f"EPUB not found at {EPUB_PATH}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    entries: list[dict] = []
    skipped: list[str] = []

    with zipfile.ZipFile(EPUB_PATH) as zf:
        chapter_files = sorted(
            n for n in zf.namelist()
            if n.startswith("OEBPS/") and n.endswith(".xhtml")
        )
        for name in chapter_files:
            with zf.open(name) as fh:
                xml_text = fh.read().decode("utf-8", errors="replace")
            entry = parse_chapter(Path(name).name, xml_text)
            if entry:
                entries.append(entry)
            else:
                skipped.append(Path(name).name)

    entries.sort(key=lambda e: e["order"] or 0)

    # ---- Write JSON ----
    JSON_OUT.write_text(
        json.dumps({"count": len(entries), "skipped": skipped, "entries": entries}, indent=2),
        encoding="utf-8",
    )

    # ---- Write Markdown ----
    by_year: dict = {}
    no_year: list = []
    for e in entries:
        if e["year"]:
            by_year.setdefault(e["year"], []).append(e)
        else:
            no_year.append(e)

    lines: list[str] = []
    lines.append("# Grab It Nation — Extracted Quotes (canonical corpus)")
    lines.append("")
    lines.append(f"**Source PDF/EPUB:** `companies/concise/books-source/grabit-nation/Grab-It-Nation.epub`")
    lines.append(f"**Extracted:** via `scripts/extract-grabit-nation.py` (deterministic, no LLM)")
    lines.append(f"**Total verbatim Trump quotes:** {len(entries)}")
    lines.append("")
    if skipped:
        lines.append(f"**Skipped (no quote / structural pages):** {len(skipped)}")
        lines.append("<details><summary>Skipped chapter files</summary>")
        lines.append("")
        for s in sorted(skipped):
            lines.append(f"- `{s}`")
        lines.append("")
        lines.append("</details>")
        lines.append("")
    lines.append("## Distribution")
    lines.append("")
    lines.append("| Year | Quotes |")
    lines.append("| --- | --- |")
    for y in sorted(by_year.keys()):
        lines.append(f"| {y} | {len(by_year[y])} |")
    if no_year:
        lines.append(f"| (no year in attribution) | {len(no_year)} |")
    lines.append("")

    lines.append("## Quotes — in book order")
    lines.append("")
    for e in entries:
        lines.append(f"### {e['order']:>3}. {e['title']}")
        lines.append("")
        lines.append(f"> {e['quote']}")
        lines.append("")
        if e["source"]:
            lines.append(f"**Source:** {e['source']}")
        if e["date"]:
            lines.append(f"**Date:** {e['date']}")
        lines.append("")
        lines.append("---")
        lines.append("")

    MD_OUT.write_text("\n".join(lines), encoding="utf-8")

    print(f"Extracted {len(entries)} quotes.")
    print(f"  JSON: {JSON_OUT}")
    print(f"  Markdown: {MD_OUT}")
    if skipped:
        print(f"Skipped {len(skipped)} structural / non-quote chapters.")


if __name__ == "__main__":
    main()
