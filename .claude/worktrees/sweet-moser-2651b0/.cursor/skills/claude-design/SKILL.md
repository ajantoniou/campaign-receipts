---
name: claude-design
description: >-
  Guides use of Anthropic Claude Design (Labs): cloud design/prototyping with
  Claude Opus, brand systems, exports (HTML, PPTX, PDF, Canva), and handoff to
  Claude Code. Use when the user mentions Claude Design, Anthropic Labs design,
  design system in Claude subscription, or comparing proprietary design tooling
  vs Open Design for portfolio work.
---

# Claude Design — portfolio workflow

**Claude Design** is Anthropic’s **hosted** design surface (launched from **Anthropic Labs**): collaborate with **Claude** on prototypes, slides, one-pagers, marketing collateral, and interactive explorations, with **brand system** integration (colors, type, components) and exports.

## Official entry points

- **Announcement / context:** [Anthropic — Claude Design](https://www.anthropic.com/news/claude-design-anthropic-labs)
- **Getting started:** [Claude Help — Get started with Claude Design](https://support.claude.com/en/articles/14604416-get-started-with-claude-design)
- **Design system setup:** [Set up your design system in Claude Design](https://support.claude.com/en/articles/14604397-set-up-your-design-system-in-claude-design)
- **Team / Enterprise admin:** [Claude Design admin guide](https://support.claude.com/en/articles/14604406-claude-design-admin-guide-for-team-and-enterprise-plans)
- **Usage / pricing note:** [Subscription usage and pricing](https://support.claude.com/en/articles/14667344-claude-design-subscription-usage-and-pricing)

Availability and caps depend on **Claude plan** (Pro / Max / Team / Enterprise) and org settings — follow Help Center, not this file, for current gates.

## When to prefer Claude Design

- **Org already on Claude** with **brand tokens** uploaded and **design workflow** centralized there.
- **Fast iteration** on decks, one-pagers, and **rich multimodal** explorations without running local daemons.
- **Handoff to Claude Code** when upstream documents that path for implementation.

## Handoff into this monorepo

1. Treat Claude Design exports as **references**: screenshots, PDFs, HTML snippets, **design tokens** — attach to issues / Paperclip.
2. **Re-implement** in `companies/*` with stack-appropriate components (Next, Liquid, etc.); avoid dumping opaque generated bundles into production unchanged.
3. **Secrets:** API keys and org URLs stay in **Claude / company vault** — never paste into `AgentCompanies` commits (see `.cursor/rules/credentials-and-push-safety.mdc`).

## Vs Open Design (OSS)

| Need | Claude Design | Open Design (`open-design` skill) |
|------|----------------|-------------------------------------|
| Hosting | Anthropic cloud | Local-first + optional self-deploy |
| Agents | Claude product UX | Your CLI on PATH (incl. Cursor) |
| Fit | Best when team standardizes on Claude subscription | Best when you want Apache-2.0 stack + BYOK |

Use **both** intentionally: e.g. Claude Design for **approved brand** comps; Open Design for **forkable** experiments or **CLI parity** with Cursor.

## Portfolio wiring

- **`.cursor/rules/design-toolkit.mdc`** applies when editing **designer / brand-design / brand-manager / book-illustrator / video-producer** persona trees — same routing table as **`open-design`** and **`higgsfield`** skills.
