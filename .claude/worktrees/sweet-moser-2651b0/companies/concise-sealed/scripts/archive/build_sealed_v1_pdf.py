from __future__ import annotations

import datetime as dt
from pathlib import Path

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
PRODUCT_IMAGES = PUBLIC / "product-images"
ARTIFACTS = ROOT / "artifacts"

OUT_PDF = ARTIFACTS / "SEALED-v1-before-the-deals.pdf"
CONTENT_MD = ARTIFACTS / "sealed-v1-content.md"


def _draw_title_page(c: canvas.Canvas) -> None:
    c.setFont("Helvetica-Bold", 28)
    c.drawString(1.0 * inch, 9.5 * inch, "SEALED")
    c.setFont("Helvetica", 16)
    c.drawString(1.0 * inch, 9.0 * inch, "The 2016 Promises — Before the Deals")
    c.setFont("Helvetica", 11)
    c.drawString(1.0 * inch, 8.6 * inch, f"v1 — generated {dt.date.today().isoformat()}")
    c.setFont("Helvetica-Oblique", 11)
    c.drawString(1.0 * inch, 8.3 * inch, "Re-awakening through verifiable memory.")


def _draw_image_full_width(c: canvas.Canvas, path: Path, top_y: float) -> None:
    if not path.exists():
        return
    page_w, page_h = letter
    margin = 0.75 * inch
    w = page_w - 2 * margin
    # keep aspect ratio by letting reportlab compute height from width via preserveAspectRatio
    c.drawImage(
        str(path),
        margin,
        top_y,
        width=w,
        height=page_h - top_y - margin,
        preserveAspectRatio=True,
        anchor="n",
        mask="auto",
    )


def _draw_wrapped_text(c: canvas.Canvas, text: str, x: float, y: float, max_width: float) -> float:
    c.setFont("Helvetica", 11)
    line_height = 14
    words = text.replace("\r", "").split()
    line = ""
    for w in words:
        test = (line + " " + w).strip()
        if c.stringWidth(test, "Helvetica", 11) <= max_width:
            line = test
            continue
        c.drawString(x, y, line)
        y -= line_height
        line = w
    if line:
        c.drawString(x, y, line)
        y -= line_height
    return y


def _read_md_sections(md_path: Path) -> list[tuple[str, str]]:
    """
    Extremely small parser: split on '## ' headings.
    Returns list of (heading, body).
    """
    raw = md_path.read_text(encoding="utf-8") if md_path.exists() else ""
    parts: list[tuple[str, str]] = []
    cur_h = ""
    cur_body: list[str] = []
    for line in raw.splitlines():
        if line.startswith("## "):
            if cur_h:
                parts.append((cur_h, "\n".join(cur_body).strip()))
            cur_h = line[3:].strip()
            cur_body = []
        else:
            cur_body.append(line)
    if cur_h:
        parts.append((cur_h, "\n".join(cur_body).strip()))
    return parts


def build() -> Path:
    ARTIFACTS.mkdir(parents=True, exist_ok=True)

    c = canvas.Canvas(str(OUT_PDF), pagesize=letter)
    page_w, page_h = letter
    margin = 0.75 * inch

    # Page 1: cover mock if present, else title page
    cover = PRODUCT_IMAGES / "cover-mockup-v1.jpg"
    if cover.exists():
        c.drawImage(str(cover), 0, 0, width=page_w, height=page_h, preserveAspectRatio=True, mask="auto")
    else:
        _draw_title_page(c)
    c.showPage()

    # Page 2: title + key gallery images
    _draw_title_page(c)
    y = 7.8 * inch
    for img in [
        PRODUCT_IMAGES / "table-of-contents-v1.jpg",
        PRODUCT_IMAGES / "sample-page-spread-v1.jpg",
        PRODUCT_IMAGES / "social-proof-v1.jpg",
    ]:
        if not img.exists():
            continue
        c.drawImage(str(img), margin, y - 2.4 * inch, width=page_w - 2 * margin, height=2.2 * inch, preserveAspectRatio=True, mask="auto")
        y -= 2.5 * inch
        if y < 2.0 * inch:
            break
    c.showPage()

    # Page 3: timeline image
    timeline = PUBLIC / "sealed-timeline.jpg"
    if timeline.exists():
        c.setFont("Helvetica-Bold", 18)
        c.drawString(margin, page_h - margin - 10, "Timeline (2015 → 2026)")
        c.drawImage(
            str(timeline),
            margin,
            2.0 * inch,
            width=page_w - 2 * margin,
            height=6.5 * inch,
            preserveAspectRatio=True,
            mask="auto",
        )
        c.showPage()

    # Text pages from markdown sections
    sections = _read_md_sections(CONTENT_MD)
    for heading, body in sections:
        c.setFont("Helvetica-Bold", 18)
        c.drawString(margin, page_h - margin, heading)
        y = page_h - margin - 0.4 * inch
        max_w = page_w - 2 * margin
        y = _draw_wrapped_text(c, body.replace("\n", " ").strip(), margin, y, max_w)
        c.showPage()

    c.save()
    return OUT_PDF


if __name__ == "__main__":
    out = build()
    print(str(out))

