# Skills catalog

AI-OS ships with a curated set of skills that know how to use the brain. Skills are named behaviors Claude can invoke — they read specific regions, do specific work, and write specific outputs. Each skill has a feedback file in `learning/skill-feedback/` and improves over time.

This document catalogs the skills that ship in the box.

---

## Core skills

### `memory-search`

Search the AI-OS brain for relevant files, entities, and knowledge before starting work. Invoked automatically when a session begins on a new topic, or manually when you need context about a person, company, decision, project, or concept. Reads across `knowledge/`, `memory/decisions/`, `projects/`, and surfaces the five to ten most relevant files with a one-line summary each. This is the first skill most sessions touch.

### `decision-check`

Search prior decisions on a topic before making a new one. Invoked when a session is about to commit to a direction on something the brain might have prior context on. Reads `memory/decisions/` and `learning/patterns.md`, surfaces contradictions or supporting precedent, and flags them before the new decision lands. Prevents the system from quietly disagreeing with itself.

### `aios-start`

One-shot install and setup. Invoked once per machine, right after the plugin is added. Creates the brain scaffold at `~/AI-OS/` (or a custom path), personalizes `CLAUDE.md` via a brief interview, optionally wires `~/.claude/CLAUDE.md` with a brain-stem pointer, and verifies the hooks are registered. Leaves the user with a working brain and a pointer to the dashboard.

---

## Daily and weekly rhythm

### `morning-briefing`

Daily morning briefing. Scans Gmail, calendar, and any configured task sources, then produces a prioritized summary of what needs attention today. Reads `system/context/goals-metrics.md` to weight priorities. Output can be delivered in-session, to a local file, or to a messaging channel you configure. The skill calibrates to your rhythm over time — what surfaces as "priority" shifts based on what you actually act on.

### `email-triage`

Daily email triage. Categorizes inbox into action tiers, drafts priority replies, and flags anything that needs escalation. Reads `knowledge/people/` to add relationship context to incoming mail. Drafts are queued for review, not sent. Calibrates on what you actually send versus what you rewrite.

### `meeting-prep`

Prepare a meeting brief by activating `knowledge/people/`, `knowledge/companies/`, and relevant `memory/decisions/`. Invoked before any meeting. Produces: last interaction summary, open commitments, relevant prior decisions, suggested agenda or opening. The goal is that you walk into every conversation having pre-loaded the full relationship context.

### `relationship-check`

Check the status of a single relationship. Last contact, open commitments, interaction cadence, suggested next action. Invoked on demand when you realize you haven't thought about someone in a while or want to know where you left things. Reads `knowledge/people/<name>.md` and correlates with recent messaging and calendar data.

### `project-status`

Quick status check on any active project. Progress, blockers, days since last activity, next actions. Reads `projects/<project>/MEMORY.md` and surfaces anything that's gone stale. Invoked on demand or at the start of a session on the project.

---

## Content and communication

### `brain-dump-content`

Process a brain dump into structured content drafts. You talk or type freely into the session. The skill extracts ideas, clusters them, does light research to validate or complicate each, and drafts posts in your configured voice. Reads `voice/` for tone and style. Calibrates on what you publish versus what you discard.

### `content-interview`

Structured interview to extract great content. Claude asks a sequence of questions designed to surface the specific, concrete material that makes a post worth reading. You answer. The skill turns the transcript into drafts. Best used when you know you have something to say but can't quite articulate it cold.

---

## Reflection and foresight

### `reflect`

On-demand reflection. A goal-by-goal progress check against `system/context/goals-metrics.md`, correlated with recent decisions, corrections, and short-term memory. Surfaces patterns in what you've actually spent time on and how it aligns (or doesn't) with what you said mattered. Ends with a short set of strategic course-corrections.

### `foresight`

Forward-looking strategic planning. Ranked priorities for the week ahead based on goals, calendar, pipeline, and recent patterns. Invoked when planning, feeling scattered, or at the start of the week. Distinct from `morning-briefing` — foresight is strategic, not tactical.

---

## System self-improvement

### `nightly-consolidation`

The brain processing its own day. Reads archived transcripts from `memory/short-term/transcripts/`, extracts feedback signals the session may have missed, routes them to the right `learning/skill-feedback/<skill>.md`, and when 3+ pending entries accumulate on a skill, edits the skill itself. Also extracts patterns from corrections, clears processed short-term files, and updates vital signs. Run nightly on a schedule.

### `signal-calibration`

Nightly self-improvement for the signal detector — the mechanism that decides what's important enough to surface into a session's context. Compares what the thalamus flagged versus what actually mattered, identifies misses, and proposes pattern improvements. Meta-level: this skill improves how the system decides what to improve.

---

## Skill calibration

Every skill has a file at `learning/skill-feedback/<skill-name>.md` with frontmatter tracking:

- `usage_count` — how often the skill has been invoked
- `approval_rate` — how often the output was accepted without edit
- `calibration_status` — `learning`, `calibrated`, or `graduated`
- `last_improved` — date of the most recent edit to the skill

A new skill starts in `learning` status. After ten or more uses with a stable approval rate above 70%, it moves to `calibrated`. Once it reaches 90%+ sustained approval, it's `graduated` — still improvable, but trusted enough to run without review.

Skills improve by having their SKILL.md edited during nightly consolidation, using the accumulated feedback as the edit prompt. Minor adjustments happen automatically. Significant changes are flagged for review before they ship.

This is the loop that makes AI-OS compound: every use of a skill is training data for the next use.
