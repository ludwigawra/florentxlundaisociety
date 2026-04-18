#!/usr/bin/env bash
# AI-OS — SessionStart hook
# Creates a short-term memory file and prints vital signs + learned patterns
# to stdout for injection into Claude's context.
#
# Contract:
#   - Must never fail the session: all errors are swallowed and we exit 0.
#   - Must be fast (< 100ms target, no network, no heavy I/O).
#   - Paths are relative to $CLAUDE_PROJECT_DIR (the AI-OS root).

set +e
set -u

# --- Resolve root ------------------------------------------------------------
ROOT="${CLAUDE_PROJECT_DIR:-$PWD}"

# If we're not inside an AI-OS brain, stay silent and exit — do not disturb.
if [ ! -f "$ROOT/CLAUDE.md" ] || [ ! -d "$ROOT/HIPPOCAMPUS" ]; then
  exit 0
fi

TODAY="$(date +%Y-%m-%d)"
SHORT_DIR="$ROOT/HIPPOCAMPUS/short-term"
CEREBELLUM_DIR="$ROOT/CEREBELLUM"
DECISIONS_DIR="$ROOT/HIPPOCAMPUS/decisions"

mkdir -p "$SHORT_DIR" "$CEREBELLUM_DIR" "$DECISIONS_DIR" >/dev/null 2>&1

# --- Short UUID (portable, no uuidgen required) ------------------------------
SHORT_UUID="$(
  # Use /dev/urandom -> hex. Fall back to $RANDOM if that fails.
  (od -An -N4 -tx1 /dev/urandom 2>/dev/null | tr -d ' \n') \
  || printf '%04x%04x' "${RANDOM:-0}" "${RANDOM:-0}"
)"
SHORT_UUID="${SHORT_UUID:0:8}"

SESSION_FILE="$SHORT_DIR/session-${TODAY}-${SHORT_UUID}.md"

# --- Create session file if not already present ------------------------------
if [ ! -f "$SESSION_FILE" ]; then
  {
    printf -- '---\n'
    printf 'type: session\n'
    printf 'created: %s\n' "$TODAY"
    printf 'updated: %s\n' "$TODAY"
    printf 'status: active\n'
    printf 'session_id: %s\n' "$SHORT_UUID"
    printf 'tags: [short-term, session]\n'
    printf -- '---\n\n'
    printf '# Session — %s (%s)\n\n' "$TODAY" "$SHORT_UUID"
    printf '## Context\n\n_(auto-created by SessionStart hook)_\n\n'
    printf '## Decisions\n\n'
    printf '## Learned\n\n'
    printf '## Pending\n\n'
  } > "$SESSION_FILE" 2>/dev/null
fi

# Export the path for other hooks in this session (best-effort).
printf '%s\n' "$SESSION_FILE" > "$SHORT_DIR/.current-session" 2>/dev/null

# --- Vital signs -------------------------------------------------------------
# Count of short-term files (excluding transcripts and dotfiles).
SHORT_COUNT=0
if [ -d "$SHORT_DIR" ]; then
  SHORT_COUNT=$(find "$SHORT_DIR" -maxdepth 1 -type f -name '*.md' 2>/dev/null | wc -l | tr -d ' ')
fi

# Days since last consolidation report (any file matching consolidation-report-*.md).
LAST_CONSOL="unknown"
DAYS_SINCE_CONSOL="?"
LATEST_REPORT=$(
  ls -1t "$SHORT_DIR"/consolidation-report-*.md 2>/dev/null | head -n 1
)
if [ -n "$LATEST_REPORT" ]; then
  # Parse YYYY-MM-DD out of filename; safer than stat across platforms.
  BASENAME="$(basename "$LATEST_REPORT")"
  DATE_PART="$(printf '%s' "$BASENAME" | sed -n 's/consolidation-report-\([0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}\).md/\1/p')"
  if [ -n "$DATE_PART" ]; then
    LAST_CONSOL="$DATE_PART"
    # Compute days diff without GNU date assumptions.
    if command -v python3 >/dev/null 2>&1; then
      DAYS_SINCE_CONSOL=$(
        python3 - <<PY 2>/dev/null
from datetime import date
a = date.fromisoformat("$TODAY")
b = date.fromisoformat("$DATE_PART")
print((a - b).days)
PY
      )
      [ -z "$DAYS_SINCE_CONSOL" ] && DAYS_SINCE_CONSOL="?"
    fi
  fi
fi

# Unextracted corrections: lines starting with "- " in corrections.md that don't have
# a "[extracted]" marker. Fast, imperfect, good enough as a signal.
CORRECTIONS_FILE="$CEREBELLUM_DIR/corrections.md"
UNEXTRACTED=0
if [ -f "$CORRECTIONS_FILE" ]; then
  UNEXTRACTED=$(grep -c '^- ' "$CORRECTIONS_FILE" 2>/dev/null | tr -d ' ')
  EXTRACTED=$(grep -c '\[extracted\]' "$CORRECTIONS_FILE" 2>/dev/null | tr -d ' ')
  UNEXTRACTED=${UNEXTRACTED:-0}
  EXTRACTED=${EXTRACTED:-0}
  UNEXTRACTED=$((UNEXTRACTED - EXTRACTED))
  [ "$UNEXTRACTED" -lt 0 ] && UNEXTRACTED=0
fi

# --- Emit context block ------------------------------------------------------
printf '\n'
printf '=== AI-OS Brain Stem ===\n'
printf 'Session file: %s\n' "$SESSION_FILE"
printf '\n'
printf 'Vital signs:\n'
printf '  - Short-term files: %s\n' "$SHORT_COUNT"
printf '  - Last consolidation: %s (%s days ago)\n' "$LAST_CONSOL" "$DAYS_SINCE_CONSOL"
printf '  - Unextracted corrections: %s\n' "$UNEXTRACTED"
printf '\n'

PATTERNS_FILE="$CEREBELLUM_DIR/patterns.md"
if [ -f "$PATTERNS_FILE" ]; then
  printf 'Active patterns (from CEREBELLUM/patterns.md):\n'
  # First 200 lines, indented for readability.
  head -n 200 "$PATTERNS_FILE" 2>/dev/null | sed 's/^/  /'
  printf '\n'
else
  printf 'Active patterns: (none yet — CEREBELLUM/patterns.md not found)\n\n'
fi

printf 'Reminder: write decisions, learnings, and feedback to the session file during this session.\n'
printf '=========================\n'

exit 0
