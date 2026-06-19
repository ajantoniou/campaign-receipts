"""
Build the retail-quality SEALED v1 PDF using WeasyPrint.

Produces a professionally typeset book with:
- Palatino serif body, proper leading and margins
- Running headers + page numbers
- Formatted tables (not raw markdown)
- Chapter 1 illustration plates embedded
- Cover page with archive aesthetic

Usage: python3 scripts/build-retail-pdf.py
Output: artifacts/SEALED-v1-retail.pdf
"""

from __future__ import annotations

import re
import base64
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts"
CONTENT_MD = ARTIFACTS / "sealed-v1-content.md"
OUTPUT = ARTIFACTS / "SEALED-v1-retail.pdf"
PUBLIC = ROOT / "public"

PLATES = {
    "context": PUBLIC / "sealed-ch1-context-rail.jpg",
    "margin": PUBLIC / "sealed-ch1-margin-rail.jpg",
    "grade": PUBLIC / "sealed-ch1-grade-key.jpg",
}


def img_data_uri(path: Path) -> str:
    data = path.read_bytes()
    b64 = base64.b64encode(data).decode()
    return f"data:image/jpeg;base64,{b64}"


def parse_manuscript(raw: str) -> dict:
    """Extract structured sections from the manuscript markdown."""
    sections = {}

    # Half-title
    m = re.search(r"## Half-title page\n\n(.*?)(?=\n---\n|\n## )", raw, re.DOTALL)
    if m:
        sections["half_title"] = m.group(1).strip()

    # Foreword
    m = re.search(r"## Foreword.*?\n\n(.*?)(?=\n---\n|\n## )", raw, re.DOTALL)
    if m:
        sections["foreword"] = m.group(1).strip()

    # Why this exists
    m = re.search(r"## Why this exists.*?\n\n(.*?)(?=\n---\n|\n## )", raw, re.DOTALL)
    if m:
        sections["why"] = m.group(1).strip()

    # Methodology
    m = re.search(r"## How we know.*?\n\n(.*?)(?=\n---\n|\n## )", raw, re.DOTALL)
    if m:
        sections["methodology"] = m.group(1).strip()

    # Chapter 1
    start = raw.find("### Chapter 1")
    if start == -1:
        raise ValueError("Chapter 1 not found")
    tail = raw[start:]
    end = tail.find("### Chapter 2")
    ch1 = tail[:end] if end != -1 else tail
    sections["chapter1"] = ch1.strip()

    return sections


def md_to_html(text: str) -> str:
    """Convert markdown-ish text to HTML. Handles bold, italic, links, lists."""
    lines = text.split("\n")
    html_parts = []
    in_list = False

    for line in lines:
        stripped = line.strip()
        if not stripped:
            if in_list:
                html_parts.append("</ul>")
                in_list = False
            html_parts.append("")
            continue

        # List items
        if stripped.startswith("- ") or stripped.startswith("* "):
            if not in_list:
                html_parts.append("<ul>")
                in_list = True
            item = stripped[2:]
            item = inline_format(item)
            html_parts.append(f"  <li>{item}</li>")
            continue

        # Numbered items
        num_match = re.match(r"^(\d+)\.\s+(.*)", stripped)
        if num_match:
            if not in_list:
                html_parts.append('<ol>')
                in_list = True
            item = inline_format(num_match.group(2))
            html_parts.append(f"  <li>{item}</li>")
            continue

        if in_list:
            html_parts.append("</ul>")
            in_list = False

        stripped = inline_format(stripped)
        html_parts.append(stripped)

    if in_list:
        html_parts.append("</ul>")

    # Join and wrap paragraphs
    result = "\n".join(html_parts)
    # Wrap loose text lines in <p> tags
    final_lines = []
    for line in result.split("\n"):
        if not line.strip():
            continue
        if line.strip().startswith("<"):
            final_lines.append(line)
        else:
            final_lines.append(f"<p>{line}</p>")
    return "\n".join(final_lines)


def inline_format(text: str) -> str:
    """Handle bold, italic, links, code."""
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"\*(.+?)\*", r"<em>\1</em>", text)
    text = re.sub(r"`(.+?)`", r"<code>\1</code>", text)
    text = re.sub(r"\[(.+?)\]\((.+?)\)", r"\1", text)
    text = text.replace("→", "&rarr;").replace("—", "&mdash;")
    return text


def build_chapter1_html(ch1_md: str) -> str:
    """Parse Chapter 1 markdown into structured HTML sections."""
    html_parts = []

    # Split into entries/sections
    lines = ch1_md.split("\n")
    current_block = []
    blocks = []

    for line in lines:
        if line.startswith("#### ") or line.startswith("##### ") or line.startswith("### Ledger"):
            if current_block:
                blocks.append("\n".join(current_block))
            current_block = [line]
        else:
            current_block.append(line)
    if current_block:
        blocks.append("\n".join(current_block))

    for block in blocks:
        block = block.strip()
        if not block:
            continue

        lines = block.split("\n")
        first = lines[0]

        # Chapter title (skip, handled separately)
        if first.startswith("### Chapter 1"):
            intro = "\n".join(lines[1:]).strip()
            if intro:
                html_parts.append(f'<p class="chapter-intro">{inline_format(intro)}</p>')
            continue

        # Section heading
        if first.startswith("#### "):
            title = first.replace("#### ", "")
            title = inline_format(title)
            html_parts.append(f'<h3 class="section-heading">{title}</h3>')
            body = "\n".join(lines[1:]).strip()
            if body:
                html_parts.append(md_to_html(body))
            continue

        # Subsection / Entry heading
        if first.startswith("##### "):
            title = first.replace("##### ", "")
            title = inline_format(title)
            html_parts.append(f'<h4 class="entry-heading">{title}</h4>')

            body = "\n".join(lines[1:]).strip()

            # Extract rail line
            rail_match = re.search(
                r"\*\*Rail\s*[—–-]\s*(.*?)\*\*\s*\n",
                body,
            )
            if rail_match:
                rail_text = rail_match.group(1).strip()
                html_parts.append(
                    f'<div class="margin-rail"><span class="rail-label">RAIL</span> {inline_format(rail_text)}</div>'
                )

            # Extract transcript URL
            url_match = re.search(r"(?:Primary transcript.*?:\s*)(https?://\S+)", body)
            if url_match:
                url = url_match.group(1)
                html_parts.append(
                    f'<p class="source-link">Primary transcript: <a href="{url}">{url[:80]}{"…" if len(url)>80 else ""}</a></p>'
                )

            # Extract verbatim quotes
            quotes = re.findall(r'(?:^|\n)\*"(.+?)"\*', body, re.DOTALL)
            for q in quotes:
                q_clean = q.replace("\n", " ").strip()
                html_parts.append(f'<blockquote class="verbatim">&ldquo;{inline_format(q_clean)}&rdquo;</blockquote>')

            # Extract body paragraphs (after quotes, before paper trail)
            # Get everything between last quote and "Paper trail:"
            body_text = body
            # Remove rail line
            body_text = re.sub(r"\*\*Rail\s*[—–-].*?\*\*\s*\n", "", body_text)
            # Remove transcript URL line
            body_text = re.sub(r"Primary transcript.*?https?://\S+\s*\n?", "", body_text)
            # Remove verbatim quotes
            body_text = re.sub(r'\*".*?"\*', "", body_text, flags=re.DOTALL)
            # Split at Paper trail
            trail_split = re.split(r"\*\*Paper trail:\*\*", body_text)

            if trail_split[0].strip():
                paras = [p.strip() for p in trail_split[0].split("\n\n") if p.strip()]
                for p in paras:
                    if p and not p.startswith("**"):
                        html_parts.append(f"<p>{inline_format(p)}</p>")

            # Paper trail
            if len(trail_split) > 1:
                trail = trail_split[1].strip()
                # Remove "Your grade:" section
                grade_split = re.split(r"\*\*Your grade:\*\*", trail)
                trail_content = grade_split[0].strip()
                html_parts.append(
                    f'<div class="paper-trail"><strong>Paper trail:</strong> {inline_format(trail_content)}</div>'
                )

                if len(grade_split) > 1:
                    grade_text = grade_split[1].strip()
                    html_parts.append(
                        f'<div class="your-grade"><strong>Your grade:</strong> {inline_format(grade_text)}</div>'
                    )

            continue

        # Ledger entries heading
        if first.startswith("### Ledger"):
            title = first.replace("### ", "")
            html_parts.append(f'<h2 class="ledger-heading">{inline_format(title)}</h2>')
            body = "\n".join(lines[1:]).strip()
            if body:
                html_parts.append(f"<p>{inline_format(body)}</p>")
            continue

        # Default: just convert
        html_parts.append(md_to_html(block))

    return "\n".join(html_parts)


def build_html(sections: dict) -> str:
    """Build the complete HTML document for WeasyPrint."""

    ctx_uri = img_data_uri(PLATES["context"])
    margin_uri = img_data_uri(PLATES["margin"])
    grade_uri = img_data_uri(PLATES["grade"])

    ch1_html = build_chapter1_html(sections["chapter1"])
    foreword_html = md_to_html(sections.get("foreword", ""))
    why_html = md_to_html(sections.get("why", ""))
    methodology_html = md_to_html(sections.get("methodology", ""))

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>SEALED — The 2016 Promises Before the Deals</title>
<style>
@page {{
    size: 6in 9in;
    margin: 0.85in 0.75in 1in 0.75in;
    @bottom-center {{
        content: counter(page);
        font-family: Palatino, 'Palatino Linotype', Georgia, serif;
        font-size: 9pt;
        color: #666;
    }}
    @top-center {{
        content: "SEALED — The 2016 Promises";
        font-family: Palatino, 'Palatino Linotype', Georgia, serif;
        font-size: 7.5pt;
        font-variant: small-caps;
        letter-spacing: 0.08em;
        color: #888;
    }}
}}
@page :first {{
    @bottom-center {{ content: none; }}
    @top-center {{ content: none; }}
}}
@page cover {{
    margin: 0;
    @bottom-center {{ content: none; }}
    @top-center {{ content: none; }}
}}
@page halftitle {{
    @bottom-center {{ content: none; }}
    @top-center {{ content: none; }}
}}
@page plate {{
    margin: 0.5in;
    @top-center {{ content: none; }}
    @bottom-center {{
        content: counter(page);
        font-family: Palatino, 'Palatino Linotype', Georgia, serif;
        font-size: 9pt;
        color: #666;
    }}
}}

/* Base */
body {{
    font-family: Palatino, 'Palatino Linotype', Georgia, serif;
    font-size: 10.5pt;
    line-height: 1.55;
    color: #1a1a1a;
    orphans: 3;
    widows: 3;
}}

/* Cover page */
.cover {{
    page: cover;
    page-break-after: always;
    width: 6in;
    height: 9in;
    background: #0a0a0a;
    color: #e8e4dc;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 1.2in 0.9in;
    box-sizing: border-box;
}}
.cover h1 {{
    font-size: 42pt;
    font-weight: 700;
    letter-spacing: 0.15em;
    margin: 0 0 0.15in;
    color: #c9a84c;
    border-bottom: 2pt solid #c9a84c;
    padding-bottom: 0.15in;
}}
.cover .subtitle {{
    font-size: 16pt;
    font-weight: 400;
    font-style: italic;
    line-height: 1.4;
    margin: 0.2in 0 0.6in;
    color: #c4bfb4;
}}
.cover .tagline {{
    font-size: 10pt;
    font-variant: small-caps;
    letter-spacing: 0.12em;
    color: #888;
    margin-top: auto;
}}
.cover .imprint {{
    font-size: 8.5pt;
    color: #666;
    margin-top: 0.3in;
}}

/* Half-title */
.half-title {{
    page: halftitle;
    page-break-after: always;
    padding-top: 2.5in;
    text-align: center;
}}
.half-title h1 {{
    font-size: 28pt;
    font-weight: 700;
    letter-spacing: 0.1em;
    margin-bottom: 0.15in;
}}
.half-title .subtitle {{
    font-size: 13pt;
    font-style: italic;
    color: #555;
}}
.half-title .imprint-line {{
    font-size: 9pt;
    color: #888;
    margin-top: 1.5in;
    font-variant: small-caps;
    letter-spacing: 0.08em;
}}

/* Frontmatter */
.frontmatter {{
    page-break-after: always;
}}
.frontmatter h2 {{
    font-size: 16pt;
    font-weight: 700;
    margin: 0 0 0.2in;
    border-bottom: 0.5pt solid #ccc;
    padding-bottom: 0.08in;
}}
.frontmatter p {{
    text-indent: 0;
    margin-bottom: 0.12in;
}}

/* Chapter heading */
.chapter-title {{
    font-size: 22pt;
    font-weight: 700;
    margin: 0 0 0.1in;
    page-break-before: always;
}}
.chapter-number {{
    font-size: 10pt;
    font-variant: small-caps;
    letter-spacing: 0.15em;
    color: #888;
    margin-bottom: 0.05in;
    display: block;
}}
.chapter-intro {{
    font-style: italic;
    color: #444;
    margin-bottom: 0.25in;
    font-size: 10pt;
}}

/* Section headings */
.section-heading {{
    font-size: 14pt;
    font-weight: 700;
    margin: 0.35in 0 0.15in;
    page-break-after: avoid;
}}

/* Entry headings */
.entry-heading {{
    font-size: 12pt;
    font-weight: 700;
    margin: 0.3in 0 0.1in;
    page-break-after: avoid;
}}

/* Margin rail box */
.margin-rail {{
    background: #f5f2ec;
    border-left: 3pt solid #c9a84c;
    padding: 0.1in 0.15in;
    margin: 0.1in 0 0.12in;
    font-size: 9pt;
    line-height: 1.45;
    color: #333;
}}
.rail-label {{
    font-weight: 700;
    font-variant: small-caps;
    letter-spacing: 0.1em;
    color: #8a7a50;
    margin-right: 0.06in;
}}

/* Source link */
.source-link {{
    font-size: 8.5pt;
    color: #666;
    margin: 0.04in 0 0.1in;
    word-break: break-all;
}}
.source-link a {{
    color: #555;
    text-decoration: none;
}}

/* Verbatim quote */
blockquote.verbatim {{
    border-left: 2pt solid #999;
    margin: 0.12in 0 0.12in 0.2in;
    padding: 0.08in 0 0.08in 0.18in;
    font-style: italic;
    font-size: 10.5pt;
    color: #222;
    line-height: 1.5;
}}

/* Paper trail */
.paper-trail {{
    background: #faf8f4;
    border: 0.5pt solid #ddd;
    padding: 0.1in 0.12in;
    margin: 0.1in 0 0.08in;
    font-size: 9pt;
    color: #444;
}}

/* Your grade */
.your-grade {{
    font-size: 9pt;
    color: #666;
    margin: 0.06in 0 0.2in;
    font-style: italic;
}}

/* Body paragraphs */
p {{
    margin: 0 0 0.1in;
    text-align: justify;
    hyphens: auto;
}}

/* Grade key table */
table.grade-table {{
    width: 100%;
    border-collapse: collapse;
    margin: 0.15in 0 0.2in;
    font-size: 9.5pt;
}}
table.grade-table th {{
    text-align: left;
    font-weight: 700;
    font-variant: small-caps;
    letter-spacing: 0.05em;
    border-bottom: 1.5pt solid #333;
    padding: 0.06in 0.1in;
    color: #333;
}}
table.grade-table td {{
    padding: 0.06in 0.1in;
    border-bottom: 0.5pt solid #ddd;
    vertical-align: top;
}}
table.grade-table td:first-child {{
    font-weight: 700;
    white-space: nowrap;
    width: 1in;
}}

/* Three-part shape diagram */
.shape-diagram {{
    background: #f5f2ec;
    border: 1pt solid #d4cfc5;
    padding: 0.12in 0.18in;
    margin: 0.15in 0;
    font-family: 'Courier New', Courier, monospace;
    font-size: 8.5pt;
    line-height: 1.6;
    color: #333;
}}

/* Plate pages */
.plate-page {{
    page: plate;
    page-break-before: always;
    page-break-after: always;
    text-align: center;
    padding-top: 0.3in;
}}
.plate-page img {{
    max-width: 100%;
    max-height: 7in;
    display: block;
    margin: 0 auto;
}}
.plate-caption {{
    font-size: 8pt;
    font-style: italic;
    color: #888;
    margin-top: 0.15in;
    text-align: center;
}}

/* Ledger heading */
.ledger-heading {{
    font-size: 16pt;
    font-weight: 700;
    margin: 0.3in 0 0.1in;
    border-bottom: 0.5pt solid #ccc;
    padding-bottom: 0.06in;
    page-break-before: always;
}}

/* Horizontal rule */
hr {{
    border: none;
    border-top: 0.5pt solid #ccc;
    margin: 0.2in 0;
}}

/* Lists */
ul, ol {{
    margin: 0.08in 0 0.12in 0.25in;
    padding: 0;
}}
li {{
    margin-bottom: 0.06in;
    font-size: 10pt;
}}

code {{
    font-family: 'Courier New', Courier, monospace;
    font-size: 9pt;
    background: #f0ede6;
    padding: 1pt 3pt;
}}

strong {{
    font-weight: 700;
}}

/* Copyright page */
.copyright-page {{
    page: halftitle;
    page-break-after: always;
    font-size: 8.5pt;
    color: #666;
    padding-top: 4in;
}}
.copyright-page p {{
    text-align: left;
    text-indent: 0;
    margin-bottom: 0.08in;
}}
</style>
</head>
<body>

<!-- COVER -->
<div class="cover">
  <h1>SEALED</h1>
  <div class="subtitle">The 2016 Promises<br>Before the Deals</div>
  <div class="tagline">A primary-source archive of campaign commitments,<br>preserved for comparison with what followed.</div>
  <div class="imprint">SEALED Press &middot; Demiurgic Labs</div>
</div>

<!-- HALF TITLE -->
<div class="half-title">
  <h1>SEALED</h1>
  <div class="subtitle">The 2016 Promises &mdash; Before the Deals</div>
  <div class="imprint-line">sealed press &middot; demiurgic labs imprint</div>
</div>

<!-- COPYRIGHT -->
<div class="copyright-page">
  <p>&copy; 2026 SEALED Press. All rights reserved.</p>
  <p>Published by SEALED Press / Demiurgic Labs imprint.</p>
  <p>No part of this publication may be reproduced, distributed, or transmitted
  in any form without prior written permission, except for brief quotations
  in reviews and certain noncommercial uses permitted by copyright law.</p>
  <p>Licensed for personal, non-commercial use. Redistribution, resale, or
  training of language models on the full text without permission is prohibited.</p>
  <p style="margin-top: 0.3in;">First digital edition, 2026.</p>
</div>

<!-- FOREWORD -->
<div class="frontmatter">
  <h2>Foreword</h2>
  {foreword_html}
</div>

<!-- WHY THIS EXISTS -->
<div class="frontmatter">
  <h2>Why This Exists</h2>
  {why_html}
</div>

<!-- METHODOLOGY -->
<div class="frontmatter">
  <h2>How We Know</h2>
  {methodology_html}
</div>

<!-- CHAPTER 1 -->
<div>
  <span class="chapter-number">Chapter One</span>
  <h1 class="chapter-title">Trail Mechanics</h1>

  {ch1_html}
</div>

<!-- Replace the raw markdown table with a proper HTML table for the grade key -->

</body>
</html>"""


def patch_grade_table(html: str) -> str:
    """Replace any raw markdown pipe-table for the grade key with a proper HTML table."""
    # Remove raw markdown table lines
    raw_table = re.search(
        r'<p>\| Label \| Plain meaning \|</p>.*?<p>\| <strong>MOOT</strong>.*?</p>',
        html,
        re.DOTALL,
    )
    if raw_table:
        replacement = """<table class="grade-table">
<thead><tr><th>Label</th><th>Plain meaning</th></tr></thead>
<tbody>
<tr><td>KEPT</td><td>They followed through in a way that matches the words.</td></tr>
<tr><td>PARTIAL</td><td>Real movement, but not the full promise.</td></tr>
<tr><td>BROKEN</td><td>Clear retreat or long stall where action was possible.</td></tr>
<tr><td>BLOCKED</td><td>Courts, Congress, or hard facts stopped cold progress.</td></tr>
<tr><td>MOOT</td><td>The world changed so much that the promise no longer fits.</td></tr>
</tbody>
</table>"""
        html = html[:raw_table.start()] + replacement + html[raw_table.end():]

    # Also remove the separator line |-------|
    html = re.sub(r'<p>\|[-]+\|[-]+\|</p>\s*', '', html)

    return html


def insert_plates(html: str) -> str:
    """Insert plate pages at the right structural positions."""
    ctx_uri = img_data_uri(PLATES["context"])
    margin_uri = img_data_uri(PLATES["margin"])
    grade_uri = img_data_uri(PLATES["grade"])

    # Insert context rail plate before Section A content
    context_plate = f"""<div class="plate-page">
<img src="{ctx_uri}" alt="Context rail ledger diagram">
<div class="plate-caption">Figure 1 &mdash; The three-column context rail: where, when, and how to read each entry.</div>
</div>"""

    # Insert margin plate before Section C
    margin_plate = f"""<div class="plate-page">
<img src="{margin_uri}" alt="Campaign trail map showing margin rail locations">
<div class="plate-caption">Figure 2 &mdash; Campaign trail map: how the same promise traveled from tower to arena.</div>
</div>"""

    # Insert grade plate after the grade table
    grade_plate = f"""<div class="plate-page">
<img src="{grade_uri}" alt="Grade key scorecard plaque">
<div class="plate-caption">Figure 3 &mdash; The five-label scorecard: your grades, not ours.</div>
</div>"""

    # Insert context plate before first section heading
    html = html.replace(
        '<h3 class="section-heading">Section A',
        context_plate + '\n<h3 class="section-heading">Section A',
        1
    )

    # Insert margin plate before Section B -> C transition
    html = html.replace(
        '<h3 class="section-heading">Section C',
        margin_plate + '\n<h3 class="section-heading">Section C',
        1
    )

    # Insert grade plate after the grade table
    html = html.replace(
        '</table>',
        '</table>\n' + grade_plate,
        1
    )

    return html


def insert_shape_diagram(html: str) -> str:
    """Replace raw code-block rendering with a styled diagram."""
    shape_html = """<div class="shape-diagram">
[ MARGIN RAIL: time &nbsp;|&nbsp; place &nbsp;|&nbsp; setting &nbsp;|&nbsp; audience ]<br>
[ VERBATIM QUOTE &mdash; from a live transcript or official text ]<br>
[ BODY &mdash; plain-English walk through the paper trail; you pick the grade ]
</div>"""

    # Replace the raw text version
    html = re.sub(
        r'<p>\[\s*MARGIN RAIL:.*?\]</p>\s*<p>\[\s*VERBATIM QUOTE.*?\]</p>\s*<p>\[\s*BODY.*?\]</p>',
        shape_html,
        html,
        flags=re.DOTALL,
    )

    return html


def main():
    raw = CONTENT_MD.read_text(encoding="utf-8")
    sections = parse_manuscript(raw)
    html = build_html(sections)

    # Post-processing passes
    html = patch_grade_table(html)
    html = insert_shape_diagram(html)
    html = insert_plates(html)

    # Remove empty paragraphs
    html = re.sub(r'<p>\s*</p>', '', html)

    # Generate PDF
    from weasyprint import HTML
    ARTIFACTS.mkdir(exist_ok=True)
    HTML(string=html).write_pdf(str(OUTPUT))
    size_mb = OUTPUT.stat().st_size / (1024 * 1024)
    print(f"Wrote {OUTPUT} ({size_mb:.1f} MB)")


if __name__ == "__main__":
    main()
