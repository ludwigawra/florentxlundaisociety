#!/usr/bin/env bash
# AI-OS — PostToolUse failure hook
# Appends one-line tool failures to learning/tool-errors.log.
#
# Claude Code delivers the tool event as JSON on stdin. We extract tool name,
# success flag, and a short error summary. If the tool succeeded we do nothing.
#
# Contract: always exit 0.

set +e
set -u

ROOT="${CLAUDE_PROJECT_DIR:-$PWD}"
[ -f "$ROOT/CLAUDE.md" ] || exit 0
[ -d "$ROOT/learning" ] || mkdir -p "$ROOT/learning" >/dev/null 2>&1

LOG="$ROOT/learning/tool-errors.log"

# Read up to 256KB of the event payload (bigger JSON is unusual; guard memory).
PAYLOAD="$(head -c 262144 2>/dev/null)"

# No payload? Nothing to do.
[ -z "$PAYLOAD" ] && exit 0

# --- Parse with python3 if available (robust), else fall back to grep --------
TOOL_NAME=""
SUCCESS=""
ERR_SUMMARY=""

if command -v python3 >/dev/null 2>&1; then
  # Feed the payload to python via env var (safer than stdin pipes).
  export AIOS_EVENT_JSON="$PAYLOAD"
  PARSED="$(
    python3 - <<'PY' 2>/dev/null
import json, os, sys
raw = os.environ.get("AIOS_EVENT_JSON", "")
try:
    evt = json.loads(raw)
except Exception:
    sys.exit(0)

tool = evt.get("tool_name") or evt.get("tool") or ""
resp = evt.get("tool_response") or evt.get("response") or {}
if isinstance(resp, str):
    # Some harnesses pass the response as a plain string.
    success = True
    err = ""
else:
    success = bool(resp.get("success", True))
    # Prefer explicit error fields; otherwise scan for "error" keys.
    err = (
        resp.get("error")
        or resp.get("error_message")
        or resp.get("message")
        or ""
    )
    if not err and not success:
        err = str(resp)[:300]

# Also respect top-level success/error on the event itself.
if "success" in evt and not evt["success"]:
    success = False
if not err:
    err = evt.get("error") or ""

# Condense the error to one line, ~200 chars.
err = " ".join(str(err).split())[:200]
print(f"tool={tool}")
print(f"success={'true' if success else 'false'}")
print(f"err={err}")
PY
  )"
  while IFS='=' read -r k v; do
    case "$k" in
      tool)    TOOL_NAME="$v" ;;
      success) SUCCESS="$v" ;;
      err)     ERR_SUMMARY="$v" ;;
    esac
  done <<EOF
$PARSED
EOF
  unset AIOS_EVENT_JSON
else
  # Degraded fallback — crude regex extraction.
  TOOL_NAME="$(printf '%s' "$PAYLOAD" | sed -n 's/.*"tool_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n 1)"
  if printf '%s' "$PAYLOAD" | grep -q '"success"[[:space:]]*:[[:space:]]*false'; then
    SUCCESS="false"
  else
    SUCCESS="true"
  fi
  ERR_SUMMARY="$(printf '%s' "$PAYLOAD" | sed -n 's/.*"error"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n 1 | cut -c1-200)"
fi

# Only log failures.
if [ "$SUCCESS" != "false" ]; then
  exit 0
fi

[ -z "$TOOL_NAME" ] && TOOL_NAME="unknown"
[ -z "$ERR_SUMMARY" ] && ERR_SUMMARY="(no error message)"

TS="$(date +%Y-%m-%dT%H:%M:%S%z)"
# One line per failure. Consolidation parses this log.
printf '%s\ttool=%s\terror=%s\n' "$TS" "$TOOL_NAME" "$ERR_SUMMARY" >> "$LOG" 2>/dev/null

exit 0
