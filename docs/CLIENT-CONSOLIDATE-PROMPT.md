# Consolidate prompt — for client use

Paste the block below into Claude Code (from the brain root, i.e. the folder that contains `CLAUDE.md` and `MEMORY.md`). It triggers the AI-OS consolidation pipeline and sorts everything that has accumulated since the last run into the right brain regions.

The prompt is plugin-aware: it points at the canonical plugin folders (`memory/`, `learning/`, `knowledge/`, `routines/`, `system/`) — not the legacy region names.

---

```
Run a full AI-OS consolidation pass on this brain. Work strictly within the
current working directory, which is the brain root (it contains CLAUDE.md and
MEMORY.md). Use the plugin folder layout — memory/, learning/, knowledge/,
routines/, projects/, system/.

If a /nightly-consolidation skill is available in this session, invoke it and
follow its phases. If not, execute the equivalent process below.

## What I want you to do

1. Preflight
   - Confirm the brain root has CLAUDE.md, MEMORY.md, and a memory/ folder.
     If not, stop and tell me what's missing.
   - Make sure these folders exist (create silently if not):
     memory/short-term/, memory/short-term/archive/,
     memory/short-term/transcripts/, memory/decisions/,
     learning/, learning/skill-feedback/,
     knowledge/people/, knowledge/companies/.
   - Use today's date in YYYY-MM-DD as the run date.
   - If memory/short-term/consolidation-report-{today}.md already exists,
     append a new "Re-run at HH:MM" section instead of overwriting.

2. Gather (read, don't modify yet)
   - All .md files in memory/short-term/ from today, plus any older ones whose
     frontmatter is NOT marked status: consolidated.
   - Recent transcripts in memory/short-term/transcripts/ created today.
   - learning/patterns.md and learning/corrections.md (so you don't duplicate).
   - system/context/goals-metrics.md if it exists (for goal-alignment tagging).
   - Existing files under learning/skill-feedback/ (to see what's already pending).

3. Extract signals (per short-term file)
   Classify content into five types — a single file usually has several:
   - Decisions: a choice was made, a direction was set.
   - Corrections: something went wrong, took too long, was redirected.
   - Skill feedback: positive / negative / redirect / implicit reaction to a
     skill's output.
   - New entities: a person, company, or project that doesn't yet have a file
     under knowledge/people/, knowledge/companies/, or projects/.
   - Facts worth remembering: durable context that belongs in MEMORY.md
     (FLAG ONLY — do not auto-write to MEMORY.md).

   Apply a significance filter: drop trivial, transient, or already-captured
   items. When in doubt about durable value, keep it.

4. Route decisions → memory/decisions/
   - Normalize the claim into a hyphenated-lowercase filename
     (e.g. charge-for-discovery-calls.md). Filenames read as claims.
   - If a near-duplicate already exists and the new signal is consistent,
     update only the `updated:` field and note it in the report.
   - If it contradicts an existing decision, create a NEW file with
     `supersedes: [[old-claim]]` and set the old file's status: superseded
     and superseded_by: [[new-claim]]. Do not rewrite the old body.
   - New file frontmatter:
     ---
     type: decision
     tags: [tag-one, tag-two]
     related: [[Entity One]], [[Entity Two]]
     created: YYYY-MM-DD
     updated: YYYY-MM-DD
     status: active
     ---
   - Body sections: # Claim / ## Context / ## Decision / ## Reasoning /
     ## Implications / ## Source (which short-term file).

5. Route skill feedback → learning/skill-feedback/{skill}.md
   - Create the file if missing with frontmatter (type: skill-feedback,
     skill, usage_count, approval_rate, calibration_status: learning,
     last_improved, created, updated).
   - Append a dated entry under "## Feedback log":
     ### YYYY-MM-DD — positive|negative|redirect|implicit
     - Context: ...
     - Feedback: ...
     - Implication: ...
     - Status: pending
   - Update usage_count, approval_rate, updated.
   - DO NOT edit the SKILL.md in this step.

6. Apply skill improvements (conservative)
   For any feedback file with 3+ pending entries:
   - Find the actual SKILL.md and look for a consistent pattern across the
     pending entries.
   - Minor change (wording, clarification, adding a single bullet) → apply
     directly, mark contributing entries Status: applied, append an
     "## Improvement history" entry.
   - Significant change (logic, default behavior, output format, adding or
     removing a phase) → DRAFT the proposed edit in the report under "Skill
     improvements needing review", mark entries Status: queued, do NOT touch
     SKILL.md.
   - Update calibration_status: learning (0–4 uses or just edited),
     calibrated (5+ uses, ≥80% approval), graduated (10+ uses, ≥90%).
   - If feedback entries contradict each other, flag in the report and leave
     the skill untouched.

7. Log corrections + extract patterns
   - For each correction signal, append a dated entry to learning/corrections.md
     with: What happened / What should have happened / Why / Source / Status: unextracted.
   - Count unextracted corrections. If 5+ exist, group by theme; for each
     group of 2+, write a pattern to learning/patterns.md
     (When / Do / Because / Extracted from / First extracted) and mark
     contributing corrections Status: extracted. Never remove corrections.

8. Route new entities → knowledge/
   - Person → knowledge/people/{name-hyphenated}.md
   - Company → knowledge/companies/{name-hyphenated}.md
   - Project → flag for me; do not auto-create projects/{name}/.
   - Stub frontmatter (type, tags [], related [], created, updated,
     status: active, source).
   - Body: # Name / ## Context (one paragraph) / ## What we know /
     ## Open questions.
   - If the stub already exists, append a dated subsection — do not rewrite.

9. Light-touch graph hygiene
   - Add missing frontmatter to files YOU created this run.
   - In files you just wrote, convert plain-text entity references into
     [[wiki-links]] when a stub for that entity now exists.
   - Flag orphans (newly-created files with no inbound links and no related:)
     in the report. Don't touch pre-existing user files.

10. Archive processed short-term files
    - For each fully processed file: set frontmatter status: consolidated and
      consolidated: {today}, then MOVE it to memory/short-term/archive/
      (preserve filename, do not rename or rewrite the body).
    - Partially processed → leave in place with status: partial.
    - NEVER touch memory/short-term/transcripts/.

11. Write the report
    memory/short-term/consolidation-report-{today}.md with frontmatter
    (type: consolidation-report, date, status: complete) and sections,
    omitting any that have nothing to report:

    # Consolidation Report — {today}
    ## Summary (2–3 sentences)
    ## Decisions recorded
    ## Skill feedback logged
    ## Skill improvements (Applied automatically / Needing your review)
    ## Corrections logged (+ patterns extracted, if any)
    ## New entities
    ## Long-term memory candidates (MEMORY.md candidates — awaiting my OK)
    ## Contradictions and flags
    ## Files archived
    ## Graph hygiene
    ## What to look at tomorrow (up to 3 follow-ups)

## Hard rules

- NEVER write to MEMORY.md. Surface candidates in the report instead.
- NEVER delete user data. Archive (move) processed short-term files;
  supersede decisions, don't overwrite them.
- NEVER edit a SKILL.md without 3+ pending feedback entries. Significant
  edits require my review — flag, don't apply.
- Contradictions are SURFACED, not resolved. Let me decide.
- Idempotent: check for prior existence before writing any file. Running
  twice on the same day must not duplicate decisions, feedback entries,
  or entity stubs.
- If there is genuinely nothing to consolidate, write a one-line report
  noting that and exit.

When done, give me a short summary in chat: how many decisions were recorded,
how many skill-feedback entries logged, which (if any) skills you edited,
how many entities you created, and the top 1–3 things I should look at.
```

---

## How to use it

1. Open Claude Code in the brain root (the folder with `CLAUDE.md`).
2. Paste the block between the triple backticks above.
3. Approve any file-write permissions Claude asks for.
4. Read the summary, then open `memory/short-term/consolidation-report-{today}.md` for the full report.

## Shortcut (if the plugin is installed)

The plugin ships with a `nightly-consolidation` skill. From the brain root you can simply type:

```
/nightly-consolidation
```

— and Claude Code will run the same pipeline using the skill's own phases. The pasted prompt above is the fallback for when the skill isn't loaded (fresh install, different session, or running from a non-plugin checkout).
