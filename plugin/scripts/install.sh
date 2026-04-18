#!/usr/bin/env bash
# AI-OS non-interactive installer.
#
# Mirrors what /aios-init does conversationally, but driven by flags.
# Useful for: CI, automated testing, headless installs, or users who
# prefer to run the install in one shot instead of answering prompts.
#
# Usage:
#   install.sh --target <dir> [--name NAME] [--role ROLE] [--company CO]
#              [--goals "g1;g2;g3"] [--integrations "gmail,gcal"]
#              [--pillars "p1;p2"] [--language en] [--tone sophisticated]
#              [--force] [--no-git] [--with-demo-data]
#
# --force            Overwrite an existing AI-OS (normally refused)
# --no-git           Skip git init and initial commit
# --with-demo-data   Seed the new brain with realistic example content
#                    (decisions, people, a project, patterns). Great for demos.

set -euo pipefail

# --- resolve plugin root (two levels up from this script) ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# --- defaults ---
TARGET=""
USER_NAME=""
USER_ROLE=""
USER_COMPANY=""
USER_GOALS=""
USER_INTEGRATIONS=""
USER_PILLARS=""
USER_LANGUAGE="English"
USER_TONE="sophisticated"
USER_USE_CASE="solo founder"
FORCE=0
DO_GIT=1
WITH_DEMO=0

# --- parse args ---
while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)        TARGET="$2"; shift 2 ;;
    --name)          USER_NAME="$2"; shift 2 ;;
    --role)          USER_ROLE="$2"; shift 2 ;;
    --company)       USER_COMPANY="$2"; shift 2 ;;
    --goals)         USER_GOALS="$2"; shift 2 ;;
    --integrations)  USER_INTEGRATIONS="$2"; shift 2 ;;
    --pillars)       USER_PILLARS="$2"; shift 2 ;;
    --language)      USER_LANGUAGE="$2"; shift 2 ;;
    --tone)          USER_TONE="$2"; shift 2 ;;
    --use-case)      USER_USE_CASE="$2"; shift 2 ;;
    --force)         FORCE=1; shift ;;
    --no-git)        DO_GIT=0; shift ;;
    --with-demo-data) WITH_DEMO=1; shift ;;
    -h|--help)
      sed -n '2,14p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *) echo "unknown flag: $1" >&2; exit 2 ;;
  esac
done

[[ -z "$TARGET" ]] && { echo "error: --target is required" >&2; exit 2; }

TARGET="$(cd "$(dirname "$TARGET")" && pwd)/$(basename "$TARGET")"
mkdir -p "$TARGET"

# --- refuse if already scaffolded ---
if [[ -f "$TARGET/CLAUDE.md" && $FORCE -eq 0 ]]; then
  echo "error: $TARGET already looks like an AI-OS (CLAUDE.md exists)." >&2
  echo "       re-run with --force to overwrite, or pick a different --target." >&2
  exit 1
fi

TODAY="$(date -u +%Y-%m-%d)"

# --- token substitution ---
# Render any {{user.name}} / {{user.role}} / etc. + {{today}} placeholders.
# Uses a safe sed approach, escaping user-supplied strings.
sed_escape() {
  # Escape &, \, and the delimiter / used below. BSD + GNU sed compatible.
  # User inputs are single-line by contract; no newline handling needed.
  printf '%s' "$1" | sed -e 's/[&\/\\]/\\&/g'
}

render_file() {
  local src="$1"
  local dst="$2"
  local n r c g i pi l t today uc
  n="$(sed_escape "$USER_NAME")"
  r="$(sed_escape "$USER_ROLE")"
  c="$(sed_escape "$USER_COMPANY")"
  g="$(sed_escape "$USER_GOALS")"
  i="$(sed_escape "$USER_INTEGRATIONS")"
  pi="$(sed_escape "$USER_PILLARS")"
  l="$(sed_escape "$USER_LANGUAGE")"
  t="$(sed_escape "$USER_TONE")"
  today="$(sed_escape "$TODAY")"
  uc="$(sed_escape "$USER_USE_CASE")"
  sed \
    -e "s/{{user\\.name}}/$n/g" \
    -e "s/{{user\\.role}}/$r/g" \
    -e "s/{{user\\.company}}/$c/g" \
    -e "s/{{user\\.goals}}/$g/g" \
    -e "s/{{user\\.integrations}}/$i/g" \
    -e "s/{{user\\.pillars}}/$pi/g" \
    -e "s/{{user\\.language}}/$l/g" \
    -e "s/{{user\\.tone}}/$t/g" \
    -e "s/{{user\\.use_case}}/$uc/g" \
    -e "s/{{today}}/$today/g" \
    "$src" > "$dst"
}

# --- copy templates ---
echo "scaffolding brain templates into $TARGET"
while IFS= read -r -d '' src; do
  rel="${src#$PLUGIN_ROOT/templates/}"
  # Skip .gitkeep marker files after ensuring parent dirs exist
  if [[ "$(basename "$src")" == ".gitkeep" ]]; then
    mkdir -p "$TARGET/$(dirname "$rel")"
    continue
  fi
  dst="$TARGET/$rel"
  # Strip the .tmpl suffix on the destination side
  if [[ "$dst" == *.tmpl ]]; then
    dst="${dst%.tmpl}"
  fi
  mkdir -p "$(dirname "$dst")"
  render_file "$src" "$dst"
done < <(find "$PLUGIN_ROOT/templates" -type f -print0)

# --- copy skills ---
echo "installing skills"
mkdir -p "$TARGET/.claude/skills"
cp -R "$PLUGIN_ROOT/skills/aios-init" "$TARGET/.claude/skills/"
# Core skills are always installed
cp -R "$PLUGIN_ROOT/skills/core" "$TARGET/.claude/skills/"

# Optional skills are only installed if their required integrations were selected
# (gating based on --integrations list). The manifest of required integrations
# per skill lives in marketplace.json under plannedSkills[].requires.
install_optional() {
  local name="$1"
  local required="$2" # space-separated list like "gmail gcal"
  [[ ! -d "$PLUGIN_ROOT/skills/optional/$name" ]] && return 0
  # Lowercase via tr for bash 3.2 compatibility (macOS default)
  local ints_lc
  ints_lc=$(printf '%s' "$USER_INTEGRATIONS" | tr '[:upper:]' '[:lower:]')
  for req in $required; do
    if ! [[ ",${ints_lc}," == *",$req,"* ]]; then
      return 0
    fi
  done
  cp -R "$PLUGIN_ROOT/skills/optional/$name" "$TARGET/.claude/skills/"
  echo "  opt-in: $name (requires: $required)"
}
# Register as optional skills are added:
install_optional "morning-briefing" "gmail gcal"
install_optional "email-triage" "gmail"
install_optional "meeting-prep" "gcal"
install_optional "relationship-check" ""
install_optional "brain-dump-content" ""
install_optional "content-interview" ""

# --- copy hooks ---
echo "installing hooks"
mkdir -p "$TARGET/.claude/hooks"
cp "$PLUGIN_ROOT/hooks/"*.sh "$TARGET/.claude/hooks/"
chmod +x "$TARGET/.claude/hooks/"*.sh

# --- settings.json ---
if [[ -f "$TARGET/.claude/settings.json" ]]; then
  echo "merging with existing .claude/settings.json"
  python3 - "$TARGET/.claude/settings.json" "$PLUGIN_ROOT/settings.template.json" <<'PYEOF'
import json, sys
existing_path, new_path = sys.argv[1], sys.argv[2]
with open(existing_path) as f: existing = json.load(f)
with open(new_path) as f: new = json.load(f)
existing.setdefault("hooks", {})
for event, arr in new.get("hooks", {}).items():
    existing["hooks"].setdefault(event, [])
    # append any hook entries that don't already appear
    existing_cmds = {
        h.get("command")
        for block in existing["hooks"][event]
        for h in block.get("hooks", [])
    }
    for block in arr:
        for h in block.get("hooks", []):
            if h.get("command") not in existing_cmds:
                existing["hooks"][event].append(block)
                break
with open(existing_path, "w") as f:
    json.dump(existing, f, indent=2)
PYEOF
else
  cp "$PLUGIN_ROOT/settings.template.json" "$TARGET/.claude/settings.json"
fi

# --- aios.config.json — the runtime marker ---
cat > "$TARGET/aios.config.json" <<JSONEOF
{
  "version": "0.1.0",
  "installedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "user": {
    "name": $(printf '%s' "$USER_NAME" | python3 -c "import json,sys; print(json.dumps(sys.stdin.read()))"),
    "role": $(printf '%s' "$USER_ROLE" | python3 -c "import json,sys; print(json.dumps(sys.stdin.read()))"),
    "company": $(printf '%s' "$USER_COMPANY" | python3 -c "import json,sys; print(json.dumps(sys.stdin.read()))"),
    "language": $(printf '%s' "$USER_LANGUAGE" | python3 -c "import json,sys; print(json.dumps(sys.stdin.read()))"),
    "tone": $(printf '%s' "$USER_TONE" | python3 -c "import json,sys; print(json.dumps(sys.stdin.read()))")
  },
  "integrations": $(printf '%s' "$USER_INTEGRATIONS" | python3 -c "import json,sys; v=sys.stdin.read().strip(); print(json.dumps([x.strip() for x in v.split(',') if x.strip()]))")
}
JSONEOF

# --- demo data seed (optional) ---
if [[ $WITH_DEMO -eq 1 && -d "$PLUGIN_ROOT/demo-data" ]]; then
  echo "seeding demo data"
  DEMO="$PLUGIN_ROOT/demo-data"

  # Copy tree structures: HIPPOCAMPUS/decisions, HIPPOCAMPUS/short-term,
  # SENSORY-CORTEX/people, SENSORY-CORTEX/companies, MOTOR-CORTEX/*
  for sub in HIPPOCAMPUS/decisions HIPPOCAMPUS/short-term \
             SENSORY-CORTEX/people SENSORY-CORTEX/companies; do
    if [[ -d "$DEMO/$sub" ]]; then
      mkdir -p "$TARGET/$sub"
      cp "$DEMO/$sub"/*.md "$TARGET/$sub/" 2>/dev/null || true
    fi
  done

  # MOTOR-CORTEX projects (each is a subdir)
  if [[ -d "$DEMO/MOTOR-CORTEX" ]]; then
    for proj in "$DEMO/MOTOR-CORTEX"/*/; do
      [[ -d "$proj" ]] || continue
      projname=$(basename "$proj")
      mkdir -p "$TARGET/MOTOR-CORTEX/$projname"
      cp "$proj"*.md "$TARGET/MOTOR-CORTEX/$projname/" 2>/dev/null || true
    done
  fi

  # Append the Active Context body into the scaffolded MEMORY.md
  if [[ -f "$DEMO/MEMORY-active-context.md" ]]; then
    python3 - "$TARGET/MEMORY.md" "$DEMO/MEMORY-active-context.md" <<'PYEOF'
import sys, re, pathlib
mem_path = pathlib.Path(sys.argv[1])
body = pathlib.Path(sys.argv[2]).read_text().strip()
text = mem_path.read_text()
pattern = re.compile(r"(## Active Context\n)(.*?)(?=\n## |\Z)", re.S)
def repl(m):
    return m.group(1) + "\n" + body + "\n\n"
new = pattern.sub(repl, text, count=1)
mem_path.write_text(new)
PYEOF
  fi

  # Append pattern additions to CEREBELLUM/patterns.md
  if [[ -f "$DEMO/CEREBELLUM/patterns-additions.md" ]]; then
    cat "$DEMO/CEREBELLUM/patterns-additions.md" >> "$TARGET/CEREBELLUM/patterns.md"
  fi

  echo "  seeded 3 decisions, 2 people, 1 company, 1 project, 1 short-term, 2 patterns"
fi

# --- git init + first commit ---
if [[ $DO_GIT -eq 1 ]] && ! [[ -d "$TARGET/.git" ]]; then
  ( cd "$TARGET" && git init -b main >/dev/null && git add -A && \
    git -c user.name="AI-OS" -c user.email="init@aios.dev" commit -m "AI-OS initialized" >/dev/null )
  echo "git initialized with first commit"
fi

# --- welcome ---
cat <<MSG

AI-OS is live at: $TARGET

Try these next:
  - /brain-search      load context before starting work
  - /reflect           honest checkpoint on your goals
  - /foresight         ranked priorities for the week ahead

MSG
