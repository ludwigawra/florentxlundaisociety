---
name: behavioral-learning
description: Observe how the user actually works — not what they say — and extract behavioral patterns the system can use to adapt its own triggers, defaults, and voice. Runs nightly after nightly-consolidation. Reads archived transcripts, the autonomous-runs ledger, and usage frequency signals. Writes inferred patterns to learning/behavioral-patterns.md. The difference between "memory" and "an assistant that learns you" — no one writes these rules, the brain infers them.
---

# Behavioral Learning

This is the skill that makes AI-OS different from memory. Memory stores *what you said*. This skill learns *how you work* by watching the data the rest of the system already captures.

You, the user, never explicitly teach the system:

- "I prefer short emails" → the brain notices you always delete the pleasantries from drafts
- "I hate exclamation marks" → the brain notices you edit every one out
- "I reflect on Sundays" → the brain notices the pattern and pre-bakes Saturday night
- "When stressed, I abandon planning and code instead" → the brain infers this from session timing and skill-invocation data

Those behavioral patterns feed forward into: skill defaults, trigger timing, voice rules, autonomous-skill selection. The rest of the system gets sharper — automatically — because this skill ran.

The AI-OS root is at `~/Desktop/AI-OS/` by default; use the configured root if different. All paths below are relative to that root.

## When to use

This skill is designed to run **autonomously on cron**, typically 10–20 minutes after `nightly-consolidation` so it can read that night's freshly-routed data.

Do not invoke manually unless:

- Explicitly debugging the behavioral-learning loop
- Before a pitch / demo, to regenerate fresh inferences
- After a significant change in usage pattern (new project, new surface, new integration)

## Inputs

Optional caller hints:

- **Window** — `week` (default — last 7 days), `month` (30 days, more confident signals), `quarter` (90 days, for long-term behavioral drift)
- **Focus** — `all` (default), or one of `skill-usage`, `voice`, `timing`, `relationships`, `tool-preferences`
- **Mode** — `observe` (default: write new patterns, don't edit downstream skills/defaults), `propose` (write patterns AND stage proposed edits to downstream files for review), `apply` (write patterns AND apply the edits directly — only for patterns that pass the confidence threshold)

Default mode is **observe**. The confidence thresholds and review gates are described below.

## Process (execute in order)

### Step 1 — Load the raw behavioral data

Read, in this order:

1. `memory/short-term/transcripts/` — all transcripts within the window. These are the honest record of what happened, not a summary.
2. `routines/autonomous-runs.jsonl` — every autonomous skill fire in the window, including what it produced and the user's response (approved / edited / ignored)
3. `learning/corrections.md` and `learning/patterns.md` — already-known content patterns (so behavioral inferences don't duplicate them)
4. `learning/skill-feedback/*.md` — existing per-skill feedback, especially approval rates
5. `learning/tool-errors.log` — tool failure signals (behavioral pattern: "user avoids Chrome MCP after 3 consecutive failures")
6. `system/context/goals-metrics.md` — which goals are getting attention vs not
7. `memory/decisions/` timestamps — decision cadence

If the transcripts directory has fewer than 3 sessions in the window, stop. Note in the output: *"insufficient behavioral data — need ≥3 sessions to infer."*

### Step 2 — Extract behavioral signals (not content)

For each of the six signal categories below, scan the loaded data and emit raw signals. Do not yet form patterns — just catalog what you observe.

**A. Skill-usage signals**
- Which skills were invoked and how often
- Which skills were invoked but interrupted before completion
- Which skills the user *should have* invoked but didn't (goal stalled + no `foresight` for 14 days; decision pending + no `decision-check`; etc.)
- Day-of-week and time-of-day distribution per skill

**B. Voice/draft signals**
- For every draft produced by an autonomous skill (check the ledger `outputs` counts + artifact files): did the user accept it as-is, edit lightly (<20% change), edit heavily (>20% change), or ignore it?
- When editing, what consistently gets removed (exclamation marks, hedges, filler openers)?
- When editing, what consistently gets added (specifics, numbers, names)?

**C. Timing/pacing signals**
- When does the user start sessions? End them?
- When do they run the dashboard?
- When are decisions logged? (time of day + day of week)
- Idle gaps — when does the user stop for the day; when do they come back?

**D. Relationship-engagement signals**
- Which people in `knowledge/people/` are mentioned, drafted to, or checked on vs not?
- Frequency-of-contact baselines per person — who has drifted?
- Who does the user edit drafts to more vs less (a behavioral proxy for care / stakes)?

**E. Tool-preference signals**
- Which MCPs / tools succeed vs fail
- After a tool failure, what does the user switch to?
- Which tools does the user actively prefer (invoked even when alternatives exist)?

**F. Goal-pursuit signals**
- Time spent per goal (proxy: decisions logged, sessions tagged, autonomous runs targeting the goal)
- Which goals have momentum, which are stalling
- Which goals does the user consistently *avoid* talking about (possible signal: stuck, or deprioritized but not yet dropped)

### Step 3 — Form behavioral patterns

A **behavioral pattern** is a rule the system can act on. The schema:

```yaml
---
pattern_id: <short-kebab>
category: skill-usage | voice | timing | relationships | tool-preferences | goals
confidence: low | medium | high
observations: N  # how many distinct signals support this
window: week | month | quarter
first_seen: YYYY-MM-DD
last_seen: YYYY-MM-DD
---
```

followed by:

```markdown
## The pattern
<one sentence — what behavior was observed>

## The inference
<one sentence — what rule the system should act on>

## Evidence
- Observation 1: …
- Observation 2: …
- Observation 3: …

## Proposed action
- <concrete change to a skill's SKILL.md, or a trigger, or a default>
- (or: "none — observe more before acting")
```

**Confidence rules:**

- **low** = 1–2 observations, or contradictory signals. Record the pattern but propose no action.
- **medium** = 3–5 observations, consistent. Propose an action but do not apply it automatically.
- **high** = 6+ observations, consistent across at least two distinct sessions/contexts. Safe to auto-apply if the caller passed `mode: apply`.

Be strict about what counts as an observation. "The user deleted an exclamation mark once" is not an observation of a voice pattern — it's noise. "The user edited out exclamation marks in 4 of 5 drafts across 3 sessions" is.

### Step 4 — Write to `learning/behavioral-patterns.md`

Append new patterns (do not overwrite the file — it grows over time). If an existing pattern has the same `pattern_id`, update its `observations`, `last_seen`, and evidence list; do not duplicate.

The file's top 3 patterns (by confidence + recency) surface in the dashboard `Behavioral Patterns` panel.

### Step 5 — Propose downstream edits (if mode != observe)

For each pattern with `confidence: medium` or higher, propose a concrete change to a downstream file:

- **Voice pattern** → edit to `voice/voice-fingerprint.md`
- **Skill-usage pattern** → edit to the relevant `SKILL.md` (adjust the defaults or the trigger conditions)
- **Timing pattern** → edit to the scheduler config (`.claude/scheduled-runs.json` if present) — never edit cron directly
- **Relationship pattern** → edit to the relevant `knowledge/people/<person>.md` (update the "engagement cadence" field)
- **Tool-preference pattern** → add or update an entry in `risks.md` (risk flags) if the pattern is "avoid X"
- **Goal pattern** → note in `system/context/goals-metrics.md` under the relevant goal

If `mode: propose`, write the proposed diff to `memory/short-term/behavioral-proposals-YYYY-MM-DD.md` for the user to review.

If `mode: apply`, apply only the `confidence: high` edits. Log each edit in the `autonomous-runs.jsonl` ledger with `artifact` pointing at the edited file.

### Step 6 — Log the run

Append one line to `routines/autonomous-runs.jsonl`:

```json
{"ts":"<ISO-8601>","skill":"behavioral-learning","mode":"<mode>","status":"completed","outputs":<N new/updated patterns>,"trigger":"<cron|manual>","artifact":"learning/behavioral-patterns.md"}
```

If mode was `propose` or `apply` with staged edits, status is `pending-review` and `artifact` is the proposals file.

## Format

- English by default
- Dense. A behavioral pattern file is reference material, not prose.
- Never quote the user verbatim from transcripts in a way that would embarrass them. This is internal; be dispassionate.
- No emojis.

## Anti-patterns (do not do these)

- **Do not infer from a single observation.** The whole point of this skill is that behavioral claims need supporting weight.
- **Do not treat stated preferences as behavior.** If MEMORY.md says "user prefers X" but behavior shows "user does Y", record the behavioral pattern and flag the contradiction. Don't overwrite the stated preference — surface the tension.
- **Do not edit skills in `mode: observe`.** Observation is the safe default.
- **Do not propose an action that contradicts risks.md risk flags.** The amygdala wins; behavioral patterns adapt around it.

## Calibration

Initial state: **learning**. Expect the first 5–10 runs to produce noisy, low-confidence patterns. The user should run in `observe` mode until the pattern file has 10+ entries, then switch to `propose`. Only after ~30 days of consistent pattern generation should the user enable `apply`.

The self-improvement loop applies to this skill too: if the user consistently ignores proposed edits, the skill's confidence-threshold defaults should rise. Log that feedback.

## Why this exists

Every competitor stores content. AI-OS watches behavior. This skill is the bridge between "I know what you said" and "I know how you work." It is the reason the product becomes harder to leave the longer you use it — the brain's behavioral model has no portable equivalent elsewhere.
