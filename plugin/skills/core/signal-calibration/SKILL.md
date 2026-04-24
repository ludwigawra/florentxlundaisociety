---
name: signal-calibration
description: Nightly self-improvement for the thalamus signal detector — the pre-prompt hook that suggests which brain regions to activate based on keyword signals. Compares what the thalamus predicted vs what actually got loaded or mattered in each session, measures hits and misses, and proposes concrete updates to the keyword mapping. Use on the nightly cycle after consolidation, or on demand when the signal detector feels off (wrong activations, missed categories, or too noisy).
---

# Signal Calibration

The thalamus is the `user-prompt-submit.sh` hook that runs on every user prompt and emits a compact `THALAMUS [CATEGORY]: Activate: <regions>` hint. It is the system's attempt to pre-load the right context before Claude reads the prompt. When it misses, the session starts colder than it should. When it over-fires, context gets crowded with irrelevant regions.

Calibration is how the thalamus gets better. It is not an on-the-fly decision — it is a review loop that runs against real data and proposes changes, not applies them silently.

The AI-OS root is at `~/Desktop/AI-OS/` by default. If the user has configured a different root (check the plugin config or a root-level `CLAUDE.md` marker), use that path instead. All paths below are relative to the brain root unless noted.

## When to use

Invoke this skill whenever any of the following apply:

- Nightly cycle, after `nightly-consolidation` has archived transcripts
- The user reports the thalamus is firing for the wrong things or missing the right ones
- A new brain region has been added and the thalamus has not been taught about it
- A session transcript shows the thalamus activated a region that was never touched, or did not activate a region that was central
- Monthly, as a standing hygiene pass even if nothing seems off

Do not invoke after a single session to make broad changes. Calibration needs enough signal to be meaningful — at least 10 sessions of transcripts.

## Inputs

The caller may provide:

- **Window** — how far back to analyze (default: last 7 days)
- **Mode** — `observe` (read-only, report only), `propose` (default, write a report with proposed changes), or `apply` (write the proposed changes to the hook). `apply` requires explicit confirmation from the user and is L2 — never run unattended.
- **Min-sample** — minimum session count before calibration proceeds (default: 10). If the transcripts available are fewer, stop and report that there is not enough signal.

## Process

### 1. Locate the thalamus source

The thalamus lives at `.claude/hooks/user-prompt-submit.sh` (installed from `plugin/hooks/user-prompt-submit.sh`). Read the current keyword-to-category mapping. Most implementations use a short list of category blocks with regex or substring keyword matches feeding into an `Activate:` list.

Parse the mapping into a structured form — categories, keywords, and activated regions per category. This is the object under test.

If the file is missing or does not parse, stop and flag. Calibration cannot run without a known source of predictions.

### 2. Collect the ground truth from transcripts

Read transcripts from `memory/short-term/transcripts/` within the window. For each session:

1. Find the user prompts (usually `role: user` turns without tool results)
2. For each user prompt, extract:
   - The thalamus output that was injected for it, if visible in the injected context (look for `THALAMUS [...]: Activate: ...` strings)
   - The files that Claude actually read or wrote during that turn (from tool calls)
   - The brain regions those files belong to (by top-level folder)
   - Whether the session later referenced any of those regions in output

Each prompt becomes one row with: prompt text, predicted regions, actually-used regions, categories hit.

If the transcript format does not expose tool calls cleanly, fall back to reading the session file for that date and treating its references as ground truth. State the fallback in the report.

### 3. Compute the confusion matrix

Across all prompts in the window, for each category and for each region, compute:

- **True positive** — thalamus predicted, actually used
- **False positive** — thalamus predicted, not used
- **False negative** — thalamus did not predict, but was used
- **True negative** — neither predicted nor used (implicit; rarely computed explicitly but useful for precision math)

Report per-category precision (`TP / (TP + FP)`) and recall (`TP / (TP + FN)`).

Surface the worst offenders first: categories with precision under 0.5 are noisy. Categories with recall under 0.5 are missing. Name both in the output.

### 4. Look for pattern-level issues

Beyond individual category stats, look for:

- **Keywords that never fire** — in the mapping but absent from all user prompts in the window. Candidates for removal.
- **Phrases that appeared often but did not match any category** — candidates for new keyword additions. Cluster by theme before proposing.
- **Regions that were used often but never predicted** — suggests a missing category or missing keywords in an existing category.
- **Categories that almost always co-fire** — suggests they could merge, or one is redundant.
- **False-positive repeat offenders** — a single keyword that causes most of a category's FPs. Candidate for removal or refinement (e.g., `goal` firing STRATEGY when the prompt is about soccer goals).

Name each pattern with a citation of at least two examples. Do not propose a change off a single anomaly.

### 5. Propose concrete changes

For each finding, write a concrete proposal:

- **Remove keyword** — which keyword, which category, evidence (e.g., 0 firings in 47 prompts)
- **Add keyword** — which keyword, which category, evidence (e.g., "roadmap" appeared in 6 prompts, STRATEGY never fired)
- **Retarget keyword** — move a keyword from one category to another with the same evidence shape
- **Add category** — when a cluster of themes has no home. Propose the category name and its initial keyword set.
- **Merge or remove category** — when precision is near zero and the category offers no coverage a neighbor does not.

Each proposal must include:
- The exact change (pseudocode-ready, e.g., `STRATEGY: +"roadmap", -"vision"`)
- The expected precision/recall delta if applied
- At least two concrete prompt citations that motivate the change
- A risk note — what this change might regress

Do not propose more than 5 changes per calibration. The thalamus is a compact artifact; too many changes at once makes the next calibration impossible to attribute. If the findings demand more, pick the 5 highest-impact and note the rest as deferred.

### 6. Output a calibration report

Write to `memory/short-term/signal-calibration-YYYY-MM-DD.md` with frontmatter:

```yaml
---
type: signal-calibration
window: <window>
mode: <observe | propose | apply>
sessions_analyzed: <count>
prompts_analyzed: <count>
created: YYYY-MM-DD
tags: [thalamus, calibration, meta-cognition]
---
```

Report structure:

```
# Signal Calibration — YYYY-MM-DD

## Sample
<sessions, prompts, fallbacks if any>

## Overall
<one-line summary: which categories are healthy, which are off>

## Per-category stats
<table or list: category, precision, recall, sample size>

## Patterns observed
<bulleted, with citations>

## Proposed changes
<1-5 blocks from step 5>

## Deferred
<anything noteworthy but not in the top 5>

## Proposed diff
<if mode=propose or apply, a literal snippet of what the hook file would become for the changed sections>
```

### 7. Apply (only if mode=apply)

If and only if the user explicitly ran with `mode=apply` or approved the propose report:

1. Read the current `user-prompt-submit.sh`
2. Make a dated backup at `.claude/hooks/backups/user-prompt-submit-YYYY-MM-DD.sh` — never overwrite a backup
3. Apply the proposed changes exactly as written in the report
4. Re-run a quick syntax check (`bash -n user-prompt-submit.sh`)
5. Write an `improvement-log` entry appending to `learning/skill-feedback/signal-calibration.md` (or a dedicated `thalamus-improvement-log.md`) with: timestamp, calibration report filename, diff summary
6. Flag to the user that the change is live and to watch for regressions

If the syntax check fails, revert to backup and report the failure — never ship a broken hook.

### 8. Honest reporting

If the window had too few sessions or too few prompts to compute meaningful stats, say so plainly and recommend a re-run with a wider window. Do not invent precision/recall from 3 prompts.

If no material changes are warranted, say so. "Signal is calibrated — no changes recommended this cycle" is a valid and valuable report.

## What to avoid

- Do not apply changes silently. The thalamus is hot-path infrastructure; all changes are L2 (draft + queue for review) by default.
- Do not propose a keyword based on a single prompt. Two citations minimum.
- Do not rewrite the hook structure — only adjust keyword-to-category mappings. Structural hook changes belong in the plugin codebase, not calibration.
- Do not use this skill to change what a category activates. That is a design change, not calibration. Calibration only shifts which prompts route to which category.
- Do not mix calibration with consolidation. Consolidation processes content; calibration processes signal routing. Keep them in separate reports so they can be reviewed independently.
- Do not calibrate on transcripts that predate the current thalamus version. If the hook was changed in the last week, note which transcripts are pre-change and which post-change. Calibrate only on post-change data, or split the report.

## Integration with other skills

- `nightly-consolidation` runs first and archives transcripts. Calibration runs after, reading those archives.
- If calibration surfaces a pattern worth persisting (e.g., "Mondays the user prompts always start with retrospective language"), propose the user add it to `learning/patterns.md` via consolidation — do not edit `patterns.md` here.
- If the window reveals that a new skill was used frequently without any thalamus support, pair with `memory-search` and `reflect` to understand the skill's context before proposing a new category.
- Report `apply` actions to the user clearly in the next session start — they should know the signal router was updated.
