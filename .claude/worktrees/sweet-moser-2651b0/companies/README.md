# Portfolio companies — charter docs & README index

**Maintainer:** Portfolio HQ (Chief of Staff).  
**HQ record:** [`portfolio-hq/process/companies-readme-discoverability-index.md`](portfolio-hq/process/companies-readme-discoverability-index.md) (TASK-092 delegation acceptance).  
**OSS design / video / publishing defaults:** [`../shared/docs/OSS-design-and-video-toolchain-appendix.md`](../shared/docs/OSS-design-and-video-toolchain-appendix.md) (HyperFrames, Open Design, FFmpeg, Pandoc — **POR-208**).  
**Purpose:** One landing page for humans and agents opening `companies/` — canonical charter paths plus curated `README.md` files (vendor `node_modules/` excluded).

## Quick charter links

Every operating company should keep **`vision.md`** at its repo root. Standard onboarding docs (when present): `kickoff-brief.md`, `permissions-and-configurations.md`, `issues-backlog.md`, `week-1-plan.md`, `personas/`.

| Folder | Summary | Charter |
| --- | --- | --- |
| [**portfolio-hq**](portfolio-hq/) | HQ orchestration — no customer product; governance & cross-portfolio rhythm | [vision.md](portfolio-hq/vision.md) |
| [**concise**](concise/) | Tier 1 — multi-book PDF launch | [vision.md](concise/vision.md) |
| [**concise-sealed**](concise-sealed/) | SEALED Press imprint + Next app (under Concise strategy) | Parent: [concise/vision.md](concise/vision.md); app: [README.md](concise-sealed/README.md) |
| [**nt-ministry**](nt-ministry/) | Tier 2 — NT theology media + directory + films research | [vision.md](nt-ministry/vision.md) |
| [**hyperlocal-matrix**](hyperlocal-matrix/) | Tier 3 — anonymous hyperlocal chat | [vision.md](hyperlocal-matrix/vision.md) |
| [**plutus-street**](plutus-street/) | Tier 3 — Pluto-family trading journal + signals | [vision.md](plutus-street/vision.md) |
| [**healthbrew**](healthbrew/) | Tier 3 — longevity dashboard / avatar UX | [vision.md](healthbrew/vision.md) |
| [**carstack**](carstack/) | Tier 3 — mechanic/dealer vehicle intelligence PDF reports | [vision.md](carstack/vision.md) |
| [**cliros**](cliros/) | AI-powered property title search + AOL generation (cliros.ai) | [vision.md](cliros/vision.md) |

## Curated README map (first-party only)

Paths are relative to `companies/<folder>/`. Agent persona bundles follow **`personas/<role>/README.md`** across companies — not duplicated row-by-row here.

### portfolio-hq

| Path | Topic |
| --- | --- |
| [personas/chief-of-staff-hourly/README.md](portfolio-hq/personas/chief-of-staff-hourly/README.md) | Chief of Staff hourly bundle pointer |
| [personas/chief-accountant/README.md](portfolio-hq/personas/chief-accountant/README.md) | Shared accountant persona |
| [personas/lead-counsel/README.md](portfolio-hq/personas/lead-counsel/README.md) | Legal |
| [personas/mckinsey-advisor/README.md](portfolio-hq/personas/mckinsey-advisor/README.md), [personas/mckinsey-consultant/README.md](portfolio-hq/personas/mckinsey-consultant/README.md) | Strategy advisors |
| [personas/yc-advisor/README.md](portfolio-hq/personas/yc-advisor/README.md) | YC-style advisor |
| [personas/paperclip-feedback/README.md](portfolio-hq/personas/paperclip-feedback/README.md) | Paperclip product feedback |

### concise-sealed

| Path | Topic |
| --- | --- |
| [README.md](concise-sealed/README.md) | SEALED Press app — quick start, deploy, env |
| [artifacts/README.md](concise-sealed/artifacts/README.md) | Artifact folder |

### concise

| Path | Topic |
| --- | --- |
| [brand/README.md](concise/brand/README.md) | Brand workspace |
| [eng/README-CON-15.md](concise/eng/README-CON-15.md) | Engineering note (CON-15) |

### nt-ministry

| Path | Topic |
| --- | --- |
| [web/README.md](nt-ministry/web/README.md) | Web app |
| [content/README.md](nt-ministry/content/README.md) | Content tree |
| [content/podcast/README.md](nt-ministry/content/podcast/README.md) | Podcast workflow |
| [content/scripts/README.md](nt-ministry/content/scripts/README.md) | Scripts |

### healthbrew

| Path | Topic |
| --- | --- |
| [web/README.md](healthbrew/web/README.md) | Web app |
| [deploys/README.md](healthbrew/deploys/README.md) | Deploy notes |
| [compliance/README.md](healthbrew/compliance/README.md) | Compliance |
| [plans/README.md](healthbrew/plans/README.md) | Plans |

### carstack

| Path | Topic |
| --- | --- |
| [site/README.md](carstack/site/README.md) | Marketing/site |
| [report-engine/README.md](carstack/report-engine/README.md) | Report engine |
| [lubelogger-deploy/README.md](carstack/lubelogger-deploy/README.md) | Lubelogger deploy |

### hyperlocal-matrix & plutus-street

No first-party `README.md` at repo root today; start from **`vision.md`** (linked above). Add a root `README.md` when an app subfolder warrants developer onboarding.

## Audit helper

List README files for one company without vendor noise:

```bash
find "companies/<folder>" -name 'README.md' -not -path '*/node_modules/*' | sort
```
