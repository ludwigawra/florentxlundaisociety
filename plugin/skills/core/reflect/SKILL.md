---
name: reflect
description: On-demand strategic reflection across goals, decisions, and learned patterns. Use when the user wants a goal-by-goal progress check, is feeling scattered, is deciding whether to change direction, or at natural checkpoints (end of week, end of month, end of quarter, after a setback). Produces a structured reflection with per-goal progress, patterns observed, and suggested course corrections.
---

# Reflect

Produce an honest, structured reflection on where the user actually stands versus where they intended to stand. The aim is not a recap — it is a re-calibration. Every reflection should leave the user with a sharper picture of what is working, what is not, and what to change.

All paths below are relative to the brain root — the directory containing CLAUDE.md. When invoked as a slash command inside Claude Code, the brain root is the current working directory.

## When to use

Invoke this skill whenever any of the following apply:

- The user explicitly asks to reflect, review, or take stock
- A natural checkpoint has arrived (end of week, end of month, end of quarter, after a launch or setback)
- The user reports feeling scattered, unsure, or off-track
- The user is considering a direction change and wants context on what prior thinking supports or undermines it
- Goals-metrics has not been reviewed in 14+ days
- A pattern in `learning/corrections.md` suggests something structural is off and it is worth pausing to look

Do not invoke for tactical check-ins or status updates — those belong in `project-status` or `foresight`. Reflect is broader, longer horizon, and more honest about what is not working.

## Inputs

The caller may provide:

- **Scope** — e.g. "this week", "this month", "since launch", "Q1" (default: last 30 days)
- **Focus** — a specific goal, project, or theme to reflect on (default: everything in goals-metrics)
- **Tone** — `honest` (default), `harsh`, or `gentle`. Harsh is the user asking you not to soften things. Gentle is the user already being hard on themselves and wanting perspective.

If the user does not supply scope or focus, ask a single clarifying question before starting — do not assume. A reflection on "this week" versus "this quarter" produces very different output.

## Process

### 1. Load the context

Read in this order and keep each in working memory:

1. `system/context/goals-metrics.md` — the user's stated goals, priorities, and metrics. This is the yardstick. If the file is missing or mostly empty, flag this first — reflection without explicit goals is guesswork.
2. `MEMORY.md` — the `## Active Context` section for what the user considers currently top of mind.
3. `memory/decisions/` — all decision files modified within the scope window. Read each file's claim and rationale.
4. `learning/corrections.md` — the full file. Look for corrections within the scope window.
5. `learning/patterns.md` — active patterns. These are the rules the system has already learned.
6. `memory/short-term/` — recent session files. Skim for themes, not details.
7. `projects/` — top-level project folders. Note which have recent activity and which have gone quiet.

If a folder is missing, note it and continue. Do not fail the reflection over a missing optional folder.

### 2. Check scope alignment

Before analyzing, confirm the scope you are using and list the inputs you found. One short block, for example:

> Reflecting on the last 30 days.
> Inputs: 4 goals in goals-metrics, 11 decisions, 3 corrections, 2 active patterns, 8 short-term files, 4 projects with recent activity.

If an input category is empty, say so explicitly. An empty decisions folder is a signal in itself.

### 3. Goal-by-goal progress

For each goal in `goals-metrics.md`, produce one compact block:

- **Goal** — restate the goal in one line
- **Evidence of progress** — cite specific decisions, files, or metrics that show movement
- **Evidence of drift** — anything that contradicts, delays, or dilutes progress
- **Verdict** — one of: `on-track`, `slipping`, `stalled`, `abandoned-quietly`, `surpassed`
- **Why** — one sentence explaining the verdict from the evidence, not from vibes

Be specific. "The pricing work is going well" is not useful. "The pricing work shipped two decisions (2026-03-28 tiered packaging, 2026-04-02 value-based anchor), with no revisions since — on-track" is useful.

`abandoned-quietly` is a critical verdict. Name it when you see it. Solo operators often abandon goals without declaring them abandoned, and a reflection that fails to name this pattern is a reflection that lets the drift continue.

### 4. Patterns observed

Look across the scope window for patterns the user may not have noticed:

- Decisions that cluster around one theme, suggesting an emerging priority
- Corrections that share a root cause, suggesting a structural fix is due
- Projects that consistently slip, suggesting scope or capacity issues
- Tools or skills that keep failing, suggesting a replacement is warranted
- Topics that appear in short-term memory repeatedly but never land in a decision — suggesting indecision
- Periods of high activity followed by silence — suggesting either a completion or a quiet abandonment

Each pattern should be named in one sentence with a citation of where you saw it. Do not invent patterns — if you cannot cite at least two instances, do not name it.

### 5. Contradictions

Check for direct contradictions between recent decisions and either:

- The stated goals in `goals-metrics.md`
- Prior decisions in `memory/decisions/`
- Active patterns in `learning/patterns.md`

Name contradictions plainly. The user does not need you to hedge. A contradiction is a signal — the goal may have changed, the decision may be wrong, or the pattern may be stale. Surface it and let the user choose.

### 6. Course corrections

From everything above, propose 1 to 3 course corrections. Not a backlog — the highest-leverage, smallest-scope adjustments the user could make in the next week to change the trajectory. For each:

- **What** — a specific action or decision, not a theme
- **Why** — the evidence that motivates it
- **Cost** — what the user gives up by taking this action (there is always a cost; naming it is honest)
- **Signal of success** — how the user will know in 7-14 days whether this worked

If nothing needs to change, say so explicitly. Unnecessary churn is worse than steady progress.

### 7. Output format

Use this structure, in this order:

```
# Reflection — <scope>

## Scope
<one-line scope + inputs summary>

## Goal progress
<one block per goal, as in step 3>

## Patterns observed
<bulleted list from step 4>

## Contradictions
<bulleted list from step 5, or "None identified">

## Course corrections
<1-3 blocks from step 6, or "No changes recommended">

## What went unsaid
<one short paragraph on anything the user is clearly avoiding or under-processing, or "Nothing flagged">
```

The `What went unsaid` section is the point. A reflection that only restates what is already visible is low-value. The reflection earns its place by naming the things the user knows but has not looked at.

### 8. Tone calibration

Apply the tone the user requested (or `honest` by default):

- **honest** — plain, specific, no softening. Do not hedge. Do not add encouragement that is not earned.
- **harsh** — the user is asking you to push. Lead with the hardest truth. Do not comfort.
- **gentle** — the user is already being hard on themselves. Acknowledge genuine progress first. Keep the hard truths, but frame them as signals to act on, not failures.

Never flatter. Flattery in a reflection is a small betrayal — the user came here for a real mirror.

## Logging

After producing the reflection, offer to save it as a dated note in `memory/short-term/` with the filename pattern `reflection-YYYY-MM-DD.md`. Do not save without the user confirming — reflections are private by default.

If the user confirms, write the note with frontmatter:

```yaml
---
type: reflection
scope: <scope used>
created: YYYY-MM-DD
tags: [reflection, meta-cognition]
---
```

The consolidation skill will later decide whether to extract patterns or decisions from the saved reflection.

## What to avoid

- Do not produce a generic motivational summary. The brain has too much specific context for generic output to be acceptable.
- Do not recap activity without a verdict. Activity without assessment is noise.
- Do not skip the `What went unsaid` section because it feels awkward. That is exactly when it is most valuable.
- Do not propose more than 3 course corrections. More is a backlog, not a reflection.
- Do not claim a pattern with fewer than two cited instances. Two is the minimum for a pattern; one is an anecdote.
- Do not mix tactical status ("project X is blocked by Y") with strategic reflection. If tactical questions surface, note them at the end and suggest running `project-status` separately.

## Integration with other skills

- If the reflection reveals a decision that contradicts a prior one, pair with `decision-check` to surface the prior context before the user resolves it.
- If the reflection reveals a direction for the next week, hand off to `foresight` for ranked priorities.
- If the reflection reveals a project that has gone quiet, hand off to `project-status` for a focused look.
- If the reflection reveals a pattern worth persisting, propose the user add it to `learning/patterns.md` using the standard pattern format. Do not edit `patterns.md` yourself — that is a consolidation-owned file.
