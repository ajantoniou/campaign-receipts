#!/usr/bin/env python3
"""
Generation backend router — prefer the founder's Higgsfield subscription
(prepaid credit pool) when it is genuinely available + cheaper, else fall back
to the existing metered fal/Kling scripts UNCHANGED.

WHY THIS EXISTS
---------------
The founder holds a Higgsfield "ultra" subscription whose credits are a FIXED
MONTHLY POOL that is already paid for. Spending those credits on CR beats costs
$0 incremental cash (until the pool is exhausted), whereas every fal.ai call is
fresh metered cash counted against the company's $500 cap.

IMPORTANT — verified premise (see CR-PRODUCTION-PIPELINE-v4.md "Generation
backend routing"): Higgsfield's *unlimited / free* tier is NOT available via the
MCP/CLI. The CLI bills per generation in CREDITS (`higgsfield generate cost`,
`higgsfield account` confirm this). So the saving is NOT "unlimited" — it is
"prepaid pool already sunk + per-unit cheaper for video / location stills". This
router therefore only routes the operations where Higgsfield is BOTH available
AND at-or-below the fal per-unit cost; everything else stays on fal.

DESIGN RULES
------------
- Availability is PROBED, never an env-var toggle (portfolio rule:
  feedback_no_env_flags). We probe: CLI on PATH -> `account status` authenticates
  -> credit balance >= the model's estimated credit cost.
- This router changes WHERE a clip/still comes from, NOT the validation around
  it. Callers keep their storyboard-validator + watch-QC gates.
- Prompts still come from visual-prompt-engineer / banana-pro-director /
  cinema-worldbuilder. The router only swaps the execution backend.
- The fal fallback path is the existing scripts, invoked unchanged.

USAGE (library)
---------------
    from gen_router import route_still, route_i2v, higgsfield_available

    # Single still: returns (backend, out_path)
    route_still(prompt="...", out="clips/scene-01.png", piece="my-slug",
                aspect="16:9")

    # Image-to-video: returns (backend, out_path)
    route_i2v(image="seed.png", prompt="slow push-in", duration=5,
              out="clips/scene-01.mp4", piece="my-slug")

USAGE (CLI passthrough — same flags the fal scripts accept)
-----------------------------------------------------------
    python3 gen-router.py still --prompt "..." --out clips/x.png --piece slug
    python3 gen-router.py i2v  --image s.png --prompt "..." --out clips/x.mp4 \
        --duration 5 --piece slug

Pass --force-fal to skip Higgsfield entirely (e.g. cached-retry repeatability).
"""
import json, os, subprocess, sys, shutil, datetime as dt
from pathlib import Path

REPO = Path("/Applications/DrAntoniou Projects/AgentCompanies")
CR = REPO / "companies/campaign-receipts"
COST_LOG = CR / "scripts/.external-costs.jsonl"
PIPELINE_DIR = Path(__file__).resolve().parent

# --- Verified credit costs (higgsfield generate cost <model>, 2026-05-30) ----
# Compared to fal per-unit cash cost. Route to Higgsfield only where its credit
# cost is at-or-below the fal cash cost AND the model fits the beat type.
# Credit value on the ultra plan is a prepaid sunk pool; we treat in-pool spend
# as $0 incremental but still log the credit draw for budget visibility.
HF_STILL_MODEL = "nano_banana_2"     # 2 cr; CR atmosphere/seed stills (no readable claims, no real faces)
HF_STILL_LOCATION = "soul_location"  # 0.12 cr; best-in-class no-people environment plates
HF_I2V_MODEL = "kling3_0"            # 10 cr flat per clip vs fal Kling $0.07/s (=$0.35/5s)

# fal cash cost references (for the log + the routing decision)
FAL_STILL_USD = 0.04                 # flux-pro v1.1
FAL_KLING_USD_PER_SEC = 0.07


def _now():
    return dt.datetime.now().isoformat()


def log_cost(piece, vendor, usd, note, credits=None):
    COST_LOG.parent.mkdir(parents=True, exist_ok=True)
    rec = {"ts": _now(), "issueId": piece, "vendor": vendor,
           "cost_usd": round(usd, 4), "note": note}
    if credits is not None:
        rec["higgsfield_credits"] = credits
    with open(COST_LOG, "a") as f:
        f.write(json.dumps(rec) + "\n")


# --------------------------------------------------------------------------- #
# Availability probe — real, not an env flag.
# --------------------------------------------------------------------------- #
_hf_cache = {}


def higgsfield_available(min_credits=0.0):
    """True iff: CLI on PATH, account authenticates, and balance >= min_credits.

    Probes the live CLI; result (sans the credit-threshold check) is cached for
    the process so we don't re-auth on every beat.
    """
    if shutil.which("higgsfield") is None:
        return False
    if "balance" not in _hf_cache:
        try:
            out = subprocess.run(
                ["higgsfield", "account", "status"],
                capture_output=True, text=True, timeout=30,
            )
            if out.returncode != 0:
                _hf_cache["balance"] = -1.0  # not authenticated / session expired
            else:
                # e.g. "alex@... — ultra plan, 11714 credits"
                bal = -1.0
                for tok in out.stdout.replace(",", " ").split():
                    try:
                        v = float(tok)
                        bal = v
                    except ValueError:
                        if tok.lower().startswith("credit"):
                            break
                _hf_cache["balance"] = bal
        except (subprocess.TimeoutExpired, OSError):
            _hf_cache["balance"] = -1.0
    return _hf_cache["balance"] >= min_credits


def _hf_estimate_credits(model, prompt="x"):
    try:
        out = subprocess.run(
            ["higgsfield", "generate", "cost", model, "--prompt", prompt],
            capture_output=True, text=True, timeout=30,
        )
        for tok in out.stdout.split():
            try:
                return float(tok)
            except ValueError:
                continue
    except (subprocess.TimeoutExpired, OSError):
        pass
    return None


def _hf_generate(model, out_path, prompt=None, image=None, start_image=None,
                 duration=None, aspect=None):
    """Run a Higgsfield generation and copy/download the result to out_path.

    Returns True on success, False to signal the caller should fall back.
    """
    cmd = ["higgsfield", "generate", "create", model, "--wait", "--json"]
    if prompt:
        cmd += ["--prompt", prompt]
    if image:
        cmd += ["--image", str(image)]
    if start_image:
        cmd += ["--start-image", str(start_image)]
    if duration:
        cmd += ["--duration", str(duration)]
    if aspect:
        cmd += ["--aspect_ratio", aspect]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=20 * 60)
    except (subprocess.TimeoutExpired, OSError):
        return False
    if res.returncode != 0:
        return False
    # Parse the result URL from the JSON job array.
    url = None
    try:
        data = json.loads(res.stdout)
        jobs = data if isinstance(data, list) else [data]
        for j in jobs:
            for k in ("result_url", "url", "output_url", "media_url"):
                if isinstance(j, dict) and j.get(k):
                    url = j[k]
                    break
            results = j.get("results") if isinstance(j, dict) else None
            if not url and isinstance(results, list):
                for r in results:
                    if isinstance(r, dict) and r.get("url"):
                        url = r["url"]
                        break
            if url:
                break
    except (json.JSONDecodeError, AttributeError):
        return False
    if not url:
        return False
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        import urllib.request
        urllib.request.urlretrieve(url, out_path)
    except Exception:
        return False
    return out_path.exists() and out_path.stat().st_size > 0


def _run_fal_still(prompt, out, piece, aspect="16:9"):
    size = {"16:9": "landscape_16_9", "9:16": "portrait_16_9",
            "1:1": "square_hd"}.get(aspect, "landscape_16_9")
    cmd = [sys.executable, str(PIPELINE_DIR / "fal-stills-gen.py"),
           "--prompt", prompt, "--out", str(out), "--piece", piece,
           "--image-size", size]
    return subprocess.run(cmd).returncode == 0


def _run_fal_i2v(image, prompt, duration, out, piece):
    cmd = [sys.executable, str(PIPELINE_DIR / "fal-kling-i2v.py"),
           "--image", str(image), "--prompt", prompt,
           "--duration", str(duration), "--out", str(out), "--piece", piece]
    return subprocess.run(cmd).returncode == 0


# --------------------------------------------------------------------------- #
# Public routing entrypoints
# --------------------------------------------------------------------------- #
def route_still(prompt, out, piece="manual", aspect="16:9",
                location=False, force_fal=False):
    """Atmosphere / environment / seed still. Returns (backend, out_path)."""
    model = HF_STILL_LOCATION if location else HF_STILL_MODEL
    if not force_fal:
        est = _hf_estimate_credits(model, prompt) or 0.0
        # Higgsfield wins on stills only when it's authenticated AND its credit
        # estimate is cheap. nano_banana_2 (~2cr) and soul_location (~0.12cr)
        # qualify; the prepaid pool makes this $0 incremental cash.
        if est > 0 and higgsfield_available(min_credits=est):
            ok = _hf_generate(model, out, prompt=prompt, aspect=aspect)
            if ok:
                log_cost(piece, f"higgsfield/{model}", 0.0,
                         f"still (prepaid pool) {Path(out).name}", credits=est)
                print(f"✅ [higgsfield/{model}] {out} ({est} cr, prepaid)")
                return ("higgsfield", str(out))
            print(f"⚠️  higgsfield still failed; falling back to fal", file=sys.stderr)
    if _run_fal_still(prompt, out, piece, aspect):
        return ("fal", str(out))
    raise RuntimeError(f"both backends failed for still {out}")


def route_i2v(image, prompt, duration, out, piece="manual", force_fal=False):
    """Image-to-video atmosphere motion. Returns (backend, out_path)."""
    if not force_fal:
        est = _hf_estimate_credits(HF_I2V_MODEL, prompt) or 0.0
        # Higgsfield Kling 3.0 is a flat ~10cr/clip vs fal Kling $0.07/s; for any
        # clip >= ~1.5s the prepaid pool is strictly cheaper on cash.
        if higgsfield_available(min_credits=est):
            ok = _hf_generate(HF_I2V_MODEL, out, prompt=prompt,
                              start_image=image, duration=duration)
            if ok:
                log_cost(piece, f"higgsfield/{HF_I2V_MODEL}", 0.0,
                         f"i2v {duration}s (prepaid pool) {Path(out).name}",
                         credits=est)
                print(f"✅ [higgsfield/{HF_I2V_MODEL}] {out} ({est} cr, prepaid)")
                return ("higgsfield", str(out))
            print(f"⚠️  higgsfield i2v failed; falling back to fal Kling", file=sys.stderr)
    if _run_fal_i2v(image, prompt, duration, out, piece):
        return ("fal", str(out))
    raise RuntimeError(f"both backends failed for i2v {out}")


def main():
    args = sys.argv[1:]
    if not args or args[0] in ("-h", "--help"):
        print(__doc__); sys.exit(0)
    op = args[0]
    rest = args[1:]

    def get(f, d=None):
        if f in rest:
            i = rest.index(f)
            return rest[i + 1] if i + 1 < len(rest) else d
        return d

    force_fal = "--force-fal" in rest
    piece = get("--piece", "manual")

    if op == "probe":
        avail = higgsfield_available()
        bal = _hf_cache.get("balance", -1.0)
        print(json.dumps({"higgsfield_available": avail, "credit_balance": bal}))
        sys.exit(0 if avail else 1)

    if op == "still":
        backend, path = route_still(
            prompt=get("--prompt"), out=get("--out"), piece=piece,
            aspect=get("--aspect", "16:9"),
            location=("--location" in rest), force_fal=force_fal)
        print(f"backend={backend} out={path}")
    elif op == "i2v":
        backend, path = route_i2v(
            image=get("--image"), prompt=get("--prompt"),
            duration=int(get("--duration", "5")), out=get("--out"),
            piece=piece, force_fal=force_fal)
        print(f"backend={backend} out={path}")
    else:
        print(f"ERR: unknown op '{op}' (want: probe|still|i2v)", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
