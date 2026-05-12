# AI-OS Routines Pack — scheduled tasks for clients

A drop-in set of scheduled tasks for anyone who installs the AI-OS plugin. Each block below is a **self-contained prompt** designed to be pasted into a Claude Code scheduled task (the `scheduled-tasks` MCP, or `/schedule` skill).

Every prompt is plugin-aware: it uses the canonical plugin layout (`memory/`, `learning/`, `knowledge/`, `routines/`, `projects/`, `system/`) and assumes Claude Code is launched in the brain root (the folder containing `CLAUDE.md` and `MEMORY.md`).

Scheduled tasks run with no chat history. Each prompt is therefore **self-briefing** — it states the goal, the folders to use, the rules, and the deliverable.

---

## How to install these as scheduled tasks

1. Open Claude Code from the brain root.
2. Type `/schedule` (or use the `scheduled-tasks` MCP).
3. For each routine below, create a task with the cron schedule shown and paste the prompt block (everything between the triple backticks) as the task prompt.
4. Make sure your machine is awake at the scheduled times (macOS: `pmset` / wake schedule, or use a cloud-runner).

Suggested order of nightly chain (each kicks off ~30 min after the previous so they don't collide):

| Time | Routine | Purpose |
|---|---|---|
| 02:00 | nightly-consolidation | Process the day's short-term memory |
| 02:30 | behavioral-learning | Infer how you actually work |
| 03:00 | signal-calibration | Tune the activation hints |
| 03:30 | nightly-goal-pursuit | Advance one goal while you sleep |
| 06:30 | auto-outreach-queue | Draft today's follow-up messages |
| 07:00 | morning-briefing | Summary of inbox + calendar + flags |
| Mon 07:30 | weekly-foresight | Ranked priorities for the week |
| Sun 18:00 | weekly-retrospective | Reflect on the week that ended |

---

## 1. Nightly Consolidation — daily 02:00

Cron: `0 2 * * *`

```
Run a full AI-OS consolidation pass. Work strictly within the current working
directory, which is the brain root (it contains CLAUDE.md and MEMORY.md).
Use the plugin folder layout: memory/, learning/, knowledge/, routines/,
projects/, system/.

If a /nightly-consolidation skill is available, invoke it. Otherwise execute
the equivalent process below.

PHASES

0. Preflight
   - Confirm CLAUDE.md and MEMORY.md exist. If not, stop and report.
   - Ensure these folders exist (create silently if missing):
     memory/short-term/, memory/short-term/archive/,
     memory/short-term/transcripts/, memory/decisions/,
     learning/, learning/skill-feedback/,
     knowledge/people/, knowledge/companies/.
   - Run date = today in YYYY-MM-DD.
   - If memory/short-term/consolidation-report-{today}.md exists, append a
     "Re-run at HH:MM" section; do not overwrite.

1. Gather (read-only)
   - All .md in memory/short-term/ from today, plus any older files whose
     frontmatter is NOT status: consolidated.
   - Today's transcripts in memory/short-term/transcripts/.
   - learning/patterns.md, learning/corrections.md.
   - system/context/goals-metrics.md if it exists.
   - Existing learning/skill-feedback/*.md.

2. Extract signals (per short-term file)
   Five types: decisions, corrections, skill feedback, new entities, facts
   worth remembering. Drop trivial or already-captured items. Flag MEMORY.md
   candidates — do NOT auto-write to MEMORY.md.

3. Route decisions → memory/decisions/
   - Filename = hyphenated lowercase claim (e.g. charge-for-discovery-calls.md).
   - Near-duplicate + consistent → update only `updated:` and note in report.
   - Contradicts existing → create new file with supersedes: [[old-claim]];
     mark old file status: superseded, superseded_by: [[new-claim]].
   - New file frontmatter: type: decision, tags, related, created, updated,
     status: active.
   - Body: # Claim / ## Context / ## Decision / ## Reasoning /
     ## Implications / ## Source.

4. Route skill feedback → learning/skill-feedback/{skill}.md
   - Create file if missing with frontmatter (type: skill-feedback, skill,
     usage_count, approval_rate, calibration_status: learning, last_improved,
     created, updated).
   - Append dated entry under ## Feedback log:
       ### YYYY-MM-DD — positive|negative|redirect|implicit
       - Context: ...
       - Feedback: ...
       - Implication: ...
       - Status: pending
   - Update counters. DO NOT edit SKILL.md here.

5. Apply skill improvements (conservative)
   For each feedback file with 3+ pending entries:
   - Minor change (wording, clarification, one bullet) → apply directly,
     mark contributing entries Status: applied, append ## Improvement history.
   - Significant change (logic, defaults, output format, phases) → DRAFT
     in the report under "Skill improvements needing review", mark entries
     Status: queued, do not touch SKILL.md.
   - Update calibration_status: learning (0–4 or just edited) /
     calibrated (5+ uses, ≥80%) / graduated (10+ uses, ≥90%).
   - Contradicting entries → flag, leave skill alone.

6. Log corrections + extract patterns
   - Append each correction to learning/corrections.md with: What happened /
     What should have happened / Why / Source / Status: unextracted.
   - If 5+ unextracted exist, group by theme; for each group of 2+ write a
     pattern to learning/patterns.md (When / Do / Because / Extracted from /
     First extracted) and mark contributing corrections Status: extracted.

7. Route new entities → knowledge/
   - Person → knowledge/people/{name}.md
   - Company → knowledge/companies/{name}.md
   - Project → flag, don't auto-create projects/{name}/
   - Stub: frontmatter (type, tags, related, created, updated, status,
     source) + body sections # Name / ## Context / ## What we know /
     ## Open questions.
   - Existing stub → append a dated subsection, do not rewrite.

8. Light graph hygiene
   - Add missing frontmatter to files YOU created.
   - In files you just wrote, convert plain-text entity refs to [[wiki-links]]
     when a stub now exists.
   - Flag orphans in the report. Do not touch pre-existing user files.

9. Archive processed short-term files
   - Fully processed → set status: consolidated + consolidated: {today},
     MOVE to memory/short-term/archive/ (preserve filename).
   - Partial → leave in place with status: partial.
   - NEVER touch memory/short-term/transcripts/.

10. Write the report
    memory/short-term/consolidation-report-{today}.md with frontmatter
    (type: consolidation-report, date, status: complete) and these
    sections — omit any with nothing to report:
      # Consolidation Report — {today}
      ## Summary (2–3 sentences)
      ## Decisions recorded
      ## Skill feedback logged
      ## Skill improvements (Applied / Needing your review)
      ## Corrections logged
      ## New entities
      ## Long-term memory candidates
      ## Contradictions and flags
      ## Files archived
      ## Graph hygiene
      ## What to look at tomorrow (≤3)

HARD RULES
- NEVER write to MEMORY.md. Surface candidates only.
- NEVER delete user data. Archive, supersede — don't overwrite.
- NEVER edit SKILL.md without 3+ pending entries. Significant edits are
  flagged, not applied.
- Idempotent: check existence before writing. Running twice the same day
  must not duplicate files or entries.
- Contradictions are surfaced, not resolved.
- If there is nothing meaningful to consolidate, write a one-line report
  and exit.
```

---

## 2. Behavioral Learning — daily 02:30

Cron: `30 2 * * *`

```
Run the behavioral-learning routine. Goal: infer how the user actually
works from yesterday's transcripts and ledgers, and write inferred patterns
to learning/behavioral-patterns.md.

Working directory = brain root. Plugin layout (memory/, learning/, etc.).

If a /behavioral-learning skill is available, invoke it. Otherwise:

1. Read inputs
   - memory/short-term/transcripts/ — yesterday's archived transcripts.
   - memory/short-term/autonomous-runs.jsonl if it exists.
   - learning/behavioral-patterns.md (so you don't duplicate).
   - learning/patterns.md (for context — these are user-curated; behavioral
     ones are inferred).

2. Look for stable signals across multiple sessions
   - Time-of-day work habits (when the user writes, decides, ignores).
   - Tool/skill preferences (which slash commands get used, which are
     skipped or corrected).
   - Voice tells (sentence length, openings, words the user accepts vs edits
     out of drafts).
   - Decision tempo (how long between question and answer; what triggers
     a "later").
   - Failure modes (what gets re-asked, what gets manually overridden).

3. Write inferred patterns
   Append to learning/behavioral-patterns.md (create if missing) under
   ## Inferred patterns:
     ### {pattern name}
     - Observed in: {N sessions over {window}}
     - Signal: {what was observed}
     - Inference: {what this suggests about how the user works}
     - Confidence: low | medium | high
     - First observed: YYYY-MM-DD

   Only write a pattern with 3+ supporting sessions. Below that, leave it
   alone until another night provides more signal.

4. Cross-check
   - If an inferred pattern contradicts a user-written pattern in
     learning/patterns.md, FLAG it in the report under "Inferences vs
     user-stated rules" — do not resolve.

5. Append a one-line summary to memory/short-term/consolidation-report-{today}.md
   under "## Behavioral inferences" (create the section if missing).

HARD RULES
- Behavioral patterns are inferences, not facts. Mark confidence honestly.
- Never demote a user-stated pattern; only flag conflicts.
- Append-only; never delete prior behavioral patterns. If one is
  superseded, write a new one with supersedes: <name>.
```

---

## 3. Signal Calibration — daily 03:00

Cron: `0 3 * * *`

```
Run signal-calibration. Goal: improve the activation-hint mapping used by
the session-start hook (or any pre-prompt activator) by comparing what was
HINTED vs what actually MATTERED in each session.

Working directory = brain root. Plugin layout.

If a /signal-calibration skill is available, invoke it. Otherwise:

1. Locate the activation/keyword config
   Likely paths: system/activation.md, system/thalamus.md,
   .claude/hooks/user-prompt-submit.* (read-only here), or
   learning/activation-keywords.md. If none exists, write a starter file at
   learning/activation-keywords.md with empty maps and stop after Step 2.

2. Sample yesterday's transcripts (memory/short-term/transcripts/)
   For each transcript:
   - What did the prompt look like? Extract the user's opening message.
   - What was actually loaded / what files did Claude read?
   - What turned out to matter (entities referenced, decisions touched,
     errors logged)?

3. Score hits and misses
   - HIT: a keyword pattern existed and Claude correctly activated the
     right region.
   - MISS: an entity / region was clearly relevant but no activation hint
     fired.
   - FALSE POSITIVE: an activation fired but the loaded region was unused.

4. Propose changes
   Append to learning/calibration-log.md (create if missing):
     ## YYYY-MM-DD calibration
     - Hits: N
     - Misses: M  (list each: keyword that should have fired -> region)
     - False positives: K (list each: pattern -> never used)
     - Proposed mapping edits:
       + add: "domain expert", "expert recruit" -> knowledge/people/
       + remove: "today" -> too noisy
       + tighten: "meeting" -> meetings/ only when paired with date

5. Apply minor edits automatically
   - Adding a new keyword (with 2+ supporting misses) → add to the config.
   - Removing a noisy keyword (with 3+ false positives) → remove from config.
   - Renaming, restructuring, or changing the activator's logic → FLAG only.

6. Append a one-line summary to memory/short-term/consolidation-report-{today}.md
   under "## Signal calibration".

HARD RULES
- Only auto-edit the keyword map. Never edit hook scripts.
- A keyword needs 2+ supporting misses to be auto-added.
- A removal needs 3+ false positives.
- Significant restructuring is flagged for the user, not applied.
```

---

## 4. Nightly Goal Pursuit — daily 03:30

Cron: `30 3 * * *`

```
Advance ONE long-term goal while the user sleeps. Produce a single
morning-delivery file with concrete outputs, not a status update.

Working directory = brain root. Plugin layout.

If a /nightly-goal-pursuit skill is available, invoke it. Otherwise:

1. Pick the goal
   - Read system/context/goals-metrics.md (or system/context/goals.md).
   - Pick the goal that meets the most of: (a) has a stalled next step,
     (b) hasn't seen activity in 7+ days, (c) is highest priority right
     now, (d) has a concrete unblockable task you can actually do solo.
   - If no goals file exists, stop and write a one-line note to
     memory/short-term/.

2. Do real preparatory work (not summaries)
   Pick one or two of these depending on the goal type:
   - Research → produce a tight brief (sources, contradictions, the
     question still open).
   - Outreach → draft 3–10 personalized messages, each citing real prior
     context (pull from knowledge/people/, memory/decisions/).
   - List-building → assemble a clean list with the columns the user
     will actually use; cite where each entry came from.
   - Writing → produce a draft (post, doc, email) ready to edit, not a
     skeleton.
   - Decision prep → lay out the choice, the criteria, the evidence on
     each side, your recommendation, the single thing you'd want to know
     before committing.

3. Write the morning-delivery file
   memory/short-term/morning-delivery-{today}.md with frontmatter
   (type: morning-delivery, date, goal: <name>, status: ready) and
   sections:
     # Morning Delivery — {today}
     ## Headline (1 paragraph — what you did and why now)
     ## Outputs (3–10 items ready to review, each link or block)
     ## First move when you wake up (ONE sentence — what to do first)
     ## What I left untouched (and why — so the user knows what's still open)

4. Reference, don't duplicate. Link to files you produced; don't paste
   their full content into the delivery file.

HARD RULES
- Do real work. A status update is not a delivery.
- Never send anything externally. Draft only.
- Cite real context from the brain. Don't fabricate prior conversations
  or relationships.
- If you genuinely cannot make progress, write one paragraph explaining
  what's blocking and what info would unblock it.
```

---

## 5. Auto-Outreach Queue — daily 06:30

Cron: `30 6 * * *`

```
Draft a queue of personalized follow-up messages for people in
knowledge/people/ who are overdue, have open commitments, or are relevant
to an active goal. NOTHING IS SENT.

Working directory = brain root. Plugin layout.

If a /auto-outreach-queue skill is available, invoke it. Otherwise:

1. Build the candidate list
   For each file in knowledge/people/:
   - Read frontmatter and body.
   - Score against:
     - Days since last interaction (frontmatter last_contact or grep
       through memory/decisions/ and memory/short-term/archive/)
     - Open commitments (look for "I'll send", "I owe", "promised",
       "will follow up", "pending" in their file)
     - Goal relevance (does this person tie to any goal in
       system/context/goals-metrics.md?)
   - Keep the top 3–10 candidates. Drop anyone marked status: dormant or
     do_not_contact: true.

2. For each candidate, draft a message
   - Channel inferred from their file (email, LinkedIn, WhatsApp, etc.).
     If unclear, default to email.
   - Voice matches voice/brand-guidelines.md and any voice/voice.md or
     learning/behavioral-patterns.md voice tells.
   - Cite real prior context. Reference the specific thread, decision,
     or commitment. No vague "checking in" messages.
   - Length scales with relationship: short for warm, slightly more
     context for cold.

3. Write the queue file
   memory/short-term/outreach-queue-{today}.md with frontmatter
   (type: outreach-queue, date, status: pending) and one section per
   draft:
     ## {Person name} — {channel}
     **Why now:** {one sentence — the trigger}
     **Last context:** {one sentence, with [[wiki-link]] to the source}
     **Draft:**
     > {the actual message}
     **Approve / edit / discard:** [ ]

HARD RULES
- NEVER send. The queue is for morning review only.
- No generic "checking in" / "circling back" / "hope you're well". Each
  message must reference real prior context.
- If you can't find a real reason to reach out, leave that person out.
  A short, honest queue beats a padded one.
- Voice MUST match the user's brand. Read voice/brand-guidelines.md
  before drafting.
```

---

## 6. Morning Briefing — daily 07:00

Cron: `0 7 * * *`

```
Produce the morning briefing: a short, scannable summary of what needs
attention today.

Working directory = brain root. Plugin layout.

If a /morning-briefing skill is available, invoke it. Otherwise:

1. Sense
   - Email (Gmail MCP / Outlook MCP / whatever is connected): last 24h.
     Categorize: urgent, respond today, flag, low priority, skip.
   - Calendar (today's events: time, who, where, what to prep).
   - WhatsApp / Slack / Telegram (last 24h, only key contacts).
   - Open queues:
     - memory/short-term/outreach-queue-{today}.md (if exists)
     - memory/short-term/morning-delivery-{today}.md (if exists)
     - memory/short-term/consolidation-report-{today}.md
   - Risks: scan risks.md for anything that pattern-matches today's items.

2. Filter aggressively
   "Don't relay — analyze." Subject lines are not a summary. Read the
   actual content of anything you flag and write the briefing in your
   own words.

3. Write the briefing
   memory/short-term/morning-briefing-{today}.md with frontmatter
   (type: briefing, date, status: ready) and sections — omit empty:
     # Morning Briefing — {today}
     ## Top of mind (≤3 things the user must see first)
     ## Calendar today (one line per event with prep note if needed)
     ## Inbox needs decisions (≤5 emails — who, what, suggested next step)
     ## Open queues (outreach drafts, morning delivery, consolidation
        follow-ups)
     ## Risks / flags (anything from risks.md that fires on today's items)
     ## Quiet things you can ignore (one line — "X newsletters, Y promo,
        all skippable")

4. Length target: under 250 words. If you're over, you're relaying not
   analyzing.

HARD RULES
- No subject-line copy-paste. Analyze and rewrite.
- High-priority items get enough context to decide without opening the
  source. Low-priority gets one line.
- Suggested next steps must be concrete and one sentence. No "consider
  responding when convenient".
- If there is genuinely nothing urgent, say so in one line and stop.
```

---

## 7. Weekly Foresight — Monday 07:30

Cron: `30 7 * * 1`

```
Produce ranked priorities for the week ahead, grounded in goals,
decisions, patterns, and active calendar/pipeline signals.

Working directory = brain root. Plugin layout.

If a /foresight skill is available, invoke it. Otherwise:

1. Read
   - system/context/goals-metrics.md
   - memory/decisions/ (last 14 days)
   - learning/patterns.md
   - learning/behavioral-patterns.md (if exists)
   - This week's calendar (next 7 days)
   - Open projects in projects/* — for each, read CLAUDE.md and MEMORY.md
   - Last week's retrospective if it exists
     (memory/short-term/archive/weekly-retro-*.md)

2. For each active goal, ask
   - What concrete thing can move it this week?
   - What's the next single unblockable step?
   - What's the cost (hours, calendar slots, dependencies)?

3. Rank 3–7 priorities for the week
   - Each priority cites the goal it serves.
   - Each priority has a "first move" (the concrete action to start with).
   - Each priority has an estimated cost (e.g. "2h", "one meeting + 1h
     drafting").
   - At most one "stretch" priority.
   - Surface ONE thing to DROP — what got into last week's plan but
     shouldn't carry forward.

4. Write the foresight file
   memory/short-term/foresight-week-{ISO-week}.md with frontmatter
   (type: foresight, week, generated: YYYY-MM-DD, status: ready) and
   sections:
     # Week {ISO-week} Foresight
     ## Picture of the week (2 sentences)
     ## Ranked priorities (3–7, with goal / first move / cost)
     ## Drop this (one item)
     ## Watch list (≤3 things that don't need action yet but could shift)
     ## Calendar pressure points (meetings that need real prep)

HARD RULES
- Priorities are concrete. "Make progress on consulting" is not a
  priority. "Send the Q2 audit proposal to [[Acme]] by Wed" is.
- If a goal hasn't moved in 14+ days, flag it explicitly.
- Don't reuse last week's priorities unchanged. If something carried
  over, say so and explain why.
```

---

## 8. Weekly Retrospective — Sunday 18:00

Cron: `0 18 * * 0`

```
Reflect on the week that just ended. Per-goal progress check, patterns
observed, course corrections.

Working directory = brain root. Plugin layout.

If a /reflect skill is available, invoke it. Otherwise:

1. Read
   - system/context/goals-metrics.md
   - This week's consolidation reports
     (memory/short-term/consolidation-report-*.md from the past 7 days,
     plus any in memory/short-term/archive/)
   - memory/decisions/ added this week
   - learning/corrections.md entries added this week
   - This week's foresight (memory/short-term/foresight-week-{ISO}.md)

2. Per-goal progress check
   For each goal in goals-metrics.md:
   - What moved? Cite specific decisions, deliveries, or interactions.
   - What stalled?
   - What looks at risk?

3. Patterns observed this week
   - Recurring corrections (look for ≥2 corrections sharing a theme).
   - Behavioral tells (energy, focus, time-of-day quality).
   - Tool/skill performance (any skill consistently helping or hurting).

4. Course corrections
   - One thing to start.
   - One thing to stop.
   - One thing to keep doing.

5. Write the retrospective
   memory/short-term/weekly-retro-{ISO-week}.md with frontmatter
   (type: retrospective, week, status: ready) and sections:
     # Week {ISO-week} Retrospective
     ## Headline (2 sentences — the shape of the week)
     ## Per-goal progress
     ## Patterns observed
     ## Course corrections (start / stop / keep)
     ## Carry forward into next week (≤3 items)

HARD RULES
- Cite specifics. "Lots of progress on consulting" is not a finding.
  "Two signed proposals, one delayed payment from [[Acme]]" is.
- Don't sugarcoat. If a goal didn't move, say so plainly.
- The retrospective feeds next Monday's foresight — keep "carry forward"
  short and concrete so the next routine can pick it up.
```

---

## Universal rules baked into every prompt above

- Always operate from the **brain root** (the folder with `CLAUDE.md`).
- Never write to `MEMORY.md` — only surface candidates.
- Never delete user data — archive, supersede, append.
- Every routine that produces output writes a file under `memory/short-term/`. The next nightly consolidation will archive or route it.
- Contradictions get flagged, not resolved.
- Every file written includes proper frontmatter (`type`, `tags`, `related`, `created`, `updated`, `status`).
- Entity references use `[[wiki-links]]` so the Obsidian graph stays connected.

## After installing the pack

Within a few days of running, the brain will start to fill up: `learning/patterns.md` grows, `knowledge/people/` and `knowledge/companies/` collect stubs, `memory/decisions/` becomes a real episodic record, and the nightly chain starts visibly improving skill behavior. That's the whole point — the system gets sharper with use.
