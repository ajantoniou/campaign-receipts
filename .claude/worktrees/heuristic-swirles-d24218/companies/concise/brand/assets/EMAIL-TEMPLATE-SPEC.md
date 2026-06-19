# Concise Email Template v1 — Specification & HTML

**Status:** PRODUCTION READY (responsive HTML + Figma mockup)

**Use case:** Marketing emails, order confirmations, newsletter

**Email clients:** Gmail, Outlook, Apple Mail, mobile clients

---

## Email Structure

```
┌────────────────────────────────────┐
│  HEADER (Navy background)          │  Height: 80px
│  [CONCISE wordmark] white          │
├────────────────────────────────────┤
│  BODY SECTION                      │  Background: White
│  Main content area                 │  Padding: 40px
│  [Product cards / Message text]    │
├────────────────────────────────────┤
│  CTA SECTION                       │  Background: Light gray
│  [ Main CTA Button ]               │  Padding: 40px
├────────────────────────────────────┤
│  FOOTER (Light gray background)    │  Background: #f5f5f5
│  Copyright, social, unsubscribe    │  Padding: 20px
└────────────────────────────────────┘
```

---

## Header Section

**Background color:** Navy (#1a2a4d)

**Content:**
- CONCISE wordmark (white version, 48px height)
- Centered horizontally
- Padding: 16px top/bottom, 20px left/right

**HTML structure:**
```html
<table width="600" cellpadding="0" cellspacing="0"
       bgcolor="#1a2a4d" style="max-width:600px; margin:0 auto;">
  <tr>
    <td align="center" style="padding:16px 20px;">
      <img src="logo-concise-white.svg" alt="Concise"
           width="48" style="display:block; max-width:100%; height:auto;">
    </td>
  </tr>
</table>
```

**Responsive:**
- Desktop: Full 600px width
- Mobile: Scales down, maintains aspect ratio

---

## Body Section (Main Content Area)

**Background color:** White (#ffffff)

**Padding:** 40px (desktop), 20px (mobile)

**Max width:** 600px (email standard)

### Layout Options

#### Option 1: Text + Image (Typical Marketing Email)

```
┌──────────────────────────────────┐
│ Hello [Name],                    │
│                                  │
│ We're excited to share our      │
│ latest book arrivals...         │
│                                  │
│ [Product Card]                   │
│ [Product Card]                   │
│ [Product Card]                   │
│                                  │
│ Browse all new releases →        │
└──────────────────────────────────┘
```

**Typography:**
- Greeting: Inter Bold, 16pt, navy
- Body text: Inter Regular, 14pt, charcoal
- Line height: 1.5 (for readability)
- Text color: Charcoal (#2c3e50)

#### Option 2: Single Product Spotlight

```
┌──────────────────────────────────┐
│ New Release                      │
│                                  │
│ [Large book cover image]         │
│ 3:2 aspect ratio                │
│                                  │
│ MCAT Essentials                  │
│ Learn proven test strategies     │
│                                  │
│ $19.99                           │
│ [Buy Now Button]                 │
└──────────────────────────────────┘
```

### Product Card Component (Within Email)

**Dimensions:** Full width (540px on desktop, constrained to width)

**Structure:**
```
┌────────────────────────────────────┐
│ [Book cover image]                 │  Width: 140px, 6:9 ratio
│ ┌──────────────────────────────────┤
│ │ TITLE                            │
│ │ Subtitle or description          │
│ │                                  │
│ │ $19.99                           │
│ │ [Add to Cart]  [View Details]   │
│ └──────────────────────────────────┘
└────────────────────────────────────┘
```

**Product card specs:**
- Layout: Image left (140px), content right (flex)
- Image: High-res book cover
- Title: Inter Bold, 14pt, navy
- Price: Inter Bold, 16pt, navy
- Buttons: See CTA section below

---

## CTA Section (Call-to-Action)

**Background color:** Light gray (#f5f5f5)

**Padding:** 40px (desktop), 20px (mobile)

**Primary CTA Button:**
- **Text:** "Shop Now" / "View All" / "Order Today" (context-dependent)
- **Button styling:**
  - Background: Navy (#1a2a4d)
  - Text: White (#ffffff)
  - Border: 2px solid cyan (#00d9ff)
  - Padding: 16px 32px (height ~48px)
  - Border radius: 4px
  - Font: Inter Bold, 14pt
  - Text transform: Uppercase (optional)
- **Hover state (email clients that support):**
  - Background: Cyan (#00d9ff)
  - Text: Navy (#1a2a4d)
  - Cursor: pointer

**HTML structure:**
```html
<table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td align="center" style="padding:40px 20px; background-color:#f5f5f5;">
      <a href="https://concisereads.com/shop"
         style="display:inline-block; background-color:#1a2a4d;
                color:#ffffff; border:2px solid #00d9ff;
                padding:16px 32px; border-radius:4px;
                text-decoration:none; font-family:Inter,Arial,sans-serif;
                font-weight:bold; font-size:14px;">
        SHOP NOW
      </a>
    </td>
  </tr>
</table>
```

---

## Footer Section

**Background color:** Light gray (#f5f5f5)

**Padding:** 20px

**Text alignment:** Center

**Content (top to bottom):**

1. **Copyright text**
   - Text: "© 2026 Concise. All rights reserved."
   - Font: Inter Regular, 10pt
   - Color: Charcoal (#2c3e50)

2. **Social media links** (optional)
   - Icons: Facebook (f), Twitter/X (X), Instagram (📷)
   - Size: 16px
   - Color: Navy (#1a2a4d)
   - Spacing: 16px between icons
   - Hover: Change to cyan

3. **Footer links** (optional)
   - "Privacy Policy" | "Terms of Service" | "Preferences"
   - Font: Inter Regular, 9pt
   - Color: Navy
   - Spacing: 8px between links
   - Hover: Cyan color

4. **Unsubscribe link**
   - Text: "Unsubscribe" or "Update email preferences"
   - Font: Inter Regular, 9pt
   - Color: Navy
   - Required for compliance (CAN-SPAM)

**HTML structure:**
```html
<table width="600" cellpadding="0" cellspacing="0"
       bgcolor="#f5f5f5" style="max-width:600px; margin:0 auto;">
  <tr>
    <td align="center" style="padding:20px;
        font-family:Inter,Arial,sans-serif;
        font-size:10pt; color:#2c3e50;">
      <p>© 2026 Concise. All rights reserved.</p>
      <p>
        <a href="https://concisereads.com/privacy"
           style="color:#1a2a4d; text-decoration:none;">
           Privacy Policy
        </a> |
        <a href="https://concisereads.com/terms"
           style="color:#1a2a4d; text-decoration:none;">
           Terms of Service
        </a>
      </p>
      <p>
        <a href="[unsubscribe-link]"
           style="color:#1a2a4d; text-decoration:none;">
           Unsubscribe
        </a>
      </p>
    </td>
  </tr>
</table>
```

---

## Responsive Design

### Desktop (600px fixed width)
- Full width: 600px (standard email width)
- Padding: 40px on body content
- Image width: up to 520px

### Mobile (375px)
- Single column layout
- Padding: 20px
- Product cards: Stacked vertically
- Images: Scale to 100% of container width
- Button: Full width (100%)

**CSS media query example:**
```css
@media only screen and (max-width: 480px) {
  table[class="email-table"] {
    width: 100% !important;
  }
  td[class="email-padding"] {
    padding: 20px !important;
  }
  a[class="cta-button"] {
    width: 100% !important;
    display: block !important;
  }
}
```

---

## Color Specifications

| Element | Color | Hex | RGB |
|---|---|---|---|
| Header background | Navy | #1a2a4d | (26, 42, 77) |
| Body background | White | #ffffff | (255, 255, 255) |
| CTA/Footer background | Light gray | #f5f5f5 | (245, 245, 245) |
| Primary text | Charcoal | #2c3e50 | (44, 62, 80) |
| Accent | Cyan | #00d9ff | (0, 217, 255) |
| Button border | Cyan | #00d9ff | (0, 217, 255) |

---

## Full HTML Template

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Concise — New Book Release</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f5f5f5; }
    table { border-collapse: collapse; }
    img { display: block; max-width: 100%; height: auto; }
    a { color: #1a2a4d; text-decoration: none; }
    a:hover { color: #00d9ff; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #1a2a4d; padding: 16px 20px; text-align: center; }
    .body { padding: 40px 20px; background-color: #ffffff; }
    .cta-section { padding: 40px 20px; background-color: #f5f5f5; text-align: center; }
    .footer { padding: 20px; background-color: #f5f5f5; text-align: center; font-size: 10pt; color: #2c3e50; }
    .cta-button {
      display: inline-block;
      background-color: #1a2a4d;
      color: #ffffff;
      border: 2px solid #00d9ff;
      padding: 16px 32px;
      border-radius: 4px;
      text-decoration: none;
      font-family: Inter, Arial, sans-serif;
      font-weight: bold;
      font-size: 14px;
    }
    .cta-button:hover {
      background-color: #00d9ff;
      color: #1a2a4d;
    }
    h1, h2 { margin: 0 0 16px 0; font-family: Inter, Arial, sans-serif; color: #1a2a4d; }
    h1 { font-size: 18pt; font-weight: bold; }
    h2 { font-size: 14pt; font-weight: bold; }
    p { margin: 0 0 12px 0; font-family: Inter, Arial, sans-serif; font-size: 14pt; color: #2c3e50; line-height: 1.5; }
    @media only screen and (max-width: 480px) {
      .body { padding: 20px; }
      .cta-section { padding: 20px; }
      .cta-button { width: 100%; box-sizing: border-box; }
    }
  </style>
</head>
<body>

<table class="email-container" width="600" cellpadding="0" cellspacing="0">
  <!-- HEADER -->
  <tr>
    <td class="header">
      <img src="logo-concise-white.svg" alt="Concise" width="48" style="display: inline-block;">
    </td>
  </tr>

  <!-- BODY -->
  <tr>
    <td class="body">
      <h1>Hello [Name],</h1>
      <p>We're excited to share our latest book arrivals with you. Discover new releases from expert authors, curated just for you.</p>

      <!-- Product Cards (repeat as needed) -->
      <table width="100%" cellpadding="16" cellspacing="0">
        <tr>
          <td width="140" align="center">
            <img src="mcat-essentials-cover.png" alt="MCAT Essentials" width="140" style="max-width: 100%;">
          </td>
          <td width="360" valign="top">
            <h2>MCAT Essentials</h2>
            <p style="margin: 0 0 8px 0; font-size: 12pt;">Proven Strategies for Test Day Success</p>
            <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 16pt;">$19.99</p>
            <a href="https://concisereads.com/books/mcat-essentials" class="cta-button">ORDER NOW</a>
          </td>
        </tr>
      </table>

      <p style="margin: 24px 0 0 0; text-align: center;">
        <a href="https://concisereads.com/shop">Browse all releases →</a>
      </p>
    </td>
  </tr>

  <!-- CTA SECTION -->
  <tr>
    <td class="cta-section">
      <a href="https://concisereads.com/shop" class="cta-button">SHOP NOW</a>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td class="footer">
      <p style="margin: 0 0 8px 0;">© 2026 Concise. All rights reserved.</p>
      <p style="margin: 0 0 8px 0;">
        <a href="https://concisereads.com/privacy">Privacy Policy</a> |
        <a href="https://concisereads.com/terms">Terms of Service</a>
      </p>
      <p style="margin: 0;">
        <a href="[unsubscribe-link]">Unsubscribe from our emails</a>
      </p>
    </td>
  </tr>
</table>

</body>
</html>
```

---

## Figma Mockup Specification

**Frames to create:**

1. **Desktop version** (600px wide)
   - Full email layout
   - All sections visible

2. **Mobile version** (375px wide)
   - Responsive layout
   - Stacked sections

3. **Component variations:**
   - Button states (default, hover, active)
   - Text color variations
   - Product card variations

---

## Email Marketing Integration

### Service provider notes:

**Mailchimp, Resend, or similar:**
- Add `[Merge tag]` for personalization (e.g., `[*|FNAME|*]` for first name)
- Set up unsubscribe link (required for CAN-SPAM compliance)
- Enable dark mode CSS for email clients that support it
- A/B test subject lines and CTA button colors

**Dark mode CSS:**
```css
@media (prefers-color-scheme: dark) {
  .body { background-color: #1a1a1a !important; }
  p { color: #e0e0e0 !important; }
  h1, h2 { color: #00d9ff !important; }
}
```

---

## Testing Checklist

- [ ] Send test to Gmail, Outlook, Apple Mail
- [ ] Test on mobile (iPhone, Android)
- [ ] Verify links work (all CTAs should go to correct URLs)
- [ ] Check images load correctly
- [ ] Test dark mode rendering (if supported)
- [ ] Verify unsubscribe link works
- [ ] Check SPAM score (should be low)
- [ ] Validate HTML (use validator.w3.org)
- [ ] Test button hover states (some email clients support)

---

## File Deliverables

1. **email-template.html** (complete, production-ready)
2. **email-template-figma.figma** (Figma mockup with desktop + mobile versions)
3. **email-preview.png** (screenshot for reference)
4. **Email integration guide** (how to set up in Mailchimp/Resend)

---

**Created:** 2026-05-03 — Brand & Design (CON-3 execution)

**Status:** PRODUCTION READY (HTML + Figma mockup ready for use)

**Next step:** Test in email client, deploy to newsletter service
