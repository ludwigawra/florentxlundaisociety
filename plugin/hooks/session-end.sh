#!/usr/bin/env bash
# AI-OS — SessionEnd hook
# Archives the session transcript (when accessible) and drops a marker for the
# nightly consolidation to pick up.
#
# Contract: exit 0 no matter what.

set +e
set -u

ROOT="${CLAUDE_PROJECT_DIR:-$PWD}"

if [ ! -f "$ROOT/CLAUDE.md" ] || [ ! -d "$ROOT/memory" ]; then
  exit 0
fi

TODAY="$(date +%Y-%m-%d)"
SHORT_DIR="$ROOT/memory/short-term"
TRANSCRIPT_DIR="$SHORT_DIR/transcripts"
mkdir -p "$TRANSCRIPT_DIR" >/dev/null 2>&1

# --- Recover the session id from the current-session pointer -----------------
SESSION_FILE=""
if [ -f "$SHORT_DIR/.current-session" ]; then
  SESSION_FILE="$(head -n 1 "$SHORT_DIR/.current-session" 2>/dev/null || true)"
fi

# Derive short uuid from the session filename when possible.
SHORT_UUID=""
if [ -n "$SESSION_FILE" ]; then
  BASENAME="$(basename "$SESSION_FILE")"
  SHORT_UUID="$(printf '%s' "$BASENAME" | sed -n 's/^session-[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}-\([a-f0-9]\{1,16\}\)\.md/\1/p')"
fi
if [ -z "$SHORT_UUID" ]; then
  SHORT_UUID="$(
    (od -An -N4 -tx1 /dev/urandom 2>/dev/null | tr -d ' \n') \
    || printf '%04x%04x' "${RANDOM:-0}" "${RANDOM:-0}"
  )"
  SHORT_UUID="${SHORT_UUID:0:8}"
fi

# --- Locate the transcript ---------------------------------------------------
# Claude Code exposes the current transcript path via $CLAUDE_TRANSCRIPT_PATH
# in recent builds. We check that first, then a few documented fallbacks.
TRANSCRIPT_SRC=""
for candidate in \
  "${CLAUDE_TRANSCRIPT_PATH:-}" \
  "${CLAUDE_PROJECT_DIR:-}/.claude/transcript.jsonl" \
  "$ROOT/.claude/transcript.jsonl"; do
  if [ -n "$candidate" ] && [ -f "$candidate" ]; then
    TRANSCRIPT_SRC="$candidate"
    break
  fi
done

ARCHIVE_FILE="$TRANSCRIPT_DIR/${TODAY}-${SHORT_UUID}.md"

{
  printf -- '---\n'
  printf 'type: transcript\n'
  printf 'created: %s\n' "$TODAY"
  printf 'session_id: %s\n' "$SHORT_UUID"
  if [ -n "$SESSION_FILE" ]; then
    printf 'session_file: %s\n' "$SESSION_FILE"
  fi
  printf 'source: %s\n' "${TRANSCRIPT_SRC:-unavailable}"
  printf 'tags: [transcript, short-term]\n'
  printf -- '---\n\n'
  printf '# Transcript — %s (%s)\n\n' "$TODAY" "$SHORT_UUID"

  if [ -n "$TRANSCRIPT_SRC" ]; then
    printf '## Raw transcript\n\n'
    printf '```jsonl\n'
    # Cap at ~5MB to protect consolidation performance; head -c is portable.
    head -c 5242880 "$TRANSCRIPT_SRC" 2>/dev/null
    printf '\n```\n'
  else
    printf '_(No transcript path was exposed by Claude Code. Only the session file is available.)_\n\n'
    if [ -n "$SESSION_FILE" ] && [ -f "$SESSION_FILE" ]; then
      printf '## Session notes\n\n'
      cat "$SESSION_FILE" 2>/dev/null
    fi
  fi
} > "$ARCHIVE_FILE" 2>/dev/null

# --- Marker for consolidation ------------------------------------------------
MARKER="$SHORT_DIR/.new-material"
{
  date +%Y-%m-%dT%H:%M:%S%z
  printf 'archived=%s\n' "$ARCHIVE_FILE"
  [ -n "$SESSION_FILE" ] && printf 'session=%s\n' "$SESSION_FILE"
} >> "$MARKER" 2>/dev/null

# Clean up the current-session pointer so a new session starts fresh.
rm -f "$SHORT_DIR/.current-session" 2>/dev/null

exit 0
