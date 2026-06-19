#!/usr/bin/env bash
# 12-hour autonomous pulse: 30 min × 24 iterations. For nohup on a workstation
# or a long-lived shell — probes public health endpoints and appends a line to LOG.
# Does not git pull (avoid surprise merges).
#
# Usage: nohup bash infrastructure/scripts/portfolio-health-pulse-12h.sh >> /tmp/portfolio-pulse.out 2>&1 &
#
# Env (optional):
#   HEALTHBREW_HEALTH_URL     e.g. https://<service>.onrender.com/api/health — if unset, skipped
#   PORTFOLIO_PULSE_LOG       default /tmp/portfolio-health-pulse.log
set -euo pipefail

HEALTHBREW_HEALTH_URL="${HEALTHBREW_HEALTH_URL:-}"
LOG="${PORTFOLIO_PULSE_LOG:-/tmp/portfolio-health-pulse.log}"
INTERVAL_SEC="${PORTFOLIO_PULSE_INTERVAL_SEC:-1800}"
ROUNDS="${PORTFOLIO_PULSE_ROUNDS:-24}"

code() {
  local url="$1"
  if ! curl -sS -o /dev/null -w "%{http_code}" --connect-timeout 8 --max-time 25 "$url" 2>/dev/null; then
    echo "ERR"
  fi
}

ts() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

{
  echo "$(ts) portfolio-health-pulse-12h start rounds=${ROUNDS} interval_sec=${INTERVAL_SEC}"
} >>"$LOG"

for i in $(seq 1 "$ROUNDS"); do
  if [[ -n "$HEALTHBREW_HEALTH_URL" ]]; then
    hb="$(code "$HEALTHBREW_HEALTH_URL")"
  else
    hb="skip"
  fi
  echo "$(ts) round=${i}/${ROUNDS} healthbrew=${hb}" >>"$LOG"
  if [[ "$i" -lt "$ROUNDS" ]]; then
    sleep "$INTERVAL_SEC"
  fi
done

echo "$(ts) portfolio-health-pulse-12h done" >>"$LOG"
