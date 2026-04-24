#!/usr/bin/env bash
# AI-OS — UserPromptSubmit hook (the Signal)
# Lightweight keyword routing: reads the user's prompt from stdin/env and
# prints a single-line THALAMUS hint to stdout that is injected into Claude's
# context. Suggests which brain regions to activate for the prompt.
#
# Contract: must be very fast (< 30ms) and always exit 0.

set +e
set -u

ROOT="${CLAUDE_PROJECT_DIR:-$PWD}"
# Only fire inside an actual AI-OS brain. Guards on both CLAUDE.md AND memory/
# so the plugin stays inert in unrelated repos that happen to have a CLAUDE.md.
if [ ! -f "$ROOT/CLAUDE.md" ] || [ ! -d "$ROOT/memory" ]; then
  exit 0
fi

# --- Get the prompt ----------------------------------------------------------
# Claude Code sends a JSON envelope on stdin. We accept either JSON or raw
# text, extract the prompt, and lowercase it.
PAYLOAD="$(head -c 65536 2>/dev/null)"
[ -z "$PAYLOAD" ] && PAYLOAD="${CLAUDE_USER_PROMPT:-}"

PROMPT=""
if command -v python3 >/dev/null 2>&1 && printf '%s' "$PAYLOAD" | head -c 1 | grep -q '{'; then
  export AIOS_PAYLOAD="$PAYLOAD"
  PROMPT="$(
    python3 - <<'PY' 2>/dev/null
import json, os
raw = os.environ.get("AIOS_PAYLOAD", "")
try:
    evt = json.loads(raw)
    p = evt.get("prompt") or evt.get("user_prompt") or evt.get("message") or ""
    print(p)
except Exception:
    print(raw)
PY
  )"
  unset AIOS_PAYLOAD
else
  PROMPT="$PAYLOAD"
fi

# Normalize.
LC="$(printf '%s' "$PROMPT" | tr '[:upper:]' '[:lower:]')"
[ -z "$LC" ] && exit 0

# --- Keyword routing ---------------------------------------------------------
# Each category maps to a set of brain regions to activate.
CATEGORIES=""
REGIONS=""

add_cat() {
  case "$CATEGORIES" in
    *"$1"*) : ;;
    *)
      if [ -z "$CATEGORIES" ]; then CATEGORIES="$1"; else CATEGORIES="$CATEGORIES,$1"; fi
      ;;
  esac
}

add_region() {
  case "$REGIONS" in
    *"$1"*) : ;;
    *)
      if [ -z "$REGIONS" ]; then REGIONS="$1"; else REGIONS="$REGIONS, $1"; fi
      ;;
  esac
}

# STRATEGY / DECISIONS
case "$LC" in
  *decision*|*decide*|*should\ i*|*strategy*|*strategic*|*trade-off*|*tradeoff*|*priorit*|*roadmap*)
    add_cat "STRATEGY"
    add_region "MEMORY.md"
    add_region "system/context/goals-metrics.md"
    add_region "memory/decisions/"
    ;;
esac

# MEMORY / RECALL
case "$LC" in
  *remember*|*recall*|*brain*|*memory*|*last\ time*|*previously*|*we\ discussed*|*what\ did*)
    add_cat "MEMORY"
    add_region "MEMORY.md"
    add_region "memory/"
    ;;
esac

# PEOPLE / RELATIONSHIPS
case "$LC" in
  *meeting*|*intro*|*contact*|*reach\ out*|*follow\ up*|*follow-up*|*relationship*|*investor*|*partner*|*client*)
    add_cat "PEOPLE"
    add_region "knowledge/people/"
    add_region "knowledge/companies/"
    ;;
esac

# PROJECT / EXECUTION
case "$LC" in
  *project*|*ship*|*build*|*implement*|*deploy*|*release*|*feature*|*sprint*|*task*)
    add_cat "PROJECT"
    add_region "projects/"
    add_region "blueprints/"
    ;;
esac

# WRITING / BRAND
case "$LC" in
  *post*|*linkedin*|*email*|*draft*|*copy*|*write*|*carousel*|*brand*|*voice*|*tone*)
    add_cat "WRITING"
    add_region "voice/brand-guidelines.md"
    add_region "blueprints/"
    ;;
esac

# SYSTEM / META
case "$LC" in
  *system*|*architecture*|*hook*|*skill*|*consolidation*|*ai-os*|*brain\ model*|*meta*)
    add_cat "SYSTEM"
    add_region "system/architecture.md"
    add_region "learning/patterns.md"
    ;;
esac

# LEARNING / CORRECTION
case "$LC" in
  *wrong*|*mistake*|*fix*|*correct*|*learn*|*pattern*|*feedback*)
    add_cat "LEARNING"
    add_region "learning/corrections.md"
    add_region "learning/patterns.md"
    ;;
esac

# RISK / CAUTION
case "$LC" in
  *risk*|*careful*|*sensitive*|*send\ to*|*before\ i*|*approve*|*publish*)
    add_cat "RISK"
    add_region "risks.md"
    ;;
esac

# Default if nothing matched — stay silent rather than add noise.
[ -z "$CATEGORIES" ] && exit 0

printf 'THALAMUS [%s]: Activate: %s\n' "$CATEGORIES" "$REGIONS"
exit 0
