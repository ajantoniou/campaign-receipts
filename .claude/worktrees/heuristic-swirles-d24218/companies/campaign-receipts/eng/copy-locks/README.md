# Copy locks

One JSON per episode: `<slug>.json` with `"verdict": "SHIP"`.

Created only after:

1. `docs/CR-COPY-PIPELINE.md` stages 0–5 complete  
2. `council-review.py` report contains `VERDICT: SHIP`  
3. Cincinnati Mom PASS in that report  

```bash
python3 scripts/pipeline/copy-lock.py --slug <slug> --write-lock \
  --council-report eng/qc-reports/<slug>/council-script-YYYY-MM-DD.md
```

**cr-bell-bush-aipac-primary:** v2 storyline script in progress — latest council `council-script-2026-05-21-v4.md` is **REVISE** (hook + storyboard remap). No lock file yet — **do not re-render** until SHIP.
