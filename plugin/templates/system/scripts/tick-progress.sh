#!/usr/bin/env bash
# tick-progress.sh — flip a setup-progress.md checklist item from [ ] to [x]
#
# Usage:
#   tick-progress.sh <category> <item-substring> [skill-name]
#
# Examples:
#   tick-progress.sh "Identity" "User profile created" aios-start
#   tick-progress.sh "Integrations" "Gmail" forge-skill
#   tick-progress.sh "First-use validation" "/reflect cycle" reflect
#
# Behavior:
#   - Locates first unticked line matching <item-substring> under H2 == <category>.
#   - Flips `- [ ]` to `- [x]` and appends ` — <skill-name>, YYYY-MM-DD`.
#   - Recomputes overall_pct in frontmatter.
#   - Updates `updated:` field in frontmatter.
#   - Idempotent — if item already ticked, exits 0 silently.
#   - Never fails — silently exits 0 on any error so it can't break a skill flow.
#
# Resolves the brain root via $CLAUDE_PROJECT_DIR, falling back to $PWD.

set +e
set -u

CATEGORY="${1:-}"
ITEM_SUBSTR="${2:-}"
SKILL_NAME="${3:-skill}"

if [ -z "$CATEGORY" ] || [ -z "$ITEM_SUBSTR" ]; then
  printf 'tick-progress: missing args (category, item-substring required)\n' >&2
  exit 0
fi

ROOT="${CLAUDE_PROJECT_DIR:-$PWD}"
PROGRESS_FILE="$ROOT/system/setup-progress.md"

if [ ! -f "$PROGRESS_FILE" ]; then
  exit 0
fi

TODAY="$(date +%Y-%m-%d)"

python3 - "$PROGRESS_FILE" "$CATEGORY" "$ITEM_SUBSTR" "$SKILL_NAME" "$TODAY" <<'PY' 2>/dev/null
import re, sys, pathlib

path, category, substr, skill, today = sys.argv[1:6]
p = pathlib.Path(path)
text = p.read_text()

lines = text.splitlines()
out = []
in_target = False
ticked = False

# Find the H2 == category, then within that section, find first matching unticked item.
for i, line in enumerate(lines):
    if line.startswith("## "):
        header = line[3:].strip()
        in_target = (header.casefold() == category.casefold())
    if not ticked and in_target and line.startswith("- [ ] ") and substr.casefold() in line.casefold():
        # Flip to ticked + append metadata.
        suffix = f" — {skill}, {today}"
        # Don't double-append if somehow already there.
        if suffix not in line:
            line = "- [x] " + line[len("- [ ] "):] + suffix
        else:
            line = "- [x] " + line[len("- [ ] "):]
        ticked = True
    out.append(line)

if not ticked:
    # Nothing to do (already ticked, or item not found). Exit clean.
    sys.exit(0)

new_text = "\n".join(out)
if text.endswith("\n") and not new_text.endswith("\n"):
    new_text += "\n"

# Recompute overall_pct: count [x] vs [ ] across the whole file body (excluding frontmatter).
fm_match = re.match(r"^---\n.*?\n---\n", new_text, re.DOTALL)
body = new_text[fm_match.end():] if fm_match else new_text
total = len(re.findall(r"^- \[[ x]\] ", body, re.MULTILINE))
done = len(re.findall(r"^- \[x\] ", body, re.MULTILINE))
pct = round(100 * done / total) if total else 0

# Update frontmatter pct + updated date.
def replace_field(text, field, value):
    pattern = re.compile(rf"^{field}: .*$", re.MULTILINE)
    if pattern.search(text):
        return pattern.sub(f"{field}: {value}", text, count=1)
    return text

new_text = replace_field(new_text, "overall_pct", str(pct))
new_text = replace_field(new_text, "updated", today)

# Update the human-readable status line near the top.
status_pattern = re.compile(r"^\*\*Status: \d+% complete \(\d+ / \d+ steps\)\*\*$", re.MULTILINE)
new_text = status_pattern.sub(f"**Status: {pct}% complete ({done} / {total} steps)**", new_text, count=1)

p.write_text(new_text)
PY

exit 0
