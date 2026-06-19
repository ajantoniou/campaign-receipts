#!/usr/bin/env python3
"""
YouTube upload for Campaign Receipts — OAuth + resumable upload.

ONE-TIME SETUP (founder action, ~15 min):
1. Sign into YouTube with antonioualfred@gmail.com
2. Create Brand Account / channel "Campaign Receipts"
3. Go to console.cloud.google.com → New Project "campaign-receipts"
4. APIs & Services → Enable "YouTube Data API v3"
5. Credentials → Create OAuth 2.0 Client ID → "Desktop app"
6. Download client_secret.json → save to repo root
7. Run: python3 youtube-upload.py --auth
   This opens browser, you sign in, paste the code back. Saves refresh token.
8. Set in .env: CR_YOUTUBE_CLIENT_SECRET_PATH=client_secret.json

NORMAL USE (after one-time setup):
    python3 youtube-upload.py \\
        --video public/longform/sealed-aipac-embassy-v1.mp4 \\
        --title "60 KILLED THE SAME DAY — JERUSALEM EMBASSY RECEIPT" \\
        --description-file _build/sealed-aipac-embassy-v1/description.md \\
        --tags "politics,jerusalem,embassy,trump,fact check,sealed 2016" \\
        --thumbnail _build/sealed-aipac-embassy-v1/thumbnail.jpg \\
        --privacy public \\
        --piece sealed-aipac-embassy-v1 \\
        --replace-id SSuO2KOXr0Y       # deletes the broken v1 only after success

    # Playlist auto-resolution (no --playlist needed):
    #   slug starts with sealed-*  → "Sealed2016" playlist (auto-created if missing)
    #   slug starts with cr-*      → CR_YOUTUBE_PLAYLIST_CR_NEW_NEWS in root .env
    # Override with --playlist PLxxxx or --ensure-playlist "Some Name".

    # Schedule for later
    python3 youtube-upload.py --video ... --publish-at 2026-05-12T14:00:00Z --piece <uuid>

    # Backfill: add an already-published video to a named playlist
    python3 youtube-upload.py --add-to-playlist "Sealed2016" --video-id w9YX_8mnOf8

    # Delete duplicate / bad uploads (irreversible)
    python3 youtube-upload.py --delete VIDEO_ID [--delete OTHER_ID ...]
"""
import json
import os
import re
import sys
import urllib.request  # noqa: F401 — used by urllib.request below
import urllib.parse
import urllib.error
import datetime as dt
import http.server
import webbrowser
from pathlib import Path

REPO = Path("/Applications/DrAntoniou Projects/AgentCompanies")
ENV = REPO / ".env"
CR_DIR = REPO / "companies/campaign-receipts"
COST_LOG = CR_DIR / "scripts/.external-costs.jsonl"
TOKEN_STORE = CR_DIR / "scripts/.youtube-token.json"

# OAuth scopes: upload + manage own videos
SCOPES = (
    "https://www.googleapis.com/auth/youtube.upload "
    "https://www.googleapis.com/auth/youtube"
)
# Founder 2026-06-01: the newsletter is NOT free, and the outro/CTA is the bare
# campaignreceipts.com (no /weekly). Dropped the required /weekly link from the
# growth gate so descriptions are not forced to carry a link/claim we removed.
GROWTH_TRIAD = (
    ("CampaignReceipts.com", "campaignreceipts.com"),
    ("SEALED2016.com", "sealed2016.com"),
)


def require_growth_triad(description):
    desc = description.lower()
    missing = [label for label, needle in GROWTH_TRIAD if needle not in desc]
    if missing:
        print(
            "ERR: YouTube description missing required growth link(s): "
            + ", ".join(missing),
            file=sys.stderr,
        )
        print(
            "     Add CampaignReceipts.com, SEALED2016.com, and campaignreceipts.com/weekly before upload.",
            file=sys.stderr,
        )
        sys.exit(1)

def load_env():
    env = {}
    if ENV.exists():
        for line in ENV.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                k, _, v = line.partition("=")
                env[k.strip()] = v.strip().strip('"')
    return env

def load_client_secret():
    env = load_env()
    path = env.get("CR_YOUTUBE_CLIENT_SECRET_PATH", "client_secret.json")
    full = REPO / path if not Path(path).is_absolute() else Path(path)
    if not full.exists():
        print(f"ERR: client_secret.json not found at {full}", file=sys.stderr)
        print("Download from console.cloud.google.com → APIs → Credentials", file=sys.stderr)
        sys.exit(1)
    data = json.loads(full.read_text())
    inst = data.get("installed") or data.get("web")
    return inst["client_id"], inst["client_secret"]

def auth_flow():
    """One-time OAuth — opens browser, captures code, exchanges for refresh token."""
    client_id, client_secret = load_client_secret()
    redirect = "http://localhost:8765/callback"

    # Step 1: browser to consent
    params = {
        "client_id": client_id,
        "redirect_uri": redirect,
        "response_type": "code",
        "scope": SCOPES,
        "access_type": "offline",
        "prompt": "consent",
    }
    auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode(params)
    print(f"\nOpening browser. Sign in with antonioualfred@gmail.com.")
    print(f"If browser doesn't open, visit:\n{auth_url}\n")

    code_holder = {}

    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            qs = urllib.parse.urlparse(self.path).query
            params = urllib.parse.parse_qs(qs)
            if "code" in params:
                code_holder["code"] = params["code"][0]
                self.send_response(200)
                self.send_header("Content-Type", "text/html")
                self.end_headers()
                self.wfile.write(b"<h1>OK</h1><p>You can close this tab.</p>")
            else:
                self.send_response(400); self.end_headers()
                self.wfile.write(b"No code received")
        def log_message(self, *a, **kw): pass

    server = http.server.HTTPServer(("localhost", 8765), Handler)
    webbrowser.open(auth_url)
    while "code" not in code_holder:
        server.handle_request()

    # Step 2: exchange code for refresh token
    token_req = urllib.request.Request(
        "https://oauth2.googleapis.com/token",
        data=urllib.parse.urlencode({
            "code": code_holder["code"],
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect,
            "grant_type": "authorization_code",
        }).encode(),
        method="POST",
    )
    token_req.add_header("Content-Type", "application/x-www-form-urlencoded")
    with urllib.request.urlopen(token_req) as r:
        tokens = json.loads(r.read())

    TOKEN_STORE.parent.mkdir(parents=True, exist_ok=True)
    TOKEN_STORE.write_text(json.dumps(tokens, indent=2))
    print(f"\n✅ Refresh token saved to {TOKEN_STORE}")
    print(f"   You can now upload videos. No further auth needed.")

def get_access_token():
    """Use refresh token to get a fresh access token."""
    if not TOKEN_STORE.exists():
        print(f"ERR: No token store. Run: python3 {sys.argv[0]} --auth", file=sys.stderr)
        sys.exit(1)
    tokens = json.loads(TOKEN_STORE.read_text())
    refresh = tokens.get("refresh_token")
    if not refresh:
        print("ERR: No refresh_token in token store. Re-run --auth", file=sys.stderr)
        sys.exit(1)
    client_id, client_secret = load_client_secret()
    req = urllib.request.Request(
        "https://oauth2.googleapis.com/token",
        data=urllib.parse.urlencode({
            "client_id": client_id,
            "client_secret": client_secret,
            "refresh_token": refresh,
            "grant_type": "refresh_token",
        }).encode(),
        method="POST",
    )
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())["access_token"]

def log_cost(piece_id, vendor, cost_usd, note):
    COST_LOG.parent.mkdir(parents=True, exist_ok=True)
    entry = {
        "ts": dt.datetime.now().isoformat(),
        "issueId": piece_id,
        "vendor": vendor,
        "cost_usd": round(cost_usd, 4),
        "note": note,
    }
    with open(COST_LOG, "a") as f:
        f.write(json.dumps(entry) + "\n")

def delete_video(video_id, piece_id="youtube-delete"):
    """Permanently delete a video owned by the authenticated channel."""
    token = get_access_token()
    url = f"https://www.googleapis.com/youtube/v3/videos?id={urllib.parse.quote(video_id)}"
    req = urllib.request.Request(url, method="DELETE")
    req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            pass
        print(f"🗑️  Deleted {video_id}")
        log_cost(piece_id, "youtube/delete", 0.0, video_id)
        return True
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:400]
        if e.code == 404:
            print(f"  ⚠️  {video_id} not found (already deleted?)")
            return True
        print(f"ERR delete {video_id} HTTP {e.code}: {body}", file=sys.stderr)
        sys.exit(1)


def upload_video(video_path, title, description, tags, privacy, publish_at, piece_id, category_id="27"):
    video_path = Path(video_path)
    if not video_path.exists():
        print(f"ERR: video not found: {video_path}", file=sys.stderr); sys.exit(1)
    require_growth_triad(description)
    access_token = get_access_token()

    metadata = {
        "snippet": {
            "title": title[:100],   # YouTube limit
            "description": description[:5000],
            "tags": tags,
            "categoryId": category_id,
            "defaultLanguage": "en",
        },
        "status": {
            "privacyStatus": "private" if publish_at else privacy,
            "selfDeclaredMadeForKids": False,
        },
    }
    if publish_at:
        metadata["status"]["publishAt"] = publish_at
        metadata["status"]["privacyStatus"] = "private"

    # Initiate resumable upload
    init_url = (
        "https://www.googleapis.com/upload/youtube/v3/videos"
        "?uploadType=resumable&part=snippet,status"
    )
    init_req = urllib.request.Request(
        init_url, data=json.dumps(metadata).encode(), method="POST"
    )
    init_req.add_header("Authorization", f"Bearer {access_token}")
    init_req.add_header("Content-Type", "application/json")
    init_req.add_header("X-Upload-Content-Type", "video/*")
    init_req.add_header("X-Upload-Content-Length", str(video_path.stat().st_size))

    try:
        with urllib.request.urlopen(init_req) as r:
            upload_url = r.headers.get("Location")
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        if e.code == 429 and "Video Uploads per day" in body:
            print(
                "ERR: YouTube daily Video Uploads quota exhausted (resets midnight Pacific).\n"
                "     Re-run tomorrow or: scripts/pipeline/sealed-youtube-resume.sh\n"
                f"     API: {body[:280]}",
                file=sys.stderr,
            )
            sys.exit(42)
        print(f"ERR upload init: HTTP {e.code}: {body[:400]}", file=sys.stderr)
        sys.exit(1)

    print(f"  Init OK. Upload URL acquired.")
    print(f"  Uploading {video_path.stat().st_size / 1e6:.1f}MB...")

    # Upload in one shot (for files <2GB this is fine)
    with open(video_path, "rb") as f:
        body = f.read()
    upload_req = urllib.request.Request(upload_url, data=body, method="PUT")
    upload_req.add_header("Content-Type", "video/*")
    upload_req.add_header("Content-Length", str(len(body)))
    try:
        with urllib.request.urlopen(upload_req, timeout=900) as r:
            result = json.loads(r.read())
    except urllib.error.HTTPError as e:
        print(f"ERR upload: HTTP {e.code}: {e.read().decode()[:400]}", file=sys.stderr); sys.exit(1)

    video_id = result.get("id")
    url = f"https://youtu.be/{video_id}"
    log_cost(piece_id, "youtube", 0.0, f"upload {title[:40]} → {video_id}")
    print(f"\n✅ Uploaded: {url}")
    return video_id, url


def add_to_playlist(video_id, playlist_id, piece_id="youtube-playlist"):
    """Insert uploaded video into a playlist (CR new-news vs SEALED 145)."""
    if not playlist_id or not str(playlist_id).strip():
        return False
    access_token = get_access_token()
    body = json.dumps({
        "snippet": {
            "playlistId": playlist_id.strip(),
            "resourceId": {"kind": "youtube#video", "videoId": video_id},
        }
    }).encode()
    url = "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet"
    req = urllib.request.Request(url, data=body, method="POST")
    req.add_header("Authorization", f"Bearer {access_token}")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            json.loads(r.read())
        print(f"  ✅ Added to playlist {playlist_id}")
        log_cost(piece_id, "youtube/playlist", 0.0, f"{video_id} → {playlist_id}")
        return True
    except urllib.error.HTTPError as e:
        msg = e.read().decode()[:400]
        print(f"  ⚠️  playlist insert HTTP {e.code}: {msg}", file=sys.stderr)
        print(f"     Add manually in Studio to playlist {playlist_id}", file=sys.stderr)
        return False


def list_my_playlists():
    """Return [(id, title), ...] for playlists owned by the authed channel."""
    token = get_access_token()
    out = []
    page = None
    while True:
        url = (
            "https://www.googleapis.com/youtube/v3/playlists"
            "?part=snippet,contentDetails&mine=true&maxResults=50"
        )
        if page:
            url += f"&pageToken={page}"
        req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                data = json.loads(r.read())
        except urllib.error.HTTPError as e:
            print(f"  ⚠️  playlists.list HTTP {e.code}: {e.read().decode()[:200]}",
                  file=sys.stderr)
            return out
        for item in data.get("items", []):
            out.append((item["id"], item["snippet"]["title"]))
        page = data.get("nextPageToken")
        if not page:
            break
    return out


def create_playlist(title, description="", privacy="public", piece_id="youtube-playlist"):
    """Create a playlist owned by the authed channel; returns its ID."""
    token = get_access_token()
    body = json.dumps({
        "snippet": {"title": title, "description": description, "defaultLanguage": "en"},
        "status": {"privacyStatus": privacy},
    }).encode()
    req = urllib.request.Request(
        "https://www.googleapis.com/youtube/v3/playlists?part=snippet,status",
        data=body, method="POST",
    )
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            data = json.loads(r.read())
        pid = data["id"]
        print(f"  ✅ Created playlist '{title}' → {pid}")
        log_cost(piece_id, "youtube/playlist-create", 0.0, f"{title} → {pid}")
        return pid
    except urllib.error.HTTPError as e:
        print(f"  ❌ playlists.insert HTTP {e.code}: {e.read().decode()[:300]}",
              file=sys.stderr)
        return None


def ensure_playlist(name, description="", privacy="public", piece_id="youtube-playlist"):
    """Find playlist by exact title (case-insensitive); create if missing.

    Persists the resolved ID back into root .env as CR_YOUTUBE_PLAYLIST_<UPPER>
    so subsequent uploads (and humans) can reference it by name only.
    """
    if not name:
        return None
    for pid, title in list_my_playlists():
        if title.strip().lower() == name.strip().lower():
            print(f"  ✅ Playlist '{name}' already exists → {pid}")
            _persist_playlist_env(name, pid)
            return pid
    pid = create_playlist(name, description=description, privacy=privacy, piece_id=piece_id)
    if pid:
        _persist_playlist_env(name, pid)
    return pid


def _persist_playlist_env(name, playlist_id):
    """Append CR_YOUTUBE_PLAYLIST_<NAME>=<id> to root .env if not already present."""
    if not ENV.exists() or not playlist_id:
        return
    key = "CR_YOUTUBE_PLAYLIST_" + re.sub(r"[^A-Z0-9]+", "_", name.upper()).strip("_")
    raw = ENV.read_text()
    if f"\n{key}=" in raw or raw.startswith(f"{key}="):
        return
    with open(ENV, "a") as f:
        if not raw.endswith("\n"):
            f.write("\n")
        f.write(f"{key}={playlist_id}\n")
    print(f"  ✅ Saved {key} to root .env")


def resolve_playlist_for_slug(slug, explicit=None):
    """Pick the playlist for a slug. Explicit --playlist wins; otherwise:
       sealed-* → SEALED2016 playlist; cr-* → CR new-news playlist.
    Reads env first; falls back to ensure_playlist (will hit API)."""
    if explicit:
        return explicit
    env = load_env()
    s = (slug or "").lower()
    if s.startswith("sealed-") or s.startswith("sealed2016") or "sealed-aipac" in s:
        pid = env.get("CR_YOUTUBE_PLAYLIST_SEALED2016")
        return pid or ensure_playlist(
            "Sealed2016",
            description="SEALED 2016 — 145-promise audit of Trump's 2016 platform. "
                        "Every figure tied to the book and primary sources. sealed2016.com",
        )
    if s.startswith("cr-"):
        return env.get("CR_YOUTUBE_PLAYLIST_CR_NEW_NEWS")
    return None


def upload_thumbnail(video_id, thumbnail_path):
    """POST a custom 1280×720 JPEG to YouTube as the video's thumbnail.

    Channel must be in good standing (verified phone + no recent strikes).
    If 403 returned, we log and continue — the video is still uploaded;
    founder can set the thumbnail manually via Studio.
    """
    access_token = get_access_token()
    p = Path(thumbnail_path)
    if not p.exists():
        print(f"  ⚠️  thumbnail not found: {p}", file=sys.stderr)
        return False
    with open(p, "rb") as f:
        body = f.read()
    url = (
        "https://www.googleapis.com/upload/youtube/v3/thumbnails/set"
        f"?videoId={video_id}&uploadType=media"
    )
    req = urllib.request.Request(url, data=body, method="POST")
    req.add_header("Authorization", f"Bearer {access_token}")
    req.add_header("Content-Type", "image/jpeg")
    req.add_header("Content-Length", str(len(body)))
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            json.loads(r.read())
        print(f"  ✅ Custom thumbnail set ({len(body)/1024:.1f} KB)")
        return True
    except urllib.error.HTTPError as e:
        code = e.code
        msg = e.read().decode()[:400]
        if code == 403:
            print(f"  ⚠️  thumbnail upload 403 (channel may not be verified for custom thumbnails). Video is still uploaded — set thumbnail manually via YouTube Studio. Details: {msg}", file=sys.stderr)
        else:
            print(f"  ⚠️  thumbnail upload HTTP {code}: {msg}", file=sys.stderr)
        return False

def update_video_meta(video_id, title, description, tags, category_id="27", privacy=None, piece_id="meta-update"):
    """Patch snippet (+ optional status) on an existing video. No upload quota."""
    require_growth_triad(description)
    access_token = get_access_token()
    parts = ["snippet"]
    body = {
        "id": video_id,
        "snippet": {
            "title": title[:100],
            "description": description[:5000],
            "tags": tags,
            "categoryId": category_id,
            "defaultLanguage": "en",
        },
    }
    if privacy:
        parts.append("status")
        body["status"] = {"privacyStatus": privacy, "selfDeclaredMadeForKids": False}
    url = f"https://www.googleapis.com/youtube/v3/videos?part={','.join(parts)}"
    req = urllib.request.Request(url, data=json.dumps(body).encode(), method="PUT")
    req.add_header("Authorization", f"Bearer {access_token}")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            json.loads(r.read())
        log_cost(piece_id, "youtube/meta", 0.0, f"meta {video_id} {title[:40]}")
        print(f"  ✅ Metadata updated for {video_id}" + (f" (privacy={privacy})" if privacy else ""))
        return True
    except urllib.error.HTTPError as e:
        print(f"  ❌ meta update HTTP {e.code}: {e.read().decode()[:400]}", file=sys.stderr)
        return False


def main():
    args = sys.argv[1:]
    if "--auth" in args:
        auth_flow()
        return
    if "--help" in args or "-h" in args or not args:
        print(__doc__); sys.exit(0)

    # --delete VIDEO_ID  (repeatable)
    delete_ids = []
    i = 0
    while i < len(args):
        if args[i] == "--delete":
            i += 1
            while i < len(args) and not args[i].startswith("--"):
                delete_ids.append(args[i])
                i += 1
        else:
            i += 1
    if delete_ids:
        for vid in delete_ids:
            delete_video(vid, piece_id="cr-shorts-cleanup")
        print(f"\nDone. Deleted {len(delete_ids)} video(s).")
        return

    if "--list-playlists" in args:
        for pid, title in list_my_playlists():
            print(f"{pid}  {title}")
        return

    if "--add-to-playlist" in args:
        idx = args.index("--add-to-playlist")
        pl_name = args[idx + 1] if idx + 1 < len(args) else None
        vid_ids = []
        j = 0
        while j < len(args):
            if args[j] == "--video-id":
                j += 1
                while j < len(args) and not args[j].startswith("--"):
                    vid_ids.append(args[j])
                    j += 1
            else:
                j += 1
        if not pl_name or not vid_ids:
            print("ERR: --add-to-playlist NAME --video-id ID [ID ...]",
                  file=sys.stderr)
            sys.exit(1)
        pid = ensure_playlist(pl_name, piece_id="playlist-backfill")
        if not pid:
            sys.exit(1)
        ok = 0
        for vid in vid_ids:
            if add_to_playlist(vid, pid, piece_id="playlist-backfill"):
                ok += 1
        print(f"\nDone. {ok}/{len(vid_ids)} added to '{pl_name}' ({pid}).")
        return

    def get(flag, default=None):
        if flag in args:
            idx = args.index(flag)
            return args[idx + 1] if idx + 1 < len(args) else default
        return default

    # --update-meta VIDEO_ID: patch title/desc/tags + thumb + privacy + delete-old.
    # Use when founder uploaded the master via Studio and just needs packaging applied.
    if "--update-meta" in args:
        vid = get("--update-meta")
        title = get("--title")
        desc_file = get("--description-file")
        desc = get("--description", "")
        tags_str = get("--tags", "")
        category_id = get("--category", "27")
        thumbnail = get("--thumbnail")
        privacy = get("--privacy")  # optional flip (e.g. private→public)
        replace_id = get("--replace-id")
        piece_id = get("--piece", f"meta-{vid}")
        if not vid or not title:
            print("ERR: --update-meta VIDEO_ID --title ... required", file=sys.stderr); sys.exit(1)
        if desc_file:
            desc = Path(desc_file).read_text()
        tags = [t.strip() for t in tags_str.split(",") if t.strip()]
        ok_meta = update_video_meta(vid, title, desc, tags, category_id=category_id,
                                     privacy=privacy, piece_id=piece_id)
        if not ok_meta:
            sys.exit(1)
        if thumbnail:
            upload_thumbnail(vid, thumbnail)
        # Playlist (same auto-resolution as upload path)
        pl_explicit = get("--playlist")
        pl_name = get("--ensure-playlist")
        playlist_id = None
        if pl_name:
            playlist_id = ensure_playlist(pl_name, piece_id=piece_id)
        elif pl_explicit:
            playlist_id = pl_explicit
        else:
            playlist_id = resolve_playlist_for_slug(piece_id)
        if playlist_id:
            add_to_playlist(vid, playlist_id, piece_id=piece_id)
        if replace_id and replace_id != vid:
            print(f"  Deleting old video {replace_id}...")
            delete_video(replace_id, piece_id=f"{piece_id}-replace")
        print(f"\n✅ Done. https://youtu.be/{vid}")
        return

    video = get("--video")
    title = get("--title")
    desc_file = get("--description-file")
    desc = get("--description", "")
    tags_str = get("--tags", "")
    privacy = get("--privacy", "private")  # default to private — flip to public manually
    publish_at = get("--publish-at")
    piece_id = get("--piece", "manual-test")

    if not video or not title:
        print("ERR: --video and --title required", file=sys.stderr); sys.exit(1)

    # 2026-05-22: pre-upload pillarbox gate (portfolio-wide, mirrors NTO). Refuses
    # masters where >10% of canvas is black bar (pillarbox or letterbox). Override
    # with --skip-pillarbox-check + founder signoff only.
    if "--skip-pillarbox-check" not in args:
        import subprocess as _sp
        pq = REPO / "shared/scripts/pillarbox_qc.py"
        if pq.exists() and Path(video).exists():
            r = _sp.run(["python3", str(pq), video], capture_output=True, text=True)
            sys.stdout.write(r.stdout); sys.stderr.write(r.stderr)
            if r.returncode == 2:
                print("\n❌ UPLOAD BLOCKED: pillarbox/letterbox detected. Fix the master or pass --skip-pillarbox-check with founder review.",
                      file=sys.stderr)
                sys.exit(2)

    if desc_file:
        desc = Path(desc_file).read_text()
    tags = [t.strip() for t in tags_str.split(",") if t.strip()]

    category_id = get("--category", "27")
    thumbnail = get("--thumbnail")
    expect_voice = get("--expect-voice", "jessica")  # CR canonical narrator
    storyboard = get("--storyboard")
    # Slug used for playlist routing / cost-log; --piece doubles as slug.
    slug = get("--slug") or piece_id
    # --replace-id OLD_ID: delete OLD_ID only after upload+playlist+thumb succeed.
    # Prevents the "shaking + wrong date" v1 from staying up alongside the fix.
    replace_id = get("--replace-id")
    # --ensure-playlist NAME: find playlist by title; create if missing; persist ID to .env.
    ensure_pl_name = get("--ensure-playlist")
    # Playlist resolution order: explicit --playlist > --ensure-playlist NAME >
    # slug heuristic (sealed-* → SEALED2016, cr-* → CR new-news).
    explicit_playlist = get("--playlist")
    if ensure_pl_name and not explicit_playlist:
        explicit_playlist = ensure_playlist(ensure_pl_name, piece_id=piece_id)
    playlist_id = resolve_playlist_for_slug(slug, explicit=explicit_playlist)
    skip_qc = "--skip-audio-qc" in args or "--skip-production-qc" in args
    skip_ship = "--skip-ship-checklist" in args
    build_override = get("--build-dir")

    # Ship checklist — narration sync, overlays, clips (shorts + longform)
    if not skip_ship:
        ship_script = Path(__file__).parent / "ship-checklist.py"
        video_path = Path(video)
        if not video_path.is_absolute():
            video_path = CR_DIR / video_path
        if "shorts" in str(video_path) and ship_script.exists():
            build = Path(build_override) if build_override else CR_DIR / "scripts/shorts/_build/001"
            if not build.is_absolute():
                build = CR_DIR / build
            print(f"\n📋 Ship checklist (short)...")
            ship = __import__("subprocess").run([
                "python3", str(ship_script),
                "--mode", "short",
                "--master", str(video_path),
                "--build", str(build),
            ])
            if ship.returncode != 0:
                print("\n❌ Ship checklist FAILED — upload aborted.", file=sys.stderr)
                sys.exit(2)

    # Production QC gate — BINDING (script/ship/scribe/audio). Not persona markdown.
    if not skip_qc:
        if storyboard:
            sb_path = Path(storyboard)
            if not sb_path.is_absolute():
                sb_path = CR_DIR / sb_path
            print(f"\n🔍 Running production-qc (binding) before upload...")
            qc_cmd = [
                "python3", str(Path(__file__).parent / "production-qc.py"),
                "--storyboard", str(sb_path),
                "--piece", piece_id,
                "--expect-voice", expect_voice,
            ]
            if build_override:
                qc_cmd.extend(["--build", build_override])
            qc_result = __import__("subprocess").run(qc_cmd)
            if qc_result.returncode != 0:
                print(f"\n❌ Production QC FAILED — upload aborted.", file=sys.stderr)
                print(f"   Fix master/vo/script; do not use --skip-production-qc in normal ops.", file=sys.stderr)
                sys.exit(2)
        else:
            qc_script = Path(__file__).parent / "audio-qc.py"
            print(f"\n🔍 Running audio-qc --strict (no --storyboard; prefer production-qc)...")
            qc_cmd = ["python3", str(qc_script), "--master", video,
                      "--piece", piece_id, "--expect-voice", expect_voice, "--strict"]
            qc_result = __import__("subprocess").run(qc_cmd)
            if qc_result.returncode != 0:
                print(f"\n❌ Audio QC FAILED — upload aborted.", file=sys.stderr)
                sys.exit(2)

    video_id, url = upload_video(video, title, desc, tags, privacy, publish_at, piece_id, category_id=category_id)
    pl_ok = True
    if playlist_id:
        pl_ok = add_to_playlist(video_id, playlist_id, piece_id=f"{piece_id}-playlist")
    thumb_ok = True
    if thumbnail:
        thumb_ok = upload_thumbnail(video_id, thumbnail)
    print(f"\n🎬 Video ID: {video_id}")
    print(f"🔗 Watch:   {url}")

    # Atomic-ish replace: only delete the old listing after the new one is live
    # AND any playlist/thumbnail attached. Stops us from ever standing up
    # a fixed master while the broken v1 stays in the feed.
    if replace_id:
        if replace_id == video_id:
            print(f"  ⚠️  --replace-id matches new upload; skipping delete.",
                  file=sys.stderr)
        elif not pl_ok and playlist_id:
            print(f"\n⚠️  Skipping --replace-id {replace_id}: playlist insert failed.",
                  file=sys.stderr)
            print(f"    Verify {video_id} in playlist {playlist_id} then run:",
                  file=sys.stderr)
            print(f"      python3 youtube-upload.py --delete {replace_id}",
                  file=sys.stderr)
        else:
            print(f"\n🗑️  Replacing old listing {replace_id} (post-QC, post-upload)...")
            delete_video(replace_id, piece_id=f"{piece_id}-replace")

if __name__ == "__main__":
    main()
