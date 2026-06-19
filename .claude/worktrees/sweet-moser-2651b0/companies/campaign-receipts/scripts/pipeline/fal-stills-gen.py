#!/usr/bin/env python3
"""
Generate stills via fal.ai (flux-pro by default; flux-dev fallback).

Reads storyboard JSON with this shape:
  {"stills": [{"id": "scene-01", "prompt": "..."}, ...]}

Writes one PNG per still to --out-dir, named <id>.png.

Usage:
    python3 fal-stills-gen.py --storyboard storyboard-v2.json \\
        --out-dir content/videos/<slug>/stills/ --piece <slug>

    # Single still mode
    python3 fal-stills-gen.py --prompt "..." --out path/to/still.png --piece <slug>
"""
import json, os, sys, time, urllib.request, urllib.error, concurrent.futures, datetime as dt
from pathlib import Path

REPO = Path("/Applications/DrAntoniou Projects/AgentCompanies")
CR = REPO / "companies/campaign-receipts"
ENV = REPO / ".env"
COST_LOG = CR / "scripts/.external-costs.jsonl"

MODELS = {
    "flux-pro": {"endpoint": "fal-ai/flux-pro/v1.1", "price": 0.04, "label": "FLUX Pro v1.1"},
    "flux-dev": {"endpoint": "fal-ai/flux/dev", "price": 0.025, "label": "FLUX dev"},
}


def load_env():
    env = {}
    if ENV.exists():
        for l in ENV.read_text().splitlines():
            if "=" in l and not l.startswith("#"):
                k,_,v = l.partition("=")
                env[k.strip()] = v.strip().strip('"')
    return env


def get_api_key():
    env = load_env()
    for k in ("CR_FAL_API_KEY", "FAL_API_KEY", "FAL_KEY"):
        if env.get(k) or os.environ.get(k):
            return env.get(k) or os.environ.get(k)
    print("ERR: CR_FAL_API_KEY missing", file=sys.stderr); sys.exit(1)


def log_cost(piece, vendor, usd, note):
    COST_LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(COST_LOG, "a") as f:
        f.write(json.dumps({"ts": dt.datetime.now().isoformat(), "issueId": piece,
                            "vendor": vendor, "cost_usd": round(usd,4), "note": note}) + "\n")


def fal_request(endpoint, body, api_key, max_wait=180):
    submit_url = f"https://queue.fal.run/{endpoint}"
    req = urllib.request.Request(submit_url, data=json.dumps(body).encode(), method="POST")
    req.add_header("Authorization", f"Key {api_key}")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            sub = json.loads(r.read())
    except urllib.error.HTTPError as e:
        return None, f"submit HTTP {e.code}: {e.read().decode()[:300]}"

    status_url = sub.get("status_url"); response_url = sub.get("response_url")
    start = time.time()
    time.sleep(2)
    while True:
        if time.time() - start > max_wait:
            return None, f"timeout >{max_wait}s"
        try:
            r = urllib.request.Request(status_url)
            r.add_header("Authorization", f"Key {api_key}")
            with urllib.request.urlopen(r, timeout=15) as resp:
                st = json.loads(resp.read())
        except urllib.error.HTTPError as e:
            return None, f"poll HTTP {e.code}"
        s = st.get("status","?")
        if s == "COMPLETED": break
        if s in ("FAILED","ERROR"): return None, f"job {s}"
        time.sleep(4)

    try:
        r = urllib.request.Request(response_url)
        r.add_header("Authorization", f"Key {api_key}")
        with urllib.request.urlopen(r, timeout=30) as resp:
            return json.loads(resp.read()), None
    except urllib.error.HTTPError as e:
        return None, f"result HTTP {e.code}"


def download(url, out_path):
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(url, timeout=120) as r:
        out_path.write_bytes(r.read())


def gen_still(still, model_key, api_key, out_dir, piece_id):
    sid = still["id"]; prompt = still["prompt"]
    out_path = out_dir / f"{sid}.png"
    if out_path.exists() and out_path.stat().st_size > 5000:
        return (still, out_path, 0, None)
    m = MODELS[model_key]
    image_size = still.get("image_size") or "landscape_16_9"
    body = {"prompt": prompt, "image_size": image_size,
            "num_inference_steps": 28, "guidance_scale": 3.5, "num_images": 1, "enable_safety_checker": True}
    if still.get("seed") is not None:
        try:
            body["seed"] = int(still["seed"])
        except Exception:
            pass
    result, err = fal_request(m["endpoint"], body, api_key)
    if err: return (still, None, 0, err)
    img_url = None
    if isinstance(result.get("images"), list) and result["images"]:
        img_url = result["images"][0].get("url")
    if not img_url: return (still, None, 0, "no image url")
    try:
        download(img_url, out_path)
        log_cost(piece_id, f"fal.ai/{model_key}", m["price"], f"still {sid}")
        return (still, out_path, m["price"], None)
    except Exception as e:
        return (still, None, 0, f"download: {e}")


def main():
    args = sys.argv[1:]
    if "--help" in args or "-h" in args or not args:
        print(__doc__); sys.exit(0)
    def get(f,d=None):
        if f in args: i=args.index(f); return args[i+1] if i+1<len(args) else d
        return d

    api_key = get_api_key()
    piece_id = get("--piece", "manual")
    model_key = get("--model", "flux-pro")
    max_workers = int(get("--workers", "8"))

    # Single-still mode
    if get("--prompt") and get("--out"):
        out = Path(get("--out"))
        still = {"id": out.stem, "prompt": get("--prompt"), "image_size": get("--image-size", "landscape_16_9")}
        still_obj, path, cost, err = gen_still(still, model_key, api_key, out.parent, piece_id)
        if err:
            print(f"ERR: {err}", file=sys.stderr); sys.exit(1)
        print(f"✅ {path} (${cost:.3f})")
        return

    # Batch mode
    sb_path = get("--storyboard")
    out_dir = Path(get("--out-dir", "stills"))
    out_dir.mkdir(parents=True, exist_ok=True)
    if not sb_path:
        print("ERR: --storyboard required for batch mode", file=sys.stderr); sys.exit(1)
    sb = json.loads(Path(sb_path).read_text())
    stills = sb.get("stills", [])

    print(f"Generating {len(stills)} stills via fal.ai ({MODELS[model_key]['label']}, {max_workers} parallel)...")
    started = time.time()
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as pool:
        futs = {pool.submit(gen_still, s, model_key, api_key, out_dir, piece_id): s for s in stills}
        for fut in concurrent.futures.as_completed(futs):
            still, out, cost, err = fut.result()
            sid = still.get("id","?")
            if err: print(f"  ⚠️  {sid} FAILED: {err}")
            else: print(f"  ✅ {sid} → {out.name} (${cost:.3f}, {int(time.time()-started)}s)")
            results.append((still, out, cost, err))
    succ = sum(1 for _,o,_,_ in results if o)
    total = sum(c for _,_,c,_ in results)
    print(f"\n{succ}/{len(stills)} succeeded, ${total:.3f} total, {int(time.time()-started)}s")


if __name__ == "__main__":
    main()
