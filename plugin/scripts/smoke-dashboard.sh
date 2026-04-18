#!/usr/bin/env bash
# Dashboard smoke test.
#
# 1. Installs a fresh AI-OS into a temp dir
# 2. Seeds it with representative content so every home-page panel has data
# 3. Starts `npm run dev` in the dashboard with AIOS_ROOT pointed at the temp brain
# 4. Fetches the main routes and checks for HTTP 200 + absence of error markers
# 5. Cleans up
#
# Exit 0 on success, non-zero on any failure.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PLUGIN_ROOT="$REPO_ROOT/plugin"
DASHBOARD_ROOT="$REPO_ROOT/dashboard"

BRAIN=$(mktemp -d -t aios-smoke-XXXXXX)
PORT=${PORT:-3456}
PID_FILE="$BRAIN/.dev.pid"
LOG_FILE="$BRAIN/.dev.log"

cleanup() {
  local code=$?
  if [[ -f "$PID_FILE" ]]; then
    kill -TERM "$(cat "$PID_FILE")" 2>/dev/null || true
    sleep 1
    kill -KILL "$(cat "$PID_FILE")" 2>/dev/null || true
  fi
  # Keep the log around on failure for triage
  if [[ $code -eq 0 ]]; then
    rm -rf "$BRAIN"
  else
    echo "smoke test failed; leaving $BRAIN for inspection" >&2
    echo "dev log tail:" >&2
    tail -n 40 "$LOG_FILE" 2>/dev/null >&2 || true
  fi
  exit $code
}
trap cleanup EXIT INT TERM

echo "[1/5] install fresh AI-OS into $BRAIN"
"$PLUGIN_ROOT/scripts/install.sh" \
  --target "$BRAIN" \
  --name "Smoke Test" \
  --role "QA" \
  --company "SmokeCo" \
  --goals "Verify dashboard;Land clean render" \
  --integrations "gmail,gcal" \
  --language "English" \
  --tone "sophisticated" \
  >/dev/null

echo "[2/5] seed representative content"
# Active Context section in MEMORY.md
python3 - "$BRAIN/MEMORY.md" <<'PYEOF'
import sys, pathlib
p = pathlib.Path(sys.argv[1])
text = p.read_text()
# Insert a body under the first "## Active Context" heading if empty
import re
def add_under(heading, body, text):
    pattern = re.compile(rf"(## {re.escape(heading)}\n)(.*?)(?=\n## |\Z)", re.S)
    def repl(m):
        existing = m.group(2).strip()
        if existing:
            return m.group(0)
        return m.group(1) + "\n" + body.strip() + "\n\n"
    return pattern.sub(repl, text, count=1)
text = add_under("Active Context",
    "- Dashboard smoke test in progress\n- Verifying read path against a scaffolded brain",
    text)
p.write_text(text)
PYEOF

# Three decisions
for i in 1 2 3; do
  cat > "$BRAIN/HIPPOCAMPUS/decisions/use-dashboard-for-smoke-${i}.md" <<MDEOF
---
type: decision
tags: [smoke, dashboard]
related: [[AI-OS]]
created: 2026-04-18
updated: 2026-04-18
status: active
---

# Use the dashboard for smoke ${i}

Quick verifiable claim that the brain has decisions to show.
MDEOF
done

# A pattern
cat >> "$BRAIN/CEREBELLUM/patterns.md" <<'MDEOF'

### Render first, decide second
**When**: Wiring a new read-only view over existing data.
**Do**: Render with whatever parses cleanly; flag gaps, do not invent.
**Why**: Smoke tests catch parser bugs that unit tests miss.
**Source**: Dashboard smoke v0.
MDEOF

# A short-term session file
cat > "$BRAIN/HIPPOCAMPUS/short-term/session-2026-04-18-smoke.md" <<'MDEOF'
---
type: session
created: 2026-04-18
tags: [session, smoke]
status: active
---

# Smoke session
Dashboard under test.
MDEOF

# A person entity
cat > "$BRAIN/SENSORY-CORTEX/people/jane-smoke.md" <<'MDEOF'
---
type: person
tags: [smoke]
related: [[SmokeCo]]
created: 2026-04-18
updated: 2026-04-18
status: active
---

# Jane Smoke

QA lead for dashboard verification.
MDEOF

echo "[3/5] start dashboard in dev mode (port $PORT)"
cd "$DASHBOARD_ROOT"
AIOS_ROOT="$BRAIN" PORT=$PORT npx next dev -p $PORT >"$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"

# Wait up to 30s for the server to answer
echo -n "  waiting for readiness"
for i in $(seq 1 30); do
  if curl -sf -o /dev/null "http://localhost:$PORT/"; then
    echo " ready after ${i}s"
    break
  fi
  echo -n "."
  sleep 1
  if [[ $i -eq 30 ]]; then
    echo " TIMEOUT"
    exit 1
  fi
done

echo "[4/5] fetch routes and verify"
check_route() {
  local path="$1"
  local must_contain="${2:-}"
  local status
  local body
  status=$(curl -s -o /tmp/smoke-body -w "%{http_code}" "http://localhost:$PORT$path")
  body=$(cat /tmp/smoke-body)
  if [[ "$status" != "200" ]]; then
    echo "  FAIL $path -> HTTP $status" >&2
    return 1
  fi
  # Quick red-flag scan: Next.js error overlay and server-side exceptions
  if grep -qE "Application error|__NEXT_ERROR|Error: |\"error\":" <<<"$body"; then
    echo "  FAIL $path -> error markers in HTML" >&2
    return 1
  fi
  if [[ -n "$must_contain" ]] && ! grep -q "$must_contain" <<<"$body"; then
    echo "  FAIL $path -> expected content \"$must_contain\" not found" >&2
    return 1
  fi
  echo "  OK   $path (${#body} bytes)"
}

check_route "/" "AI-OS"
check_route "/memory" "Active Context"
check_route "/r/HIPPOCAMPUS" "HIPPOCAMPUS"
check_route "/r/SENSORY-CORTEX" "SENSORY-CORTEX"
check_route "/search"

echo "[5/5] all routes passed"
