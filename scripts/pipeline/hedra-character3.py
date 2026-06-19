#!/usr/bin/env python3
"""
Hedra Character-3 — lip-synced talking-head from a single portrait + audio.

Use case: Betsy (CR canonical narrator) delivers VO chunks as a real
talking head. Replaces the deprecated Kling-i2v corner-anchor pattern
for the four presenter beats per long-form video:
  intro hook / mid-1 figure / mid-2 verdict / outro CTA

Endpoint: https://api.hedra.com/web-app/public
Model: character-3 (lip-sync from portrait reference + audio file)
Aspect: 16:9 default; 9:16 for shorts (--aspect 9:16)
Cost: ~$0.50-1.00 per 8s clip

Auth: reads HEDRA_API_KEY from env. Falls back to legacy NT_HEDRA_API_KEY
(same key, shared portfolio-wide).

Usage:
    python3 hedra-character3.py \\
        --portrait companies/campaign-receipts/brand/betsy-portrait.png \\
        --audio _build/<slug>/vo-hook.mp3 \\
        --duration 8 \\
        --out _build/<slug>/clips/betsy-hook.mp4 \\
        --aspect 16:9
"""
import argparse, json, os, subprocess, sys, time, uuid
from pathlib import Path
import urllib.request, urllib.error

HEDRA_BASE = "https://api.hedra.com/web-app/public"
CHARACTER_3_MODEL_ID = "d1dd37a3-e39a-4854-a298-6510289f9cf2"  # current Character-3 model id


def env_key():
    return os.environ.get("HEDRA_API_KEY") or os.environ.get("NT_HEDRA_API_KEY")


def load_env_file():
    candidates = [
        Path(__file__).resolve().parents[4] / ".env",
        Path("/Applications/DrAntoniou Projects/AgentCompanies/.env"),
    ]
    for p in candidates:
        if p.is_file():
            for line in p.read_text().splitlines():
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, _, v = line.partition("=")
                k = k.strip()
                v = v.strip().strip('"').strip("'")
                os.environ.setdefault(k, v)
            return p
    return None


def hedra_request(method, path, api_key, body=None, files=None, timeout=300):
    """JSON request OR multipart file upload depending on `files`."""
    url = HEDRA_BASE + path
    if files is None:
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(url, data=data, method=method)
        req.add_header("X-API-Key", api_key)
        if body is not None:
            req.add_header("Content-Type", "application/json")
    else:
        boundary = "----HedraBoundary" + uuid.uuid4().hex
        parts = []
        if body:
            for k, v in body.items():
                parts.append(
                    f"--{boundary}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n".encode()
                )
        for field_name, (filename, file_bytes, mime) in files.items():
            parts.append(
                f"--{boundary}\r\nContent-Disposition: form-data; name=\"{field_name}\"; filename=\"{filename}\"\r\n"
                f"Content-Type: {mime}\r\n\r\n".encode()
            )
            parts.append(file_bytes)
            parts.append(b"\r\n")
        parts.append(f"--{boundary}--\r\n".encode())
        data = b"".join(parts)
        req = urllib.request.Request(url, data=data, method=method)
        req.add_header("X-API-Key", api_key)
        req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            text = r.read()
            return json.loads(text) if text else {}
    except urllib.error.HTTPError as e:
        body_text = e.read().decode()[:500]
        print(f"  Hedra HTTP {e.code} on {method} {path}: {body_text}", file=sys.stderr)
        raise


def upload_asset(api_key, file_path, asset_type):
    """asset_type: 'audio' | 'image'. Returns asset_id."""
    p = Path(file_path)
    stub = hedra_request("POST", "/assets", api_key, body={
        "name": p.name,
        "type": asset_type,
    })
    asset_id = stub.get("id")
    if not asset_id:
        print(f"ERR: no asset_id in response: {stub}", file=sys.stderr); sys.exit(1)

    mime_by_type = {"audio": "audio/mpeg", "image": "image/png"}
    if p.suffix.lower() in (".jpg", ".jpeg"):
        mime_by_type["image"] = "image/jpeg"
    if p.suffix.lower() == ".wav":
        mime_by_type["audio"] = "audio/wav"
    mime = mime_by_type.get(asset_type, "application/octet-stream")

    hedra_request("POST", f"/assets/{asset_id}/upload", api_key,
                  files={"file": (p.name, p.read_bytes(), mime)}, timeout=600)
    return asset_id


def start_generation(api_key, image_id, audio_id, aspect="16:9", resolution="720p", duration_ms=None):
    body = {
        "type": "video",
        "ai_model_id": CHARACTER_3_MODEL_ID,
        "start_keyframe_id": image_id,
        "audio_id": audio_id,
        "generated_video_inputs": {
            "text_prompt": "subtle natural micro-expressions, slight head movement, warm conversational delivery, eye contact with camera",
            "aspect_ratio": aspect,
            "resolution": resolution,
        },
    }
    if duration_ms is not None:
        body["generated_video_inputs"]["duration_ms"] = int(duration_ms)
    result = hedra_request("POST", "/generations", api_key, body=body)
    gen_id = result.get("id") or result.get("generation_id")
    if not gen_id:
        print(f"ERR: no generation_id in response: {result}", file=sys.stderr); sys.exit(1)
    return gen_id


def poll_until_complete(api_key, gen_id, max_wait=900):
    start = time.time()
    last_status = None
    consecutive_errors = 0
    time.sleep(3)
    while True:
        if time.time() - start > max_wait:
            print(f"  ⚠️  Hedra timeout > {max_wait}s", file=sys.stderr); return None
        try:
            st = hedra_request("GET", f"/generations/{gen_id}/status", api_key, timeout=30)
            consecutive_errors = 0
        except Exception:
            consecutive_errors += 1
            if consecutive_errors >= 5: return None
            time.sleep(5); continue
        status = st.get("status", "?")
        if status != last_status:
            print(f"  Hedra: {status} ({int(time.time()-start)}s)")
            last_status = status
        if status in ("complete", "completed", "succeeded"):
            return st
        if status in ("failed", "error", "cancelled"):
            print(f"  ⚠️  Hedra status={status}: {json.dumps(st)[:300]}", file=sys.stderr)
            return None
        time.sleep(6)


def download_result(status, out_path):
    url = None
    for key in ("url", "video_url", "download_url"):
        v = status.get(key)
        if isinstance(v, str) and v.startswith("http"):
            url = v; break
    if not url and isinstance(status.get("asset"), dict):
        url = status["asset"].get("url")
    if not url and isinstance(status.get("assets"), list) and status["assets"]:
        first = status["assets"][0]
        if isinstance(first, dict):
            url = first.get("url")
    if not url:
        print(f"  ⚠️  no download URL in status: {json.dumps(status)[:500]}", file=sys.stderr)
        return False
    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(url, timeout=600) as r:
        Path(out_path).write_bytes(r.read())
    return True


def get_audio_duration_ms(audio_path):
    try:
        out = subprocess.check_output([
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", str(audio_path)
        ]).decode().strip()
        return int(float(out) * 1000)
    except Exception:
        return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--portrait", required=True, help="Path to Betsy portrait PNG")
    ap.add_argument("--audio", required=True, help="Path to VO chunk MP3/WAV")
    ap.add_argument("--duration", type=float, required=True,
                    help="Expected output duration (informational; Hedra derives from audio)")
    ap.add_argument("--out", required=True, help="Output mp4 path")
    ap.add_argument("--aspect", default="16:9", choices=["16:9", "9:16"])
    ap.add_argument("--resolution", default="720p")
    args = ap.parse_args()

    loaded = load_env_file()
    api_key = env_key()
    if not api_key:
        print(f"ERROR: HEDRA_API_KEY (or NT_HEDRA_API_KEY) not set. .env loaded from: {loaded}", file=sys.stderr)
        sys.exit(2)

    portrait = Path(args.portrait).resolve()
    audio = Path(args.audio).resolve()
    out = Path(args.out).resolve()
    if not portrait.is_file():
        sys.exit(f"portrait not found: {portrait}")
    if not audio.is_file():
        sys.exit(f"audio not found: {audio}")

    print(f"[hedra] uploading portrait {portrait.name}…")
    image_id = upload_asset(api_key, portrait, "image")
    print(f"[hedra] image_id={image_id}")

    print(f"[hedra] uploading audio {audio.name}…")
    audio_id = upload_asset(api_key, audio, "audio")
    print(f"[hedra] audio_id={audio_id}")

    duration_ms = get_audio_duration_ms(audio)
    print(f"[hedra] submitting generation aspect={args.aspect} duration_ms={duration_ms}…")
    gen_id = start_generation(api_key, image_id, audio_id,
                              aspect=args.aspect, resolution=args.resolution,
                              duration_ms=duration_ms)
    print(f"[hedra] gen_id={gen_id}")

    status = poll_until_complete(api_key, gen_id, max_wait=900)
    if not status:
        sys.exit("Hedra generation did not complete")
    print(f"[hedra] complete")

    print(f"[hedra] downloading → {out}")
    ok = download_result(status, out)
    if not ok:
        sys.exit("Hedra download failed")
    size_kb = out.stat().st_size / 1024
    print(f"[hedra] saved {size_kb:.1f} KB")

    sidecar = out.with_suffix(".hedra.json")
    sidecar.write_text(json.dumps({
        "vendor": "hedra-character3",
        "generation_id": gen_id,
        "portrait": str(portrait),
        "audio": str(audio),
        "duration_s": args.duration,
        "aspect": args.aspect,
        "out": str(out),
        "size_bytes": out.stat().st_size,
    }, indent=2))


if __name__ == "__main__":
    main()
