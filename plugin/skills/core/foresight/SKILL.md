---
name: foresight
description: Forward-looking strategic planning — ranked priorities for the week (or window) ahead, grounded in goals, decisions, patterns, and whatever calendar or pipeline signals exist. Use when planning the week, when the user feels scattered about what to do next, when a reflection has surfaced a course correction, or at the start of a new window (Monday, first of the month, start of a quarter). Produces 3–7 ranked priorities with rationale, expected cost, and a single flag for what to drop.
---

# Foresight

Turn everything the brain already knows into a short, ranked list of what matters next. The goal is not a to-do list — it is a deliberate allocation of the user's next window of attention, with explicit trade-offs named.

The AI-OS root is at `~/Desktop/AI-OS/` by default. If the user has configured a different root (check the plugin config or a root-level `CLAUDE.md` marker), use that path instead. All paths below are relative to the brain root unless noted.

## When to use

Invoke this skill whenever any of the following apply:

- The user asks to plan the week, the month, or the quarter
- The user reports feeling scattered about what to do next
- A `reflect` session has surfaced a course correction and the user needs a landing plan
- A new planning window is starting (Monday, first of the month, start of a quarter)
- A launch, deadline, or milestone is approaching and the user wants to sequence the runway
- Calendar is dense and the user needs to see which commitments actually serve the goals

Do not invoke for a single-task decision ("should I do X or Y?") — that belongs in `decision-check`. Foresight is for ranking, not deciding one thing.

## Inputs

The caller may provide:

- **Window** — `week` (default), `month`, `quarter`, or a custom span
- **Capacity** — `normal` (default), `light` (the user has less time than usual), or `sprint` (heavier than usual)
- **Anchor** — a specific commitment or deadline the plan must serve
- **Focus** — an area to prioritize (e.g., sales, product, health). If set, other areas are de-prioritized, not ignored.

If the user does not supply a window, ask one short clarifying question. A weekly plan and a quarterly plan are different deliverables.

## Process

### 1. Load the context

Read in this order:

1. `META-COGNITION/context/goals-metrics.md` — current goals and metrics. This is the anchor. If missing or stale (>30 days since `updated`), flag that the foresight will be informed by out-of-date goals.
2. `MEMORY.md` — the `## Active Context` section for what the user considers live.
3. `HIPPOCAMPUS/decisions/` — recent decisions (last 14 days for a weekly window, 30 for monthly, 90 for quarterly). Note decisions that imply upcoming work.
4. `CEREBELLUM/patterns.md` — active patterns, especially any related to capacity, energy, or scheduling.
5. `MOTOR-CORTEX/` — active project folders. For each, check the most recent file and note what the obvious next step is.
6. Calendar context if available (via Gmail/GCal MCP) — meetings, time blocks, travel. If the MCP is not connected, proceed without and note the gap.
7. `HIPPOCAMPUS/short-term/` — the last 2–3 session files for signals the user did not explicitly add to goals.

Do not fail if an optional input is missing. State which sources informed the foresight and which were absent.

### 2. Inventory the demand

From the loaded context, list every candidate priority as a compact line. Do not rank yet. Include:

- Work implied by active goals
- Work implied by recent decisions (a decision often implies an action)
- Work implied by calendar (meetings that need prep, deadlines that need work)
- Work implied by stalled projects (a project is a candidate if it has gone quiet past its usual cadence)
- Health, rest, and buffer time as candidates — not just work

A typical inventory is 10–25 candidates. If it is fewer than 7, you are under-reading the brain. If it is more than 30, you are capturing noise — tighten.

### 3. Filter and rank

Rank candidates by the following lens, in this order:

1. **Anchored** — does a commitment or deadline force this? Anchored items lead the list. State the anchor explicitly ("required by the investor call on Thursday").
2. **Goal-advancing** — does this move a stated goal measurably? Vague goal contribution does not count. If you cannot name which goal and which metric, it is not goal-advancing.
3. **Compounding** — does doing this now unlock or accelerate future work? Pattern-level items (systems, documentation, infrastructure) often compound.
4. **Decay risk** — does waiting make this materially harder or more expensive? Relationship nudges, time-sensitive opportunities, perishable context.
5. **Energy fit** — given the capacity (`light` / `normal` / `sprint`) and the user's known patterns, is this realistic this window?

Apply these in order. An anchored, goal-advancing, compounding, decay-risk item is the top priority. Items that hit only `energy fit` are filler — drop them unless nothing else fills the window.

### 4. Produce the ranked list

Output 3–7 priorities. Fewer if the window is a week and capacity is light. More if it is a quarter. Each priority is one block:

- **Priority** — one line, verb-first, specific enough to execute without re-planning
- **Why it's ranked here** — one sentence citing which lens (anchored / goal-advancing / compounding / decay-risk / energy-fit)
- **Expected cost** — time estimate + any tradeoff ("6 hours, displaces deep work on pricing")
- **Signal of progress** — how the user will know by end of window whether this moved ("pricing doc v2 in Notion" not "worked on pricing")
- **Risk if skipped** — one sentence — what breaks, slips, or worsens if the user does not do this. If nothing, the item should not be on the list.

Be concrete. "Follow up with leads" is not useful. "Reply to Georgia and Kaveh — both waiting >5 days, decay risk high" is useful.

### 5. The single drop

Every foresight ends with one explicit drop: something the user is currently treating as a priority but that should not be on this window's list. Name it directly, state the reason, and state what happens to it (deferred to next window, removed entirely, handed to someone else).

If the user genuinely has no candidate to drop, say so — but this is rare. Solo operators almost always have something that has graduated from "priority" to "inertia" without being acknowledged.

### 6. Output format

Use this structure, in this order:

```
# Foresight — <window>

## Window + capacity
<one-line summary of window, capacity, anchor if any, and sources that informed this>

## Demand inventory
<compact bulleted list of candidates considered, one per line>

## Ranked priorities
<3-7 blocks from step 4>

## Drop
<one block from step 5>

## Notes
<anything the user should know but that isn't itself a priority — e.g., pending dependencies, gaps in the inputs, assumptions made>
```

### 7. Tone and length

Keep the foresight tight. A foresight that does not fit on one screen has too much. Solo operators under-execute more often because of list length than because of weak items. Prefer 5 priorities at the right specificity over 8 vague ones.

Do not pad with motivational language. The priorities are the output.

### 8. Cross-check against patterns

Before finalizing, scan `CEREBELLUM/patterns.md` one last time with the draft plan in view. If a learned pattern warns against something in the plan (e.g., "scheduling deep work after 3pm never lands"), either remove the offender or flag it explicitly with an acknowledgement. Do not silently ignore patterns — that is how patterns become stale.

## Logging

After producing the foresight, offer to save it as a dated note in `HIPPOCAMPUS/short-term/` with the filename pattern `foresight-YYYY-MM-DD-<window>.md`. Do not save without the user confirming.

If the user confirms, write the note with frontmatter:

```yaml
---
type: foresight
window: <window used>
capacity: <capacity used>
created: YYYY-MM-DD
tags: [foresight, planning]
---
```

A saved foresight feeds the next `reflect` cycle — the user can measure what actually happened against what was planned.

## What to avoid

- Do not produce more than 7 priorities. Longer lists are not plans; they are inventories.
- Do not use generic verbs ("work on", "think about", "look into"). The priority must be executable as stated.
- Do not rank anything goal-advancing without naming the specific goal.
- Do not rely on the user's stated preferences when patterns contradict them. If patterns say deep work does not land after 3pm and the user insists on Thursday-afternoon deep work, flag the conflict.
- Do not include "drop" as a soft suggestion. Name one thing explicitly.
- Do not skip the capacity question on the first run of a window. A misjudged capacity produces a plan that reads well and collapses by Wednesday.
- Do not invent calendar commitments you cannot see. If the GCal MCP is not connected, state that the calendar is a gap.

## Integration with other skills

- If `reflect` produced course corrections, feed them directly into step 3 as candidate priorities.
- If the plan reveals contradictions between goals and active decisions, hand off to `decision-check` before finalizing.
- If any priority is a stalled project, pair with `project-status` to confirm the next concrete step before the user commits.
- If the plan surfaces a repeated pattern (e.g., Mondays are overbooked for three weeks running), suggest persisting it to `CEREBELLUM/patterns.md` via consolidation — do not edit `patterns.md` yourself.
