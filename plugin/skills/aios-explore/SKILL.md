---
name: aios-explore
description: Show the user every skill AI-OS has installed, grouped by purpose, with one-line descriptions and when to use each. Use this any time the user asks "what can this do", "what commands are there", or "help" — and at the end of /aios-init to orient a fresh install.
---

# AI-OS Explore

Your job is to show the user a clean, complete menu of every AI-OS skill available to them right now — not a generic list, but a *personalized* one that reflects what is actually installed in their current session.

## How to respond

Do not ask questions. Do not narrate what you're about to do. Output one clean block, styled like a well-designed help page. Keep it scannable.

### Structure

Open with one short line that orients the user. Then four sections, in this order:

1. **Every day** — the skills most people reach for
2. **Deep work** — strategic and reflective skills
3. **Autonomous** — skills that run on their own or prepare outputs while the user is away
4. **System** — meta-skills for managing AI-OS itself

Close with one line pointing to the brain folder.

### Content

Only list skills that are actually installed. Check `.claude/aios.config.json` for `installed_skills`, and skip anything the user doesn't have (e.g. `meeting-prep` is absent if they never connected GCal). If no config exists, list the canonical set below.

Use this canonical grouping and copy:

**Every day**
- `/memory-search` — pull context from the brain before you start. Use when you want Claude to know the backstory.
- `/reflect` — an honest, goal-by-goal progress check. Use when you feel scattered or at the end of a week.
- `/foresight` — 3–7 ranked priorities for the window ahead. Use when planning a new week or recovering focus.
- `/project-status` — decision-grade read on one project: cadence, state, next action. Use before status meetings or when something feels stuck.
- `/decision-check` — search prior decisions before making a new one. Use to prevent contradictions.
- `/relationship-check` *(if installed)* — last contact, open commitments, next move on one person.
- `/meeting-prep` *(if installed)* — one-screen brief for a calendar event.

**Deep work**
- `/brain-dump-content` *(if installed)* — turn raw thoughts into structured content.
- `/content-interview` *(if installed)* — Claude asks, you answer, a draft gets made.

**Autonomous**
- `/nightly-consolidation` — process short-term memory, extract patterns, improve skills. Runs nightly if you install the scheduler.
- `/nightly-goal-pursuit` — advance one long-term goal overnight. Writes a morning-delivery file to act on at wake-up.
- `/behavioral-learning` — extract behavioral patterns from archived transcripts. The brain watching how you actually work.
- `/auto-outreach-queue` — draft personalized follow-ups for people in your brain. Nothing is sent without your approval.
- `/signal-calibration` — tune the signal detector that routes context into sessions.

**System**
- `/aios-init` — already run. Refuses to re-run (won't overwrite your brain).
- `/aios-update` *(if available)* — non-destructive update of skills and hooks.
- `/aios-explore` — this menu.
- `/forge-skill <mcp>` — auto-generate intent-wrapped skills from a connected MCP. Run this whenever you connect a new MCP (Gmail, Notion, Linear, etc.) and the brain will propose 3–5 skills tuned to how you work.

### Output rules

- One line per skill. Slash command first, em-dash, then the purpose.
- Do not explain the brain model.
- Do not list skills the user doesn't have.
- Do not list integrations that are not connected.
- Do not add a "Getting started" section — that's what `/aios-init` was for.
- Keep the whole output under ~35 lines.

### Close with

One line:

> Everything lives in this folder. Edit it by hand or ask Claude to edit it for you — the brain updates itself either way.

Stop there. Do not ask what to do next.

### Tick setup-progress

After rendering the menu, silently tick the first-use checkbox so `/aios-help status` reflects that the user has now seen the skill catalogue:

```bash
bash $CLAUDE_PROJECT_DIR/system/scripts/tick-progress.sh "First-use validation" "aios-explore" "aios-explore"
```

Idempotent — safe to re-run on every invocation. If `system/setup-progress.md` doesn't exist (legacy install), the script exits silently.
