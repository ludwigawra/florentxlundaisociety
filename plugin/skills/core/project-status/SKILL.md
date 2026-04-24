---
name: project-status
description: Quick status check on any active project in projects — progress, blockers, days since activity, next concrete action. Use when the user asks about a specific project, when planning a week and needing to decide which projects deserve attention, when a project gets mentioned and you need current state before responding, or when a project has gone quiet and the user wants to know whether to revive, continue, or close it.
---

# Project Status

Produce an honest, compact status read on one project. The goal is a decision-grade snapshot — enough for the user to choose between continue, revive, close, or hand off. Not a status report for a stakeholder; a self-check for the operator.

All paths below are relative to the brain root — the directory containing CLAUDE.md. When invoked as a slash command inside Claude Code, the brain root is the current working directory. Projects live in `projects/{project-slug}/`, typically with their own `CLAUDE.md` and `MEMORY.md`.

## When to use

Invoke this skill whenever any of the following apply:

- The user names a specific project and wants state
- A `foresight` session ranks a project in the top priorities and the user needs to confirm the concrete next step before committing
- A project has gone quiet past its usual cadence and the user wants to decide whether to revive, continue, or close
- The user is preparing for a meeting or update where the project will be discussed
- The user is about to make a decision that depends on current project state
- A `reflect` session surfaced a stalled project as an `abandoned-quietly` candidate

Do not invoke for a cross-project overview — that belongs in `reflect` or `foresight`. Project-status is zoomed in on one.

## Inputs

The caller should provide:

- **Project** — the project slug or name (e.g., `MARKETING`, `steven-com`). Accept partial matches against `projects/*/` folder names.
- **Depth** — `snapshot` (default, one screen), `full` (read every file in the project folder), or `revive` (full + propose a revival plan if the project is stalled).

If multiple projects match a partial name, list the candidates and ask which one. If no project matches, list the closest matches and ask — do not guess.

## Process

### 1. Locate the project

Resolve the project path:

1. Look for `projects/{exact-match}/` first
2. Then case-insensitive partial match
3. Then fuzzy match against project names found in `projects/*/CLAUDE.md` or `MEMORY.md`

If zero matches, stop and ask. If multiple matches, stop and ask. Do not proceed with ambiguity.

### 2. Load the project context

In order of priority:

1. `projects/{project}/CLAUDE.md` — project-specific identity and protocol. This is the scope and tone.
2. `projects/{project}/MEMORY.md` — project-specific memory, current state.
3. All other files in `projects/{project}/` — sorted by modification time, newest first. In `snapshot` depth, read only the 5 most recently modified. In `full` or `revive`, read all.
4. `memory/decisions/` — any decision file whose frontmatter `related` field or body references this project.
5. `learning/corrections.md` and `learning/skill-feedback/` — any entries that mention the project.
6. `memory/short-term/` — recent session files that referenced the project.
7. Git log scoped to `projects/{project}/` — activity rhythm over the last 60 days.

Note what is missing. A project folder without a `CLAUDE.md` or without a `MEMORY.md` is a signal — either the project was never properly initialized, or the user abandoned structure along the way. State this plainly.

### 3. Compute the cadence

From git log and file modification times, determine:

- **Last activity** — most recent modification to any file in the project folder
- **Typical cadence** — median gap between activity clusters over the last 60 days (a cluster is a burst of activity within 48 hours)
- **Days since last activity** — compared to typical cadence, is the project on-rhythm, slowing, or silent?

If there is not enough history to compute a cadence (less than 3 activity clusters), say so. Do not report confident cadence from a tiny sample.

### 4. Extract the essentials

From the loaded context, extract:

- **What the project is** — one sentence from `CLAUDE.md` or `MEMORY.md`, not a paraphrase
- **Stated goal or outcome** — the north star for this project, if one exists
- **Current state** — what has been done, what is open, what is blocked. Derive from `MEMORY.md` and recent files, not vibes.
- **Open commitments** — anything the user or someone else has promised, especially if a date is attached
- **Blockers** — anything explicitly labeled blocked, or obviously stalled (waiting on X, can't progress until Y)
- **Next concrete action** — the single most specific next step. If the file does not name one, derive the smallest plausible next action and flag that you derived it.

Be strict about specificity. "Continue working on the design" is not a next action. "Send v2 of the landing hero to the designer by Friday for review" is.

### 5. Classify the state

Assign exactly one state label:

- **active** — on cadence, forward motion, next action is specific
- **stalled** — past typical cadence, no blocker named, no obvious next step. This is the most common "silent" failure mode for solo operators.
- **blocked** — past cadence with a named blocker outside the user's control (waiting on reply, approval, payment, tool access)
- **deprioritized** — the user explicitly moved this project down. Confirm by checking `goals-metrics.md` and recent decisions.
- **done** — the project achieved its stated outcome or was formally closed
- **abandoned-quietly** — no activity, no closure, no deprioritization. Past 2x typical cadence.

Name the state. Do not hedge. A project with no activity in 45 days and no closure is abandoned-quietly even if the user has not admitted it — naming it is the point.

### 6. Produce the output

Use this structure:

```
# {project} — {state}

## One line
<what the project is, from the source>

## Goal
<stated outcome or "no goal stated in project files">

## Cadence
<last activity date, days since, typical cadence, on-rhythm/slowing/silent>

## State
<current state in 2-4 lines — what's done, what's open, what's blocked>

## Open commitments
<bullets with date attached where possible, or "none tracked">

## Blockers
<bullets, or "none">

## Next concrete action
<one specific action. If derived rather than sourced, prefix with "[derived]">

## Recommendation
<one of: continue / revive / close / hand-off / wait. One sentence justifying.>
```

For `snapshot` depth, keep the full output under ~40 lines. For `full`, extend the state section and add a "Files reviewed" appendix. For `revive`, add a "Revival plan" section with a 5–10 day sequence to re-establish cadence.

### 7. Recommendation logic

Be specific about the recommendation:

- **continue** — state is `active`, cadence is on-rhythm, next action is clear. Recommend continuing as-is.
- **revive** — state is `stalled` or `abandoned-quietly` but the project still aligns with stated goals. Propose a small, concrete re-entry action — not a full restart.
- **close** — state is `stalled` or `abandoned-quietly` and the project no longer aligns with stated goals. Propose a closure action: move to `archive/`, write a closure note, remove from active projects.
- **hand-off** — state is `blocked` by capacity rather than external dependency, and someone else could do it. Name the candidate if one is in `knowledge/people/`.
- **wait** — state is `blocked` by a named external dependency and waiting is the correct move. State the dependency and roughly when to re-check.

Never recommend `continue` for a project that is stalled — that is how silent failures continue.

### 8. Surface changes that should persist

After producing the status, check whether anything from this read-through should be written to the project's `MEMORY.md` (for example, a blocker that was not yet logged, a new open commitment). Do not write automatically. Offer, listing the specific additions, and let the user approve. Respect the rule that writing to `MEMORY.md` is user-triggered.

## What to avoid

- Do not produce a narrative timeline. The user wants state and action, not history.
- Do not recommend `continue` for any project not in `active` state. Stalled projects that continue become abandoned projects.
- Do not soften the `abandoned-quietly` label. It is the point of this skill.
- Do not invent a next action that the files do not support. If derived, label it as `[derived]` so the user knows to re-anchor.
- Do not skip cadence. "Days since last activity" without typical cadence for comparison is a meaningless number — 5 days is fine for some projects, catastrophic for others.
- Do not load files outside the project folder unless they explicitly reference the project. The signal-to-noise drops fast.

## Integration with other skills

- Pair with `decision-check` when the recommendation is `close` or `revive` — surface any prior decisions that committed the user to this project before acting.
- Pair with `foresight` if the recommendation is `revive` — fold the revival action into next week's priorities rather than treating it as slack time.
- If the project is in `blocked` state and the blocker is a person, pair with `relationship-check` to see last-contact and open commitments for that person.
- If consolidation should later mark this project as stalled or abandoned, leave that to `nightly-consolidation` — do not modify `learning/patterns.md` directly.
