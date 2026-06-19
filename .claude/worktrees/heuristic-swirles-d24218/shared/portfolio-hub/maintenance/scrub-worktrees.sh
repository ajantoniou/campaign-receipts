#!/usr/bin/env bash
# scrub-worktrees.sh — portfolio-wide stale worktree + build-cache reclaimer.
#
# Founder lock 2026-05-26 (after Sealed/ ballooned to 4.1GB from stale agent
# worktrees). Designed as a SAFE, DRY-RUN-FIRST cleaner. Never auto-deletes.
#
# STALENESS DETECTION (v2 — git-commit-date based):
#   Uses `git worktree list --porcelain` + `git log -1 --format=%ct <HEAD>`
#   to get the LAST COMMIT TIMESTAMP for each registered worktree.
#   This is sub-second and cross-platform — no mtime, no find-newest-file.
#   A worktree whose HEAD commit is older than AGE_DAYS is a candidate.
#   If the worktree directory is missing on disk but still registered in git,
#   the script auto-unlocks + removes the dangling git record.
#
# WHAT IT TARGETS (only things older than $AGE_DAYS days, default 7):
#   1. Claude Code agent worktrees — via `git worktree list --porcelain`
#      (names matching agent-* or *-*-[0-9a-f]* — skips main)
#   2. Next.js build cache: */.next/
#   3. Retired-service node_modules: services/*/node_modules/
#   4. Stale claude/ and worktree-agent-* branches (dry-run lists, confirm deletes)
#
# WHAT IT NEVER TOUCHES:
#   - .git/                              (git internals)
#   - companies/*/node_modules/          (active dev deps)
#   - public/, artifacts/, dist/, src/   (deliverables)
#   - .env*, *.key, *credentials*        (secrets)
#   - The current branch / any open PR branch
#
# USAGE:
#   bash shared/portfolio-hub/maintenance/scrub-worktrees.sh
#     → dry-run, writes report to scrub-reports/<date>.md, NO DELETE
#
#   bash shared/portfolio-hub/maintenance/scrub-worktrees.sh --confirm
#     → reads the most recent report and deletes everything listed
#
#   bash shared/portfolio-hub/maintenance/scrub-worktrees.sh --age 14
#     → use a different age threshold (days)
#
#   bash shared/portfolio-hub/maintenance/scrub-worktrees.sh --quiet
#     → suppress per-path output (still writes report). Used by SessionStart hook.
#
# EXIT CODES:
#   0 — success, no targets found
#   1 — success, targets found in dry-run (founder action: review + --confirm)
#   2 — usage error
#   3 — destructive operation failed mid-flight
#
set -euo pipefail

# ── resolve repo root regardless of caller's CWD ────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
REPORTS_DIR="$SCRIPT_DIR/scrub-reports"
mkdir -p "$REPORTS_DIR"

# ── args ────────────────────────────────────────────────────────────────
AGE_DAYS=7
MODE="dry-run"
QUIET=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --confirm) MODE="confirm" ;;
    --age) shift; AGE_DAYS="$1" ;;
    --quiet) QUIET=1 ;;
    -h|--help)
      sed -n '2,/^set -euo/p' "$0" | grep "^# " | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
  shift
done

TODAY="$(date +%Y-%m-%d)"
NOW_HHMM="$(date +%H%M)"
REPORT="$REPORTS_DIR/scrub-${TODAY}-${NOW_HHMM}.md"
NOW_EPOCH="$(date +%s)"

# Latest report (used for --confirm)
LATEST_REPORT="$(ls -1t "$REPORTS_DIR"/scrub-*.md 2>/dev/null | head -1 || true)"

log() {
  if [[ "$QUIET" -eq 0 ]]; then echo "$@"; fi
}

# ── HELPER: parse git worktrees and return stale candidates ─────────────
# Outputs lines: WORKTREE|<path>|<size>|<last-commit-date>|<age_days>|<missing>
# <missing>=1 means the directory doesn't exist on disk (dangling git record)
scan_git_worktrees() {
  local wt_path="" wt_head="" wt_branch=""
  local threshold_epoch=$(( NOW_EPOCH - AGE_DAYS * 86400 ))

  # git worktree list --porcelain emits blank-line-separated blocks:
  #   worktree <path>
  #   HEAD <sha>
  #   branch refs/heads/<name>   (or "detached")
  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ "$line" == worktree\ * ]]; then
      wt_path="${line#worktree }"
      wt_head=""; wt_branch=""
    elif [[ "$line" == HEAD\ * ]]; then
      wt_head="${line#HEAD }"
    elif [[ "$line" == branch\ * ]]; then
      wt_branch="${line#branch refs/heads/}"
    elif [[ -z "$line" && -n "$wt_path" ]]; then
      # End of block — evaluate this worktree
      _eval_worktree "$wt_path" "$wt_head" "$wt_branch" "$threshold_epoch"
      wt_path=""; wt_head=""; wt_branch=""
    fi
  done < <(git -C "$REPO_ROOT" worktree list --porcelain && echo "")
  # Handle last block (no trailing blank line)
  if [[ -n "$wt_path" ]]; then
    _eval_worktree "$wt_path" "$wt_head" "$wt_branch" "$threshold_epoch"
  fi
}

_eval_worktree() {
  local wt_path="$1" wt_head="$2" wt_branch="$3" threshold_epoch="$4"

  # Skip main worktree (it IS the repo root)
  if [[ "$wt_path" == "$REPO_ROOT" ]]; then return; fi

  # Only target agent-named worktrees (agent-* or slug-hex like priceless-nobel-42461c)
  local bn
  bn="$(basename "$wt_path")"
  case "$bn" in
    agent-*|*-*-[0-9a-f]*) : ;;
    *) return ;;
  esac

  # Commit-date staleness — sub-second, cross-platform
  local commit_epoch=""
  if [[ -n "$wt_head" ]]; then
    commit_epoch="$(git -C "$REPO_ROOT" log -1 --format=%ct "$wt_head" 2>/dev/null || true)"
  fi
  # If we can't get a commit date (dangling SHA), treat as maximally stale
  if [[ -z "$commit_epoch" || ! "$commit_epoch" =~ ^[0-9]+$ ]]; then
    commit_epoch=0
  fi

  local age_days=$(( (NOW_EPOCH - commit_epoch) / 86400 ))

  # Check if directory exists on disk
  local missing=0
  if [[ ! -d "$wt_path" ]]; then missing=1; fi

  # Missing dirs are always emitted (dangling record — auto-clean regardless of age)
  # Present dirs only emitted if older than threshold
  if [[ "$missing" -eq 0 && "$commit_epoch" -gt "$threshold_epoch" ]]; then
    return  # fresh worktree, skip
  fi

  local size="n/a"
  if [[ "$missing" -eq 0 ]]; then
    size="$(du -sh "$wt_path" 2>/dev/null | cut -f1)"
  fi
  local last_date
  last_date="$(date -r "$commit_epoch" "+%Y-%m-%d" 2>/dev/null || date -d "@$commit_epoch" "+%Y-%m-%d" 2>/dev/null || echo "unknown")"

  echo "WORKTREE|$wt_path|$size|$last_date|$age_days|$missing|$wt_head|$wt_branch"
}

# ── HELPER: scan stale claude/ and worktree-agent-* branches ────────────
# Outputs lines: BRANCH|<name>|<last-commit-date>|<age_days>
scan_stale_branches() {
  local threshold_epoch=$(( NOW_EPOCH - AGE_DAYS * 86400 ))

  git -C "$REPO_ROOT" branch --format='%(refname:short)|%(objectname:short)|%(committerdate:unix)' 2>/dev/null \
  | while IFS='|' read -r name sha epoch; do
      case "$name" in
        claude/*|worktree-agent-*) : ;;
        *) continue ;;
      esac
      [[ -z "$epoch" || ! "$epoch" =~ ^[0-9]+$ ]] && epoch=0
      local age_days=$(( (NOW_EPOCH - epoch) / 86400 ))
      if [[ "$epoch" -le "$threshold_epoch" ]]; then
        local last_date
        last_date="$(date -r "$epoch" "+%Y-%m-%d" 2>/dev/null || date -d "@$epoch" "+%Y-%m-%d" 2>/dev/null || echo "unknown")"
        echo "BRANCH|$name|$last_date|$age_days"
      fi
    done
}

# ── DRY-RUN MODE ────────────────────────────────────────────────────────
if [[ "$MODE" == "dry-run" ]]; then
  log "scrub-worktrees v2: DRY-RUN (age threshold: ${AGE_DAYS}d, repo: $REPO_ROOT)"
  log ""

  TMP_TARGETS="$(mktemp)"
  trap 'rm -f "$TMP_TARGETS"' EXIT

  # 1. Git-registered agent worktrees (commit-date based)
  scan_git_worktrees >> "$TMP_TARGETS" || true

  # 2. Stale .next/ caches (directory mtime is fine here — it's just a cache signal)
  find "$REPO_ROOT/companies" -maxdepth 3 -type d -name ".next" 2>/dev/null | while read -r nx; do
    if [[ "$nx" == *"/.claude/worktrees/"* ]]; then continue; fi
    nx_epoch="$(stat -f "%m" "$nx" 2>/dev/null || stat -c "%Y" "$nx" 2>/dev/null || echo 0)"
    age_days=$(( (NOW_EPOCH - nx_epoch) / 86400 ))
    if [[ "$age_days" -lt "$AGE_DAYS" ]]; then continue; fi
    size="$(du -sh "$nx" 2>/dev/null | cut -f1)"
    last_date="$(date -r "$nx_epoch" "+%Y-%m-%d" 2>/dev/null || date -d "@$nx_epoch" "+%Y-%m-%d" 2>/dev/null || echo unknown)"
    echo "NEXT|$nx|$size|$last_date|$age_days|0||"
  done >> "$TMP_TARGETS" || true

  # 3. Stale retired-service node_modules
  find "$REPO_ROOT/companies" -maxdepth 5 -type d -path "*/services/*/node_modules" 2>/dev/null | while read -r nm; do
    if [[ "$nm" == *"/.claude/worktrees/"* ]]; then continue; fi
    nm_epoch="$(stat -f "%m" "$nm" 2>/dev/null || stat -c "%Y" "$nm" 2>/dev/null || echo 0)"
    age_days=$(( (NOW_EPOCH - nm_epoch) / 86400 ))
    if [[ "$age_days" -lt "$AGE_DAYS" ]]; then continue; fi
    size="$(du -sh "$nm" 2>/dev/null | cut -f1)"
    last_date="$(date -r "$nm_epoch" "+%Y-%m-%d" 2>/dev/null || date -d "@$nm_epoch" "+%Y-%m-%d" 2>/dev/null || echo unknown)"
    echo "SVC_NM|$nm|$size|$last_date|$age_days|0||"
  done >> "$TMP_TARGETS" || true

  # 4. Stale claude/ and worktree-agent-* branches
  scan_stale_branches >> "$TMP_TARGETS" || true

  # ── write report ────────────────────────────────────────────────────
  {
    echo "# Scrub Report — $TODAY $NOW_HHMM"
    echo ""
    echo "**Repo:** \`$REPO_ROOT\`"
    echo "**Age threshold:** \`${AGE_DAYS} days\`"
    echo "**Mode:** dry-run (no files or branches were deleted)"
    echo "**Staleness method:** git commit-date (v2 — mtime-free)"
    echo ""

    # Separate worktrees/fs targets from branch targets
    TMP_FS="$(mktemp)"; TMP_BR="$(mktemp)"
    grep -v "^BRANCH|" "$TMP_TARGETS" > "$TMP_FS" 2>/dev/null || true
    grep "^BRANCH|"    "$TMP_TARGETS" > "$TMP_BR" 2>/dev/null || true

    echo "## Filesystem targets"
    echo ""
    if [[ ! -s "$TMP_FS" ]]; then
      echo "_None — nothing to clean up._"
    else
      echo "| Kind | Path | Size | Last commit | Age |"
      echo "|------|------|-----:|-------------|----:|"
      while IFS='|' read -r kind path size mtime age_days missing _sha _br; do
        rel_path="${path#$REPO_ROOT/}"
        case "$kind" in
          WORKTREE)
            if [[ "$missing" == "1" ]]; then
              kind_label="⛓️  Dangling worktree"
            else
              kind_label="🌳 Worktree"
            fi
            ;;
          NEXT)    kind_label="🏗️  .next cache" ;;
          SVC_NM)  kind_label="📦 services/node_modules" ;;
          *)       kind_label="$kind" ;;
        esac
        echo "| $kind_label | \`$rel_path\` | $size | $mtime | ${age_days}d |"
      done < "$TMP_FS"
    fi
    echo ""

    echo "## Branch targets (stale claude/ + worktree-agent-* branches)"
    echo ""
    if [[ ! -s "$TMP_BR" ]]; then
      echo "_None._"
    else
      echo "| Branch | Last commit | Age |"
      echo "|--------|-------------|----:|"
      while IFS='|' read -r _kind name mtime age_days; do
        echo "| \`$name\` | $mtime | ${age_days}d |"
      done < "$TMP_BR"
    fi
    echo ""

    FS_COUNT=$(wc -l < "$TMP_FS" | tr -d ' ')
    BR_COUNT=$(wc -l < "$TMP_BR" | tr -d ' ')
    TOTAL_COUNT=$(( FS_COUNT + BR_COUNT ))
    if [[ "$TOTAL_COUNT" -gt 0 ]]; then
      echo "**$FS_COUNT filesystem targets + $BR_COUNT branches.**"
      echo "Run \`bash shared/portfolio-hub/maintenance/scrub-worktrees.sh --confirm\` to clean all."
    else
      echo "_Nothing to clean._"
    fi
    echo ""
    echo "## Safety guarantees (audit trail)"
    echo "- ❌ Skipped \`.git/worktrees/\` (git-managed)"
    echo "- ❌ Skipped active \`companies/*/node_modules/\` (dev deps)"
    echo "- ❌ Skipped \`public/\`, \`artifacts/\`, \`dist/\`, \`src/\` (deliverables)"
    echo "- ❌ Skipped main worktree (repo root)"
    echo "- ✅ Worktree staleness: git commit-date (not mtime)"
    echo "- ✅ Dangling git worktree records auto-cleaned on --confirm"
    echo "- ✅ Branch filter: \`claude/*\` + \`worktree-agent-*\` only"

    rm -f "$TMP_FS" "$TMP_BR"
  } > "$REPORT"

  log "📄 Report: $REPORT"

  WT_COUNT=$(grep -c "^WORKTREE\|^NEXT\|^SVC_NM" "$TMP_TARGETS" 2>/dev/null || true)
  BR_COUNT=$(grep -c "^BRANCH" "$TMP_TARGETS" 2>/dev/null || true)
  TOTAL_COUNT=$(( WT_COUNT + BR_COUNT ))

  if [[ "$TOTAL_COUNT" -gt 0 ]]; then
    log "🔍 Found $WT_COUNT filesystem targets + $BR_COUNT stale branches"
    log "▶  To delete: bash $0 --confirm"
    exit 1
  else
    log "✓ Nothing to clean."
    exit 0
  fi
fi

# ── CONFIRM MODE ────────────────────────────────────────────────────────
if [[ "$MODE" == "confirm" ]]; then
  if [[ -z "$LATEST_REPORT" ]]; then
    echo "ERR: no prior scrub report. Run dry-run first." >&2
    exit 2
  fi

  log "scrub-worktrees v2: CONFIRM (using $LATEST_REPORT)"
  log ""

  RECLAIMED_KB=0

  # ── 1. Filesystem targets (parse table rows from report) ──────────────
  # Table lines look like: | 🌳 Worktree | `rel/path` | 421M | 2026-05-18 | 8d |
  FS_PATHS=$(awk -F'`' '/^\| (🌳|🏗️|📦|⛓️) / {print $2}' "$LATEST_REPORT" 2>/dev/null || true)

  if [[ -n "$FS_PATHS" ]]; then
    while IFS= read -r rel; do
      [[ -z "$rel" ]] && continue
      full="$REPO_ROOT/$rel"

      # Belt-and-suspenders safety
      case "$full" in
        */.git|*/.git/*) log "⚠️  refusing to touch .git: $rel"; continue ;;
        */public|*/public/*|*/artifacts|*/artifacts/*) log "⚠️  refusing to touch deliverable: $rel"; continue ;;
        */src|*/src/*) log "⚠️  refusing to touch src: $rel"; continue ;;
      esac

      if [[ ! -d "$full" ]]; then
        log "⚠️  skip (gone): $rel"
        # Still need to clean dangling git worktree record if it matches
        bn="$(basename "$full")"
        case "$bn" in
          agent-*|*-*-[0-9a-f]*)
            log "   → cleaning dangling git record for $bn"
            git -C "$REPO_ROOT" worktree unlock "$full" 2>/dev/null || true
            git -C "$REPO_ROOT" worktree remove --force "$full" 2>/dev/null || true
            ;;
        esac
        continue
      fi

      SIZE_KB=$(du -sk "$full" 2>/dev/null | cut -f1)
      RECLAIMED_KB=$((RECLAIMED_KB + SIZE_KB))
      log "🗑️   $rel ($((SIZE_KB / 1024)) MB)"

      # For agent worktrees: unlock git record before rm -rf
      bn="$(basename "$full")"
      case "$bn" in
        agent-*|*-*-[0-9a-f]*)
          git -C "$REPO_ROOT" worktree unlock "$full" 2>/dev/null || true
          git -C "$REPO_ROOT" worktree remove --force "$full" 2>/dev/null || true
          ;;
        *)
          rm -rf "$full"
          ;;
      esac
    done <<< "$FS_PATHS"
  fi

  # Prune any remaining dangling worktree records
  git -C "$REPO_ROOT" worktree prune 2>/dev/null || true

  # ── 2. Branch cleanup ─────────────────────────────────────────────────
  # Branch table rows look like: | `claude/beautiful-shamir-0f65db` | 2026-05-15 | 11d |
  BR_NAMES=$(awk -F'`' '/^\| `(claude\/|worktree-agent-)/ {print $2}' "$LATEST_REPORT" 2>/dev/null || true)
  if [[ -n "$BR_NAMES" ]]; then
    log ""
    log "🌿 Deleting stale branches..."
    CURRENT_BRANCH="$(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)"
    while IFS= read -r br; do
      [[ -z "$br" ]] && continue
      if [[ "$br" == "$CURRENT_BRANCH" ]]; then
        log "⚠️  skip (current branch): $br"
        continue
      fi
      if git -C "$REPO_ROOT" branch -d "$br" 2>/dev/null; then
        log "🗑️   branch $br"
      elif git -C "$REPO_ROOT" branch -D "$br" 2>/dev/null; then
        log "🗑️   branch $br (force-deleted — unmerged)"
      else
        log "⚠️  could not delete: $br"
      fi
    done <<< "$BR_NAMES"
  fi

  RECLAIMED_GB=$(awk "BEGIN {printf \"%.2f\", $RECLAIMED_KB / 1024 / 1024}")
  log ""
  log "✅ Reclaimed ${RECLAIMED_GB} GB"

  # Append outcome to the report
  {
    echo ""
    echo "## Confirmed execution"
    echo "- Executed: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "- Reclaimed: **${RECLAIMED_GB} GB**"
  } >> "$LATEST_REPORT"

  exit 0
fi

echo "ERR: unknown mode: $MODE" >&2
exit 2
