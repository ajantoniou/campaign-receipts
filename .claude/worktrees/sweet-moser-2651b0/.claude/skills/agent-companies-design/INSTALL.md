# Install — AgentCompanies design skill

A Claude Code skill that teaches Claude to design and build AgentCompanies sites (Campaign Receipts, SEALED 2016, EstimateProof, and siblings) using the family benchmark.

## What this skill does

Once installed, Claude Code will automatically use this skill whenever you ask it to:
- Build, redesign, or restyle any page or component on an AgentCompanies site
- Generate social share graphics in the family vocabulary
- Launch a new sibling agent-company site that should match the benchmark

Claude will read the design tokens, type pairing, component anatomies, and methodology before generating code — so output matches the family aesthetic without you re-explaining it every time.

## Install (project-level)

Drop this folder into your repo at `.claude/skills/agent-companies-design/`:

```bash
# In your project root
mkdir -p .claude/skills
mv ~/Downloads/agent-companies-design .claude/skills/
```

Resulting structure:
```
your-project/
└── .claude/
    └── skills/
        └── agent-companies-design/
            ├── SKILL.md
            ├── PROCESS.md
            ├── DESIGN_BENCHMARK.md
            ├── COMPONENTS.md
            ├── tokens.css
            └── references/
```

Restart Claude Code (or run `/reload`) and it will discover the skill.

## Install (user-level — available across all your projects)

Drop the folder into `~/.claude/skills/agent-companies-design/` instead. Same result, available globally.

## Verify it loaded

In Claude Code, run:
```
/skills
```

You should see `agent-companies-design` in the list. Ask:
> "What design system do we use for our agent companies?"

Claude should respond from `SKILL.md` and reference the benchmark.

## Typical use

Once installed, just talk normally:
- *"Build a pricing page for EstimateProof, match the Campaign Receipts benchmark."*
- *"Add a corrections-log section to the about page."*
- *"Generate a 1080-square share graphic for this stat."*
- *"I want to launch a new sibling site called Pledge Receipts — start a folder and apply the system."*

Claude will read the skill, ask the canonical question set, declare the system it's committing to, and build.

## Customizing the skill

The skill is yours — edit any file. Common edits:

- **Add a new sibling site's voice/copy rules** → append a section to `DESIGN_BENCHMARK.md` under "Per-company customization"
- **Lock in a different default palette** → change values in `tokens.css` and the table in `DESIGN_BENCHMARK.md`
- **Add a new component** → document anatomy in `COMPONENTS.md` and include a reference implementation in `references/`
- **Change the workflow** → edit `PROCESS.md`

If you add reference HTML/JSX/CSS files to `references/`, mention them in `SKILL.md` under "Files in this skill" so Claude knows to read them.

## What's NOT in the skill (intentional)

- **No politician/customer data.** All examples use placeholders. Wire real data per project.
- **No build tooling.** Skill is framework-agnostic — works in Next.js, Astro, SvelteKit, plain HTML, whatever you use.
- **No iconography library.** The system runs on type + mono labels + paper texture; icons are reach-for-when-functional.

## File map

| File | Purpose |
|---|---|
| `SKILL.md` | Entry point. Tells Claude when to invoke + the hard rules. Read first, every time. |
| `PROCESS.md` | The design-exploration methodology (questions → declared system → build → handoff). |
| `DESIGN_BENCHMARK.md` | The visual system — tokens, palette, type, voice. |
| `COMPONENTS.md` | Every primitive's anatomy (Receipt, Stamp, StatTile, Leaderboard, etc.). |
| `tokens.css` | Drop-in CSS custom properties. |
| `references/` | Canonical visual references from Campaign Receipts. Treat as spec, not code. |
