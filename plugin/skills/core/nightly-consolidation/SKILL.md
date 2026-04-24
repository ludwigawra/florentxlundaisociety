---
name: nightly-consolidation
description: End-of-day consolidation for the AI-OS brain — processes short-term memory, extracts decisions and patterns, routes new entities, logs skill feedback and corrections, archives processed files, and writes a summary report. Use at the end of a working day, on a scheduled trigger, or on-demand when short-term memory has accumulated enough signal to consolidate.
---

# Nightly Brain Consolidation

This is the brain's sleep cycle. Short-term memory accumulates during the day as session files and archived transcripts. Consolidation reads that raw material, extracts what matters, routes it into long-term brain regions, and archives what has been processed. Done well, this is what makes the AI-OS get smarter with use.

The AI-OS root defaults to `~/Desktop/AI-OS/`. If a different root is configured, use that. All paths below are relative to the brain root.

## When to use

- At the end of a working day (scheduled or on-demand)
- When `memory/short-term/` has more than a handful of unprocessed files
- When the user says "consolidate", "process today", "do the nightly", or similar
- After a long session where a lot of decisions, feedback, and new entities surfaced

Avoid running this repeatedly in the same day unless new short-term files were added between runs — it wastes time and can cause double-routing.

## Core principles (non-negotiable)

- **Never delete user data.** Archive, don't erase. The only things this skill may remove are empty directories it created.
- **Append-only where possible.** Prefer adding new files over editing existing ones, especially under `memory/decisions/`.
- **Flag rather than guess.** If two short-term notes contradict each other, surface the contradiction in the report — don't pick a winner.
- **Respect scope.** Only process short-term files from today and any prior days still marked unconsolidated. Don't touch files already archived.
- **Idempotent.** Running twice on the same day should not duplicate decisions, skill-feedback entries, or entity stubs. Check before writing.

## Process

Execute the phases in order. Each phase may be skipped if there is nothing to do — but the phase check itself is mandatory.

---

### Phase 0 — Preflight

1. Confirm the brain root exists and is writable. If not, stop and report the path issue.
2. Ensure these directories exist (create if missing):
   - `memory/short-term/`
   - `memory/short-term/archive/`
   - `memory/short-term/transcripts/`
   - `memory/decisions/`
   - `learning/skill-feedback/`
   - `knowledge/people/`
   - `knowledge/companies/`
3. Determine today's date in `YYYY-MM-DD` format. Use this as the run date.
4. Check whether a consolidation report already exists for today at `memory/short-term/consolidation-report-{date}.md`. If it does, switch to append mode (add a new "Re-run at {time}" section) instead of overwriting.

---

### Phase 1 — Gather raw material

Read, but do not yet modify:

1. **Today's short-term session files** — every `.md` file in `memory/short-term/` whose filename or frontmatter indicates today's date, and any older files without a `status: consolidated` frontmatter field.
2. **Recent transcripts** — `.jsonl` or `.md` files in `memory/short-term/transcripts/` created today. If transcripts are large, sample the most recent and any that match today's session file timestamps.
3. **Current patterns** — `learning/patterns.md`, so new extractions don't duplicate existing ones.
4. **Current corrections** — `learning/corrections.md`, to count unextracted entries.
5. **Current goals** — `system/context/goals-metrics.md` if present, so decisions and entities can be tagged for alignment.
6. **Existing skill feedback files** — list of `learning/skill-feedback/*.md`, to know which skills have pending entries before this run.

Keep the raw content in working memory throughout the run.

---

### Phase 2 — Extract signals from short-term

For each short-term file from Phase 1, classify its content into five signal types. A single file typically contains several.

1. **Decisions** — a choice was made, a direction was set, a stance was taken. Look for phrases like "we decided", "going with", "locked in", "picked X over Y", or clear first-person resolutions.
2. **Corrections** — something went wrong, was misjudged, or required rework. Look for "should have", "wrong approach", "wasted time", user corrections, or errors that surfaced.
3. **Skill feedback** — explicit or implicit reaction to a skill's output. Positive: "perfect", "great", used as-is. Negative: "no", "not like that", rewritten. Redirect: "actually", "more like".
4. **New entities** — a person, company, product, or project that is not yet a file under `knowledge/people/`, `knowledge/companies/`, or `projects/`.
5. **Facts worth remembering** — durable context that belongs in `MEMORY.md` but is not a decision. Flag these, do not auto-write them (see Phase 7).

Apply a **significance filter** — if a signal is trivial, transient, or already captured elsewhere, drop it. When in doubt on durable value, keep it.

---

### Phase 3 — Route decisions to `memory/decisions/`

For each decision extracted:

1. Normalize the claim into a hyphenated lowercase filename, e.g., `charge-for-discovery-calls.md`. Filenames read as claims, not categories.
2. Check whether a file with that name (or a near-duplicate) already exists. If yes:
   - If the new signal is consistent with the existing decision, update only `updated:` in its frontmatter and add a note in the report.
   - If it contradicts the existing decision, create a new decision file with `supersedes: [[old-claim]]` and set the old file's `status: superseded` and `superseded_by: [[new-claim]]`. Do not rewrite the body of the old file.
3. Otherwise, create the file at `memory/decisions/{claim}.md` with this structure:

```yaml
---
type: decision
tags: [tag-one, tag-two]
related: [[Entity One]], [[Entity Two]]
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: active
---
```

```
# {The claim as a full sentence.}

## Context
{Why this came up — grounded in the short-term source.}

## Decision
{The direction chosen, stated as a claim.}

## Reasoning
{The 2–4 reasons that drove it.}

## Implications
{What changes because of this.}

## Source
Extracted from `memory/short-term/{source-file}.md` on {run-date}.
```

Reference by `[[wiki-link]]` any entity that has (or will get) a file. Do not invent entities.

---

### Phase 4 — Route skill feedback

For each skill-feedback signal:

1. Identify the skill name. If unclear, skip and note in the report.
2. Ensure `learning/skill-feedback/{skill-name}.md` exists. If not, create it with frontmatter:

```yaml
---
type: skill-feedback
skill: {skill-name}
usage_count: 0
approval_rate: null
calibration_status: learning
last_improved: null
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

3. Append a feedback entry under a `## Feedback log` section:

```
### {run-date} — {signal type: positive | negative | redirect | implicit}
- **Context:** {what was produced / what was asked for}
- **Feedback:** {exact words or described reaction}
- **Implication:** {what this suggests should change about the skill}
- **Status:** pending
```

4. Update frontmatter counters: increment `usage_count`, recalculate `approval_rate` from the log, set `updated:` to today.

5. **Do not edit the SKILL.md in this phase.** Editing a skill's instructions is a separate, deliberate action — see Phase 5.

---

### Phase 5 — Apply skill improvements (conservative)

For each skill-feedback file with **3+ pending entries**:

1. Read the actual SKILL.md that the feedback targets.
2. Look for a pattern across the pending entries — voice issue, scope issue, missing step, wrong default.
3. Classify the needed change:
   - **Minor** — tightening wording, adding a missing bullet, clarifying an existing rule. Safe to apply automatically.
   - **Significant** — changing logic, default behavior, output format, or adding/removing a phase. Do not apply automatically; flag for user review in the report.
4. For minor changes: edit the SKILL.md, mark the contributing feedback entries as `Status: applied`, and append an entry to an `## Improvement history` section in the feedback file:

```
### {run-date} — Minor
- Changed: {summary}
- Based on: {list of feedback dates}
```

5. For significant changes: draft the proposed edit in the report under "Skill improvements needing review", and mark the feedback entries `Status: queued`. Do not edit the SKILL.md.

6. Update `calibration_status` in the feedback file:
   - `learning` — 0–4 total uses, or was just edited this run
   - `calibrated` — 5+ uses with ≥80% approval
   - `graduated` — 10+ uses with ≥90% approval

If feedback entries contradict each other, do not edit the skill. Flag the contradiction in the report and let the user resolve.

---

### Phase 6 — Log corrections and extract patterns

1. For each correction signal from Phase 2, append to `learning/corrections.md` as a dated entry:

```
### {run-date}
- **What happened:** {brief description}
- **What should have happened:** {the correct behavior}
- **Why:** {root cause}
- **Source:** `memory/short-term/{file}.md`
- **Status:** unextracted
```

2. Count unextracted corrections (those without `Status: extracted`). If **5 or more** exist, perform pattern extraction:
   - Group related corrections by theme
   - For each group with 2+ members, write a pattern to `learning/patterns.md` in this format:

```
### {pattern name in imperative form}
- **When:** {the situation}
- **Do:** {the right approach}
- **Because:** {the reason, grounded in corrections}
- **Extracted from:** {list of correction dates}
- **First extracted:** {run-date}
```

   - Mark each contributing correction as `Status: extracted` and reference the pattern name
   - Do not remove the correction entries — they stay as historical record

3. If fewer than 5 unextracted corrections exist, skip extraction and just note the count in the report.

---

### Phase 7 — Route new entities

For each new entity from Phase 2:

1. Determine the entity type: `person`, `company`, `project`.
2. Compute the stub path:
   - Person → `knowledge/people/{entity-name-hyphenated}.md`
   - Company → `knowledge/companies/{entity-name-hyphenated}.md`
   - Project → Flag for user; do not auto-create a `projects/{project}/` directory, since that's a larger commitment
3. If the stub file does not exist, create it with minimal frontmatter and a skeleton body:

```yaml
---
type: person   # or company
tags: []
related: []
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: active
source: "memory/short-term/{source-file}.md"
---
```

```
# {Entity name}

## Context
{One-paragraph summary from the short-term source.}

## What we know
- {Fact one}
- {Fact two}

## Open questions
- {What to find out next}
```

4. If the stub already exists, append the new context under a dated subsection in "What we know" — do not rewrite existing content.

5. Never write to `MEMORY.md` from this phase. `MEMORY.md` is user-triggered long-term memory; flag any candidate facts in the report instead.

---

### Phase 8 — Graph hygiene (light-touch)

Run these passes, but be conservative:

1. **Missing frontmatter** — if a file created in earlier phases has no frontmatter, add it. Do not add frontmatter to user-authored files outside this run.
2. **Obvious wiki-link gaps** — if a newly-written file references an entity in plain text that now has a stub (from Phase 7), convert the plain text to `[[Entity Name]]`. Do not auto-convert mentions in pre-existing files; flag them in the report.
3. **Orphan flags** — if a file this run created has no inbound links and no `related:` entries, note it in the report under "New orphans to connect".

---

### Phase 9 — Archive processed short-term files

For each short-term file fully processed by this run:

1. Set its frontmatter `status: consolidated` and `consolidated: {run-date}`.
2. Move it from `memory/short-term/` to `memory/short-term/archive/` using the filesystem move (preserve filename). Do not rename or rewrite.
3. If a file was partially processed (some signals extracted, some skipped), leave it in `short-term/` and set `status: partial` with a note in the report — do not archive.

Never touch files in `memory/short-term/transcripts/` in this phase. Transcripts have their own lifecycle and may be needed by future runs.

---

### Phase 10 — Write the consolidation report

Create or append `memory/short-term/consolidation-report-{run-date}.md` with this structure:

```yaml
---
type: consolidation-report
date: YYYY-MM-DD
status: complete
---
```

```
# Consolidation Report — {run-date}

## Summary
{Two or three sentences: what today's consolidation did at a glance.}

## Decisions recorded
- `{claim}.md` — {one-line summary}
  (If none: "No new decisions today.")

## Skill feedback logged
- `{skill-name}` — {N} new entries, now at {calibration_status}
  (If none: omit.)

## Skill improvements
### Applied automatically
- `{skill-name}` — {what changed}
### Needing your review
- `{skill-name}` — {proposed change, not yet applied}
(If none in either bucket: "No skill edits this run.")

## Corrections logged
- {N} new corrections. Unextracted total: {M}.
- {If patterns extracted this run, list them with one-line summaries.}

## New entities
- `knowledge/people/{name}.md` — stub created
- `knowledge/companies/{name}.md` — stub created
- Flagged as project (not auto-created): {name}

## Long-term memory candidates
- {Fact or context from short-term that may belong in MEMORY.md — waiting for user confirmation.}

## Contradictions and flags
- {Any contradictions between short-term notes, between feedback entries, or against prior decisions.}

## Files archived
- {count} short-term files moved to `memory/short-term/archive/`
- {count} left in place as `status: partial`

## Graph hygiene
- {Orphans, missing frontmatter, unresolved wiki-links surfaced.}

## What to look at tomorrow
- {Up to three specific follow-ups the user should see in the morning.}
```

Keep sections that have nothing to report out of the final file rather than writing empty stubs. A short accurate report is better than a padded template.

---

## Quality bar for the run

Before declaring the run complete, verify:

- Every short-term file from today is either archived (`status: consolidated`) or intentionally left behind (`status: partial`)
- Every decision signal extracted has a file in `memory/decisions/`
- Every skill-feedback signal has an entry in the right `learning/skill-feedback/{skill}.md`
- Every new entity has a stub file or is flagged as project-level
- The consolidation report exists at the expected path
- No existing file has had its body content rewritten (frontmatter updates are allowed)

If any verification fails, note the failure in the report — do not silently continue.

## Rules

- **Archive, never delete.** Processed short-term files are moved, not erased. Decision files are superseded, not overwritten.
- **Never write to `MEMORY.md`.** It is user-triggered. Surface candidates in the report.
- **Never edit `risks.md`** (if the brain has one). Risk entries are a user-approval zone.
- **Idempotency check before writing.** Every file you create must be checked for prior existence first.
- **No skill edit without 3+ feedback entries**, and no significant skill edit without explicit user review.
- **Contradictions are surfaced, not resolved.** The user decides.
- **Respect the calibration ladder.** A skill regresses to `learning` after a significant edit, regardless of prior status.
- **Escape regex characters** in entity names before grep operations.

## Failure modes to avoid

- Auto-writing to `MEMORY.md`. It is the one file that belongs to the user's express permission.
- Deleting or renaming files during archive. Move preserves history; rename breaks wiki-links.
- Editing a skill's SKILL.md on a single piece of feedback. Three entries minimum, and prefer conservative wording changes over logic changes.
- Creating duplicate decision files because the claim was phrased slightly differently. Always check for near-duplicates before writing.
- Routing a session note to multiple regions without archiving it afterwards, causing the next run to re-process the same content.
- Writing a padded report full of "N/A" sections. Prune empty sections.
- Running on a day with no material and still producing a full report. If nothing meaningful happened, write a one-line report noting so and exit.
