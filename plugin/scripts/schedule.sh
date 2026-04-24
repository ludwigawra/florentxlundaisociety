#!/usr/bin/env bash
#
# schedule.sh — install a nightly cron/launchd entry that fires AI-OS's
# autonomous skills while the user sleeps. This is what turns "you have
# to remember to run the consolidation" into "at 3am the brain works."
#
# Usage:
#   schedule.sh --brain ~/aios-demo-brain [--time 03:00] [--dry-run] [--uninstall]
#
# What it does:
#   - macOS: writes a launchd plist to ~/Library/LaunchAgents/com.aios.<name>.plist
#            and loads it with launchctl.
#   - Linux: writes a crontab line (idempotent — replaces existing AI-OS entries).
#
# What the schedule runs:
#   A small runner script, installed into <brain>/.claude/scheduled/run-nightly.sh,
#   that invokes Claude Code non-interactively and asks it to run the nightly
#   cycle (consolidation → behavioral-learning → goal-pursuit). Logs go to
#   <brain>/.claude/scheduled/logs/YYYY-MM-DD.log.
#
# Safety:
#   - Idempotent. Re-running replaces the entry, does not stack.
#   - --dry-run prints what would happen without touching the system.
#   - --uninstall removes the entry.
#
# This is a minimal wrapper. It intentionally does not try to be a general
# cron abstraction — it installs one entry, for AI-OS, and gets out of the way.

set -euo pipefail

BRAIN=""
TIME="03:00"
DRY_RUN=0
UNINSTALL=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --brain) BRAIN="$2"; shift 2 ;;
    --time)  TIME="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    --uninstall) UNINSTALL=1; shift ;;
    -h|--help)
      grep -E '^#( |!)' "$0" | sed 's/^# \{0,1\}//; s/^#!.*//'
      exit 0 ;;
    *) echo "unknown flag: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "$BRAIN" ]]; then
  echo "error: --brain is required (path to your AI-OS brain)" >&2
  echo "example: $0 --brain ~/aios-demo-brain --time 03:00" >&2
  exit 1
fi

# Expand ~ if present (shell didn't, because we took it as a literal arg)
BRAIN="${BRAIN/#\~/$HOME}"

if [[ ! -d "$BRAIN" ]]; then
  echo "error: brain folder not found: $BRAIN" >&2
  exit 1
fi

if [[ ! "$TIME" =~ ^[0-2][0-9]:[0-5][0-9]$ ]]; then
  echo "error: --time must be HH:MM (24-hour), got: $TIME" >&2
  exit 1
fi

HOUR="${TIME%:*}"
MIN="${TIME#*:}"
# strip leading zeros for cron (avoid octal interpretation)
HOUR_INT=$((10#$HOUR))
MIN_INT=$((10#$MIN))

PLATFORM="$(uname -s)"
RUNNER_DIR="$BRAIN/.claude/scheduled"
RUNNER="$RUNNER_DIR/run-nightly.sh"
LOGS_DIR="$RUNNER_DIR/logs"

write_runner() {
  mkdir -p "$RUNNER_DIR" "$LOGS_DIR"
  cat > "$RUNNER" <<'RUNNER_EOF'
#!/usr/bin/env bash
# Auto-installed by plugin/scripts/schedule.sh. Runs the AI-OS nightly cycle.
set -euo pipefail

BRAIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG_FILE="$BRAIN_DIR/.claude/scheduled/logs/$(date +%Y-%m-%d).log"
mkdir -p "$(dirname "$LOG_FILE")"

{
  echo "=== $(date -Iseconds) AI-OS nightly cycle start ==="
  cd "$BRAIN_DIR"

  if ! command -v claude >/dev/null 2>&1; then
    echo "ERROR: claude CLI not on PATH — cannot run nightly cycle."
    exit 1
  fi

  # Fire the nightly cycle in one non-interactive session. The prompt chains
  # the three skills in the order behavioral-learning expects.
  claude --print <<'PROMPT'
Run the nightly cycle now, in this order:
1. Invoke /nightly-consolidation to process today's short-term memory.
2. Then invoke /behavioral-learning in observe mode to extract inferred patterns from today's transcripts and autonomous runs.
3. Then invoke /nightly-goal-pursuit with depth=standard to advance one stalled goal.
Log each run's completion to routines/autonomous-runs.jsonl with trigger="cron".
PROMPT

  echo "=== $(date -Iseconds) AI-OS nightly cycle end ==="
} >>"$LOG_FILE" 2>&1
RUNNER_EOF
  chmod +x "$RUNNER"
}

install_macos() {
  local LABEL="com.aios.$(basename "$BRAIN" | tr -c 'A-Za-z0-9' '-')"
  local PLIST="$HOME/Library/LaunchAgents/${LABEL}.plist"

  if [[ $DRY_RUN -eq 1 ]]; then
    echo "[dry-run] would write: $PLIST"
    echo "[dry-run] schedule: daily at ${HOUR_INT}:${MIN_INT}"
    echo "[dry-run] runner:   $RUNNER"
    return 0
  fi

  write_runner

  cat > "$PLIST" <<PLIST_EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>${RUNNER}</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key><integer>${HOUR_INT}</integer>
    <key>Minute</key><integer>${MIN_INT}</integer>
  </dict>
  <key>StandardOutPath</key><string>${LOGS_DIR}/launchd-stdout.log</string>
  <key>StandardErrorPath</key><string>${LOGS_DIR}/launchd-stderr.log</string>
</dict>
</plist>
PLIST_EOF

  # Reload (idempotent: unload first if already loaded)
  launchctl unload "$PLIST" 2>/dev/null || true
  launchctl load "$PLIST"
  echo "installed launchd job: $LABEL (daily at ${HOUR_INT}:${MIN_INT})"
  echo "log tail: tail -f $LOGS_DIR/launchd-stdout.log"
}

install_linux() {
  local MARKER_BEGIN="# BEGIN AI-OS schedule ($BRAIN)"
  local MARKER_END="# END AI-OS schedule ($BRAIN)"

  if [[ $DRY_RUN -eq 1 ]]; then
    echo "[dry-run] would add crontab entry:"
    echo "  ${MIN_INT} ${HOUR_INT} * * * /bin/bash ${RUNNER}"
    return 0
  fi

  write_runner

  # Remove any existing block for this brain, then append fresh
  local TMP
  TMP="$(mktemp)"
  crontab -l 2>/dev/null | awk -v b="$MARKER_BEGIN" -v e="$MARKER_END" '
    $0 == b {skip=1; next}
    $0 == e {skip=0; next}
    !skip {print}
  ' > "$TMP"
  {
    echo "$MARKER_BEGIN"
    echo "${MIN_INT} ${HOUR_INT} * * * /bin/bash ${RUNNER}"
    echo "$MARKER_END"
  } >> "$TMP"
  crontab "$TMP"
  rm "$TMP"
  echo "installed crontab entry (daily at ${HOUR_INT}:${MIN_INT})"
  echo "log tail: tail -f $LOGS_DIR/$(date +%Y-%m-%d).log"
}

uninstall_macos() {
  local LABEL="com.aios.$(basename "$BRAIN" | tr -c 'A-Za-z0-9' '-')"
  local PLIST="$HOME/Library/LaunchAgents/${LABEL}.plist"
  if [[ -f "$PLIST" ]]; then
    launchctl unload "$PLIST" 2>/dev/null || true
    rm "$PLIST"
    echo "removed $PLIST"
  else
    echo "no launchd job for this brain (looked for $PLIST)"
  fi
}

uninstall_linux() {
  local MARKER_BEGIN="# BEGIN AI-OS schedule ($BRAIN)"
  local MARKER_END="# END AI-OS schedule ($BRAIN)"
  local TMP
  TMP="$(mktemp)"
  crontab -l 2>/dev/null | awk -v b="$MARKER_BEGIN" -v e="$MARKER_END" '
    $0 == b {skip=1; next}
    $0 == e {skip=0; next}
    !skip {print}
  ' > "$TMP"
  crontab "$TMP" 2>/dev/null || true
  rm "$TMP"
  echo "removed any AI-OS crontab entries for $BRAIN"
}

if [[ $UNINSTALL -eq 1 ]]; then
  case "$PLATFORM" in
    Darwin) uninstall_macos ;;
    Linux)  uninstall_linux ;;
    *) echo "unsupported platform: $PLATFORM" >&2; exit 1 ;;
  esac
  exit 0
fi

case "$PLATFORM" in
  Darwin) install_macos ;;
  Linux)  install_linux ;;
  *) echo "unsupported platform: $PLATFORM (works on macOS + Linux)" >&2; exit 1 ;;
esac
