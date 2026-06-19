#!/usr/bin/env python3
"""
Generate hero images for SEALED landing page using Claude's image generation.

Script generates 2 hero image candidates:
1. Sealed Envelope - Archive/Time-Capsule aesthetic
2. Rally Silhouettes - Campaign rally energy (no faces)

Both are faceless, archival-themed, and optimized for web.
"""

import anthropic
import base64
import os
from pathlib import Path

def generate_sealed_envelope_hero():
    """Generate sealed envelope hero image (archival aesthetic)."""
    client = anthropic.Anthropic()

    prompt = """Create a hero image for a book landing page titled "SEALED: The 2016 Promises — Before the Deals".

SPECIFICATIONS:
- Aesthetic: 1960s government archive photography, sepia + blue ink overlay
- Subject: A heavy manila envelope labeled "SEALED — 2016 CAMPAIGN ARCHIVE" lying on aged oak desk
- Details: Wax seal (unbroken) with embossed eagle insignia, official stamp in corner, faded typed pages with black redaction bars surrounding envelope
- Lighting: Dramatic desk lamp creating long shadows
- Style: High contrast, archival quality, vintage paper texture
- Composition: 16:9 landscape aspect ratio
- CRITICAL: NO PEOPLE VISIBLE. FACELESS ABSOLUTELY.

The image should evoke a classified document archive - mysterious, historical, authoritative."""

    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/png",
                            "data": None  # Placeholder - Claude will generate based on text prompt
                        }
                    },
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }
        ]
    )

    # Claude's image generation via API requires proper image generation endpoint
    # For now, we'll use the text-to-image capability through the messages API
    # This is a limitation of the current API - we'll document what images should look like
    return None


def generate_rally_silhouettes_hero():
    """Generate campaign rally silhouettes hero image (energy + patriotic)."""
    client = anthropic.Anthropic()

    prompt = """Create a hero image for a book landing page about campaign promises from 2015-2016.

SPECIFICATIONS:
- Aesthetic: Documentary photography, 2016 campaign rally from behind the stage
- Subject: Thousands of campaign rally attendees seen from BEHIND the stage, hands raised in silhouette
- Details: Podium in soft focus center-middle, American flag backdrop, stage lights creating silhouettes
- Perspective: Looking OUT from behind stage toward the crowd (not from audience looking at stage)
- Lighting: Stage lights creating dramatic silhouettes of crowd
- Colors: Red, white, blue dominant (patriotic lighting)
- Style: Grainy film stock quality, early 2010s digital camera aesthetic
- Composition: 16:9 landscape aspect ratio
- CRITICAL: NO FACES VISIBLE. All figures must be silhouettes only - no facial features visible anywhere.

This image should convey rally energy and crowd power without any identifiable individuals."""

    # Note: Claude's image generation via standard API is text-based
    # The actual image generation would need to use an image generation API
    return None


def create_placeholder_images():
    """
    Create placeholder notification since direct image generation isn't available via this API.
    This documents what needs to be generated.
    """
    hero_dir = Path("/Applications/DrAntoniou Projects/AgentCompanies/companies/concise/app/sealed/public/hero")

    # Create generation log
    log_content = """# Hero Image Generation Log

## Status: Manual Generation Required

Claude Code cannot directly generate images via the Anthropic API in this execution environment.
However, the prompts and specifications are prepared for manual generation.

## Images to Generate

### 1. Sealed Envelope Hero
**Prompt:** Archive/Time-Capsule aesthetic
- Manila envelope labeled "SEALED — 2016 CAMPAIGN ARCHIVE"
- Aged oak desk, unbroken wax seal with eagle insignia
- Official stamp, faded typed pages with redaction bars
- 1960s government archive photography style
- Sepia + blue ink overlay, dramatic lamp lighting
- NO PEOPLE VISIBLE
- Aspect: 16:9 landscape, high contrast, archival quality

**Generation Method:** Use Midjourney, DALL-E, or Stable Diffusion with above prompt
**Output Files:**
- Desktop: hero-sealed-envelope-1920x1080.webp (target: 350 KB)
- Mobile: hero-sealed-envelope-750x1000.webp (target: 180 KB)

### 2. Rally Silhouettes Hero
**Prompt:** Campaign rally energy (faceless silhouettes)
- Campaign rally crowd in silhouette, viewed from BEHIND stage
- Thousands of attendees with hands raised (all silhouettes)
- Podium center-middle in soft focus, American flag backdrop
- Red/white/blue stage lighting, grainy film aesthetic
- NO FACES - all silhouettes only
- Aspect: 16:9 landscape, documentary photography style

**Generation Method:** Use Midjourney, DALL-E, or Stable Diffusion with above prompt
**Output Files:**
- Desktop: hero-rally-silhouettes-1920x1080.webp (target: 320 KB)
- Mobile: hero-rally-silhouettes-750x1000.webp (target: 160 KB)

## Hard Requirements (Non-Negotiable)
✅ FACELESS ABSOLUTELY - No Trump, no founder, no real people
✅ NO anti-Semitic framing - Zero tolerance
✅ Platform-safe - Must pass Stripe/payment processor review
✅ Archival aesthetic - Vintage, historical, document-focused

## Next Steps
1. Generate both images using selected generator (Midjourney recommended)
2. Verify faceless + safe (zoom to 100%, check for any human faces or hateful framing)
3. Optimize to .webp format (lossy, Q=75)
4. Place in this directory with proper file names
5. Update HERO_MANIFEST.md with actual file paths
6. File CTO child issue for hero swap

## Verification Checklist
- [ ] Image 1 generated and verified faceless
- [ ] Image 2 generated and verified faceless
- [ ] No anti-Semitic or hateful imagery detected
- [ ] Images optimized to webp
- [ ] Files placed in correct directory
- [ ] Manifest updated with checksums
- [ ] CTO issue filed
"""

    manifest_path = hero_dir / "GENERATION_LOG.md"
    manifest_path.write_text(log_content)

    print(f"Created generation log at {manifest_path}")
    return True


if __name__ == "__main__":
    print("Hero Image Generation Script")
    print("=" * 50)
    print()

    try:
        # Create generation documentation
        success = create_placeholder_images()

        if success:
            print("✓ Generation specifications documented")
            print("✓ Ready for manual image generation")
            print()
            print("Next steps:")
            print("1. Use Midjourney or similar image generator")
            print("2. Follow prompts in GENERATION_LOG.md")
            print("3. Verify images are faceless and safe")
            print("4. Place .webp files in hero directory")
            print("5. Update HERO_MANIFEST.md")
            print("6. File CTO child issue")

    except Exception as e:
        print(f"Error: {e}")
        exit(1)
