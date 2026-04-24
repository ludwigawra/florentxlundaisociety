---
name: nightly-goal-pursuit
description: While the user sleeps, advance one long-term goal by doing preparatory work (research, drafts, list-building, brief notes) that removes friction from tomorrow's first move. Use at night (typically scheduled after nightly-consolidation), when the user wants to wake up to visible progress, or when a goal has stalled because the next step is ambiguous. Produces a single morning-delivery file under memory/short-term/ with a one-paragraph headline, 3–10 concrete outputs ready to review, and a clear "first move when you wake up" line.
---

# Nightly Goal Pursuit

The point of this skill is the promise: *you go to sleep — the brain works. You wake up — friction is gone. One concrete step is already done.*

Every other "memory" product stores what happened. This one **does what's next.**

All paths below are relative to the brain root — the directory containing CLAUDE.md. When invoked via a slash command inside Claude Code, that is the user current working directory.

## When to use

Invoke this skill when any of the following apply:

- It is night (or the user is about to close for the day) and they've asked for the brain to "work overnight"
- A long-term goal from `system/context/goals-metrics.md` has stalled and the next step is ambiguous
- The user wants to wake up to visible progress rather than a blank morning
- A scheduled run (cron / CronCreate) fires this skill as part of the nightly cycle — typically after `nightly-consolidation`

Do not invoke when:

- It's morning (use `morning-briefing` or `foresight` instead — those read the output of this skill)
- The user needs an interactive conversation (this skill produces a file, not a chat)
- No goals exist yet in `system/context/goals-metrics.md` (flag to the user and stop)

## Inputs

The caller may provide, but does not need to:

- **Target goal** — a specific goal id or short label from `goals-metrics.md`. If not provided, pick the one that best matches the rules in *Goal selection* below.
- **Depth** — `light` (≤30 min equivalent of work, 1 output), `standard` (3–5 outputs, default), `deep` (5–10 outputs, for big goals the user has explicitly asked to push on)
- **Mode hint** — one of `research`, `outreach-prep`, `draft`, `list-build`, `synthesis`. If omitted, infer from the goal.

## Process (execute in order)

### Step 1 — Load context

Read, in this order:

1. `system/context/goals-metrics.md` — the source of truth for goals, their current status, and target dates
2. `MEMORY.md` — especially `## Active Context` and any sections referencing the target goal
3. `memory/decisions/` — filter to decisions tagged or referenced by the target goal's topic
4. `knowledge/people/` and `knowledge/companies/` — pull anyone already relevant to the goal
5. `learning/patterns.md` — recent patterns that should shape how the work is done
6. The latest `memory/short-term/consolidation-report-*.md` (if present) — what happened yesterday that might inform tonight's work

If any of the above are missing, continue without them — note the gap in the output.

### Step 2 — Goal selection (if target not provided)

Rank goals by a composite score:

- **+3** goal marked RED or falling behind in `goals-metrics.md`
- **+2** goal has a target date within 30 days
- **+2** no material work on this goal in the last 7 days (check short-term filenames, recent decisions)
- **+1** the next step for this goal is ambiguous (no clear next action in recent records)
- **+1** the user has explicitly flagged this goal as a priority in Active Context or recent sessions

Pick the goal with the highest score. If tied, prefer the one with the nearest deadline.

If the selected goal's next step is already crisp and in motion (e.g. "ship v1 Thursday" and the work is underway), pick the *second* highest — night work is for unblocking, not duplicating momentum.

### Step 3 — Mode selection

Pick exactly one mode based on the goal's nature:

| Mode | Use when | Output shape |
|---|---|---|
| `research` | The goal needs information the user doesn't have yet (competitors, background on a person, market data, technical precedent) | 3–5 bullet findings + 1 source per finding + 1-line "what this changes" |
| `outreach-prep` | The goal needs the user to contact specific people (investors, partners, candidates, customers) | A list of 5–10 named targets with: who they are, why them, a draft intro/email per target |
| `draft` | The goal needs content the user will refine (pitch section, blog post, spec, proposal) | A working draft with clear "rough bits" marked for the user's judgment |
| `list-build` | The goal needs a candidate set (investors to contact, features to ship, questions to ask) | A curated list of 8–15 with 1-line rationale each, ranked |
| `synthesis` | The goal needs the brain's existing knowledge pulled into one place | A 1-page brief pulling together the relevant decisions, patterns, people, and recommending a next step |

Respect the caller's `Mode hint` if provided; otherwise infer from the goal.

### Step 4 — Do the work

Execute the mode you picked. Ground every output in something real — a file in the brain, a source you can cite, a decision already made. Never fabricate names, numbers, or quotes.

Constraints by depth:

- `light` → 1 output, ≤300 words total, single tool call if possible
- `standard` → 3–5 outputs, ≤900 words total
- `deep` → 5–10 outputs, ≤2000 words total, multiple tool calls expected

If you need to make a judgment call on the user's behalf, *surface it* in the output — don't bury it. Use a `> Decision needed:` line.

### Step 5 — Assemble the morning-delivery file

Write exactly one file:

`memory/short-term/morning-delivery-YYYY-MM-DD.md`

Where `YYYY-MM-DD` is **tomorrow's date** (the user will see this when they wake up).

Use this exact frontmatter and structure:

```yaml
---
type: morning-delivery
goal: <goal id or label>
mode: research | outreach-prep | draft | list-build | synthesis
depth: light | standard | deep
created: YYYY-MM-DD
status: pending-review
---

# Morning delivery — <goal label>

## Headline
<one paragraph, maximum three sentences, that a sleepy person can read and immediately understand what was done and why it matters>

## First move when you wake up
<one line — the single next action. Must be specific, concrete, ≤15 minutes of work. The goal is to remove the friction of deciding what to do first.>

## Outputs

### <Output 1 title>
<content — bullets, drafts, whatever the mode produces>

### <Output 2 title>
<content>

...

## Sources / context touched
- [[Decision or file name]]
- [[Person]]
- ...

## Gaps / what I couldn't do
<if anything — missing MCP, missing source, a call the user has to make themselves. Empty is fine.>
```

### Step 6 — Update goal tracking

Append a single line to `system/context/goals-metrics.md` under the target goal's section:

```
- YYYY-MM-DD nightly-goal-pursuit: <mode> · <depth> · outputs: N · see morning-delivery-YYYY-MM-DD.md
```

This creates a visible trail of nightly work per goal.

### Step 7 — Notify (if Telegram is configured)

If the brain has a Telegram channel configured (check for `.claude/channels/telegram/.env` or the installed `settings.json` `user.integrations` including `telegram`), send a single message at the user's configured morning time (or immediately if no schedule):

```
☀️ Morning — last night I worked on <goal>. <output count> items ready. First move: <first move line>. Open: morning-delivery-YYYY-MM-DD.md
```

If not configured, skip silently. Never fail the skill over a missing channel.

### Step 8 — Self-improvement log

After the user has reviewed the morning delivery and given feedback (even implicit — "used as-is" or "edited heavily"), that signal will be routed by the nightly consolidation to `learning/skill-feedback/nightly-goal-pursuit.md`. No action needed inside this skill.

## Format

- English by default. Follow the user's language preference from MEMORY.md if set.
- Professional but conversational. The user is reading this groggy — clarity beats style.
- Every output block self-contained. No "see section 3 for context" cross-references.
- Never more than 15 words in a heading.

## Anti-patterns (do not do these)

- **Do not fabricate.** If you need data you don't have, say so in the Gaps section.
- **Do not loop.** This skill runs once per night per goal. Don't schedule or recurse.
- **Do not touch MEMORY.md.** That's user-triggered only. The morning-delivery file is your surface.
- **Do not overreach the depth budget.** A 3000-word "light" output is a failure, not effort.
- **Do not pick the same goal every night.** Goal selection step penalizes goals with recent short-term files — trust it.

## Calibration

Initial state: **learning**. Expect the user to redirect the first 3–5 runs — mode choice, goal pick, output shape, tone. Log every redirect to short-term so the nightly consolidation can route it to `learning/skill-feedback/nightly-goal-pursuit.md`.

After 3+ approval signals in a row, this skill graduates to **calibrated** and can run autonomously on cron.
