---
type: reference
tags: [vital-signs, health, maintenance, self-monitoring]
created: 2026-04-18
updated: 2026-04-18
status: active
---

# AI-OS Vital Signs

_A 30-second health check at the start of every substantive session._
_If any signal is **Red**, run maintenance before any other work._

---

## The Three Checks

### 1. Short-Term Memory Load
**What:** Count files in `memory/short-term/` (exclude `README.md`, `consolidation-report-*.md`, and `dream-*.md`).

| Status | File count | Meaning | Action |
|---|---|---|---|
| Green | 0–4 | Normal | Continue |
| Yellow | 5–10 | Accumulating | Flag — consolidation may be falling behind |
| Red | 11+ | Overloaded | Run consolidation before other work |

### 2. Consolidation Freshness
**What:** Check the date of the most recent `consolidation-report-*.md` in `memory/short-term/`.

| Status | Days since last | Meaning | Action |
|---|---|---|---|
| Green | 0–1 | Fresh | Continue |
| Yellow | 2–4 | Stale | Check nightly trigger; run consolidation when time allows |
| Red | 5+ | Stalled | Run consolidation before other work |

### 3. Unextracted Corrections
**What:** Count entries in `learning/corrections.md` that do **not** end with the `[extracted]` tag.

| Status | Count | Meaning | Action |
|---|---|---|---|
| Green | 0–2 | Normal | Continue |
| Yellow | 3–4 | Threshold approaching | Extract patterns when time allows |
| Red | 5+ | Learning backlog | Extract patterns before other work |

---

## How to run the check

At session start (step 8 in the Session Protocol), scan quickly:

```
1. ls memory/short-term/    -> count session files (exclude reports, dreams, README)
2. Read most recent consolidation-report date
3. Scan learning/corrections.md -> count entries without [extracted]
```

Report format (append to the short-term memory file when relevant):

```
Vital signs: ST-memory [G/Y/R] (N files) | Consolidation [G/Y/R] (N days) | Corrections [G/Y/R] (N unextracted)
```

- All Green → continue without mentioning it.
- Any Yellow → note it in the session log, flag if it matters.
- Any Red → do maintenance first and explain what and why.

---

## Future expansion

If the three signals stop catching problems after ~30 days of use, consider adding:

- **MEMORY.md size** — too long to read every session?
- **Decision backlog** — decisions referenced but never filed?
- **Trigger health** — scheduled tasks actually running?
- **Orphan count** — files with no wiki-link connections?

Add new checks only when there is evidence they are needed, not speculatively.
