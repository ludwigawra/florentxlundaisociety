---
name: meeting-prep
description: Produce a focused brief for an upcoming meeting — who the attendees are, why this meeting exists, what was agreed last time, what is still open, and the one outcome that makes this meeting worth having. Pulls meeting metadata from Google Calendar, attendee context from SENSORY-CORTEX/people/ and /companies/, and open threads from HIPPOCAMPUS/decisions/ + MOTOR-CORTEX. Use when a meeting is coming up (next 60 minutes, today, or tomorrow) and you want to walk in prepared without rereading history.
---

# Meeting Prep

Walk in ready. The brief should be short enough to read in 90 seconds and specific enough that the first 2 minutes of the meeting aren't wasted rebuilding context. If the brief is longer than a screen, it has failed the reader.

The AI-OS root is at `~/Desktop/AI-OS/` by default. If the user has configured a different root (check the plugin config or a root-level `CLAUDE.md` marker), use that path instead.

**Requires:** Google Calendar MCP (the `gcal` integration). If `gcal` was not enabled in `aios.config.json`, this skill should not have been installed — stop and suggest the user run `/aios-update` with gcal enabled.

## When to use

Invoke this skill whenever any of the following apply:

- The user is about to walk into a meeting in the next 60 minutes
- The user asks "prep me for this call" or names an upcoming meeting explicitly
- Morning briefing surfaced a meeting and the user wants deeper prep
- A calendar event has attendees the user hasn't talked with recently and they want the relationship context
- Before a high-stakes conversation (investor, customer, hire, partner)

Do not invoke for back-to-back internal syncs where no brief adds value. A brief that says "weekly team sync, no new decisions, no new commitments" is noise.

## Inputs

The caller may provide:

- **Event** — the calendar event to prep for. If unspecified, default to the next upcoming meeting in the user's calendar.
- **Window** — how far back to mine for context (default: last 90 days)
- **Depth** — `brief` (default, one screen), `full` (add attendee deep-dives and document appendix)
- **Goal** — an optional explicit goal the user has for the meeting. Overrides the derived "desired outcome" if provided.

If no upcoming meeting is found, list the next 3 calendar items and ask which to prep for. If there are no upcoming meetings in the window, say so plainly.

## Process

### 1. Fetch the event

Use the GCal MCP (`list_events` or `get_event`) to pull:

- Title, start/end, location or conference link, duration
- Description and agenda notes if present
- Attendees (name, email, response status)
- Organizer
- Recurrence info (is this a recurring meeting? what's the series context?)

If the event is a recurring meeting, also fetch the previous occurrence. The last conversation is usually the best anchor for the next one.

### 2. Identify the attendees

For each attendee that is not the user:

1. Match against `SENSORY-CORTEX/people/` by email alias, name, or aliases frontmatter field
2. If no match, search the brain broadly for mentions (decisions, short-term, corrections)
3. If still nothing, mark them as `unknown` — do not fabricate context

For each matched person, pull the same information `relationship-check` would: status, last contact, open commitments, recent topics. Keep it compact — one line per person in the brief unless `depth=full`.

### 3. Identify the company context

If attendees share a company (from their `company` frontmatter field), load `SENSORY-CORTEX/companies/{slug}.md`. The company context often carries as much weight as the person context — especially for external meetings.

If the meeting references a specific project, product, or deal, identify it and load the relevant `MOTOR-CORTEX/{project}/` files.

### 4. Pull open threads

Search for open threads involving the attendees or the named topic:

1. `HIPPOCAMPUS/decisions/` — decisions related to any attendee or topic, especially ones marked `status: pending` or touched recently
2. `MOTOR-CORTEX/*/MEMORY.md` — if the meeting is about a project, read the project memory for current state
3. Previous meetings with these attendees — use GCal to search past events and pull notes from matching `HIPPOCAMPUS/short-term/` files if references exist
4. Gmail (if the `gmail` integration is enabled) — most recent 3 threads with attendees, surface unresolved threads

### 5. Derive the purpose and desired outcome

From the event title, description, agenda, and the open threads, derive:

- **Why this meeting exists** — one sentence. Not the title verbatim — the reason this is on the calendar this week.
- **Desired outcome** — one sentence. What has to be true at the end of the meeting for it to have been worth having. If the user supplied `goal`, use that and skip derivation.
- **What would waste the time** — one sentence. The anti-outcome: if the conversation drifts here, redirect.

If the purpose isn't derivable from the available context, say so. A meeting with no inferable purpose is a flag — propose that the user ask the organizer before the meeting.

### 6. Identify your asks and their asks

- **What you want from them** — specific asks, decisions, or commitments you plan to surface
- **What they likely want from you** — same, from the other side, based on their recent threads

Be concrete. "Alignment on pricing" is not an ask. "Approval of the 3-tier structure with Pro at $49" is.

### 7. Surface risk flags

Look for anything that should give pause:

- An attendee has `do-not-contact` status — stop, something is off with the invite
- An attendee's last contact ended on a correction or a hard conversation
- A prior commitment from you is past due
- A prior commitment from them is past due, and the meeting is where it would normally land — expect the follow-up
- A decision documented in `HIPPOCAMPUS/decisions/` contradicts something the meeting might land

If no risks, write "none flagged" — do not pad.

### 8. Produce the brief

Use this structure. Target: one screen, 250-400 words total.

```
# {event title} — {date, time}

## Why this meeting
<one sentence on the actual reason>

## Desired outcome
<one sentence on what makes it worth having>

## Attendees
<one compact line per attendee: name, role @ company, relationship framing, freshness>

## State of the world
<3-5 bullets: what was agreed last time, what's changed since, what's pending>

## Your asks
<bullets — specific>

## Likely their asks
<bullets — specific, or "none obvious">

## Risk flags
<bullets or "none flagged">

## What would waste the time
<one sentence>

## Sources
<compact list: calendar event, person files, decisions, project, gmail threads if any>
```

### 9. Offer to save

Offer to save the brief to `HIPPOCAMPUS/short-term/meeting-prep-YYYY-MM-DD-{slug}.md` with frontmatter:

```yaml
---
type: meeting-prep
event: {event title}
attendees: [{names}]
created: YYYY-MM-DDTHH:MM:SSZ
tags: [meeting-prep, prep]
---
```

This gives `nightly-brain-consolidation` material to learn from — the patterns of what you actually got versus what you prepped for.

### 10. Post-meeting follow-up handoff

At the end of the brief, offer a follow-up path: "After the meeting, run `/meeting-prep --post {event}` or paste notes and I'll extract decisions, commitments, and next actions." (A `--post` mode is a future addition — this is a user-visible hint, not an implementation step.)

## What to avoid

- Do not produce a brief longer than one screen. Briefs that don't fit fail the reader.
- Do not list attendees generically ("CEO and co-founder"). Specificity earns the word count.
- Do not infer a desired outcome from nothing. If it isn't derivable, say so and propose the user ask the organizer.
- Do not paste raw email content. Summarize or omit.
- Do not skip risk flags. If everything is fine, say "none flagged" — but check.
- Do not include the user themselves in the attendee list. They know who they are.
- Do not run this for meetings more than 24 hours out unless the depth is `full` — briefs prepared too early go stale.

## Integration with other skills

- Attendee layers are handled by `relationship-check` logic — this skill summarizes the output, not reproduces it. If the user wants the deeper read on one attendee, hand off.
- If prep surfaces a contradiction with a prior decision, pair with `decision-check` before the meeting.
- If the meeting is the landing moment for a project, pair with `project-status` so the current state is fresh.
- After the meeting, the decisions + commitments that landed should flow into `HIPPOCAMPUS/decisions/` (via the user writing or consolidation extracting from the session transcript). This skill doesn't write decisions itself.
- `morning-briefing` usually surfaces the day's meetings first; meeting-prep drills into one.
