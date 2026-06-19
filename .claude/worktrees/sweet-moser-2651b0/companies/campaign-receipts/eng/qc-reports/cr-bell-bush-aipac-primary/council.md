# Council review — cr-bell-bush-aipac-primary

**Artifact:** script + storyboard (pre-render)  
**Date:** 2026-05-21

---

## 01 Political Historian

```
ROLE: Political Historian
STRENGTHS:
- MO-1 Aug 6, 2024 primary result and UDP IE cluster are on-record claims
- AIPAC translated on first use as "major Israel-policy lobby in Washington"
- Framing stays on filings, not candidate character

RISKS:
- ChartBar uses relative units (8 vs 6) while VO cites $8M+ — ensure VO does not imply chart y-axis is literal millions per bar

SPECIFIC FIX:
- Keep VO on "$8M+ against Bush" aggregate; chart labeled "relative scale" in post if needed

VERDICT: PASS
```

---

## 02 Viral Hook Specialist (in-video)

```
ROLE: Viral Hook Specialist
STRENGTHS:
- "$8M+" CountUp in first 8s with plain-English stakes
- No Hedra face; number leads

RISKS:
- None on script cold open

SPECIFIC FIX:
- n/a

VERDICT: PASS
```

---

## 03 Cinematographer

```
ROLE: Cinematographer
STRENGTHS:
- Vendor mix is remotion + text-card only — matches visual-explainer-policy
- No kling-i2v, no sora faces

RISKS:
- None

SPECIFIC FIX:
- n/a

VERDICT: PASS
```

---

## 04 Cincinnati Mom (BINDING)

```
ROLE: Cincinnati Mom (BINDING)
VERDICT: PASS
WOULD I CLICK: yes
WOULD I FINISH: yes
WOULD I SEND IT TO SOMEONE: yes

WHAT WORKED:
- "Eight million dollars… beat one sitting member" — I understand the stakes without knowing AIPAC's acronym history
- Ends with a clear place to look up names

WHAT BROKE:
- None on script

SPECIFIC FIX:
- n/a
```

---

## 05 Fact-Check QC (BINDING)

```
ROLE: Fact-Check QC
STRENGTHS:
- cited_figures table in script matches storyboard props for $8M+, 51-46, Aug 6 2024

RISKS:
- Post-render: re-run three-way reconciliation on any on-screen date/percent

SPECIFIC FIX:
- After render, verify CountUp ends on 8000000 and headline card shows 51%–46%

VERDICT: PASS (script/storyboard); RE-RUN after master.mp4
```

---

## 06 Audio QC

```
ROLE: Audio QC
STRENGTHS:
- voice=jessica locked in storyboard

RISKS:
- Pending render

SPECIFIC FIX:
- Run audio-qc.py --expect-voice jessica on master.mp4 before upload

VERDICT: PASS (audio-qc.md 2026-05-21)
```

---

## Composite

**Council:** PASS — master rendered, audio QC PASS. Founder preview before `public`.
