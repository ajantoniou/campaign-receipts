# OSS-first engineering (portfolio default)

**Intent:** Prefer **open-source** tools agents can inspect, fork, and run locally — especially **MIT / Apache-2.0** stacks — before adding another closed SaaS.

## Examples already in use

| Area | OSS / agent-friendly choice |
|------|-------------------------------|
| **Analytics** | [Agent Analytics](https://github.com/Agent-Analytics/agent-analytics) (MIT) — self-host Workers+D1 or Docker; optional cloud |
| **Design → code handoff** | [Open Design](https://github.com/nexu-io/open-design) + workspace skill — local-first UI/brand artifacts |
| **Orchestration** | Paperclip (per your deployment) |
| **Frontend** | Next.js, Tailwind |

## How agents should decide

1. Search for a maintained OSS alternative with an API or CLI your agents can call.
2. If only SaaS exists, **one** spine vendor per category (see founder signup matrix) — don’t stack competing paid analytics unless there is a clear gap (see PostHog note under [**platforms-and-tools.md**](platforms-and-tools.md) § Agent Analytics vs PostHog).
3. Document new OSS additions in **`platforms-and-tools.md`** (env names + link).

## Related skills / docs

- Open Design: [`.cursor/skills/open-design/SKILL.md`](../../.cursor/skills/open-design/SKILL.md)
- Agent Analytics: [`shared/skills/agent-analytics/SKILL.md`](../skills/agent-analytics/SKILL.md), [**agent-analytics-web-wiring.md**](agent-analytics-web-wiring.md)
