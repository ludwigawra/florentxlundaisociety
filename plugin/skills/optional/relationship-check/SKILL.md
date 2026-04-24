---
name: relationship-check
description: Quick read on the state of a relationship — who they are, last contact, open commitments, unresolved threads, and a specific next action. Reads SENSORY-CORTEX/people/ and cross-references any mentions in HIPPOCAMPUS/decisions/, CEREBELLUM/corrections.md, and MOTOR-CORTEX/. Use before sending an email or message to someone you have not talked with in a while, before a meeting, when a name comes up and you need context, or when deciding whether a relationship needs attention.
---

# Relationship Check

Give a honest, compact read on one relationship. The goal is a usable snapshot — enough to write a real message or enter a real conversation without rereading everything. Not a CRM entry; a human picture.

The AI-OS root is at `~/Desktop/AI-OS/` by default. If the user has configured a different root (check the plugin config or a root-level `CLAUDE.md` marker), use that path instead. People entities live at `SENSORY-CORTEX/people/{slug}.md`.

## When to use

Invoke this skill whenever any of the following apply:

- A person's name comes up and you do not have their context in the current session
- The user is about to reach out (email, DM, call) to someone they have not talked with recently
- A meeting with this person is coming up and needs a brief
- The user is deciding whether the relationship needs a nudge, a reset, or a graceful close
- A reflection or foresight surfaced a relationship as a priority and you need to turn that into a concrete next action

Do not invoke for someone actively in the current session's context — that information is already in working memory. Also skip for truly new contacts with no file yet; offer to create one instead.

## Inputs

The caller should provide:

- **Person** — name or slug. Accept partial matches against `SENSORY-CORTEX/people/` basenames and `name`/`aliases` fields in frontmatter.
- **Purpose** — optional: what the user is about to do (reach out / prep for meeting / decide on status). Changes which sections of the output get expanded.

If multiple people match a partial name, list the candidates (name + company + last contact) and ask. If no match, ask whether to create a new person file.

## Process

### 1. Locate the person

Resolve the file in this order:

1. Exact filename match under `SENSORY-CORTEX/people/`
2. Case-insensitive partial match on filename
3. Match on the `name` field in frontmatter
4. Match on any `aliases` list in frontmatter (if present)
5. Match on first-name-only across files, flagging ambiguity

If nothing matches, stop and ask. If multiple match, stop and ask.

### 2. Load the person's file

Read the full file, parsing frontmatter and body. Expected frontmatter fields (flex — not all will be present):

- `name`, `aliases`, `role`, `company`, `location`
- `status` (active / dormant / archived / do-not-contact)
- `relationship` (one-line framing, e.g., "prospect", "former colleague", "investor intro")
- `last_contact_at`, `next_touch_by`
- `tags`, `related`

### 3. Cross-reference

Search the rest of the brain for mentions of this person:

1. `HIPPOCAMPUS/decisions/` — any decision whose frontmatter `related` lists this person's wiki-link, or whose body mentions the name. Note dates.
2. `CEREBELLUM/corrections.md` — any correction that referenced this person (e.g., "sent too long an email to X" — context worth remembering).
3. `MOTOR-CORTEX/*/` — any project whose files mention the person. Projects they're embedded in.
4. `HIPPOCAMPUS/short-term/` — recent session files (last 30 days).
5. `SENSORY-CORTEX/companies/` — if the person has a `company` field, load that company's file too. Relationships often sit in the intersection.
6. Optional MCPs (if enabled and available):
   - Gmail: search for threads with this person (most recent 5)
   - GCal: meetings with this person (past 30 days + upcoming)
   - WhatsApp: chats with this person (most recent)

If no MCP is available, skip and note the gap. Do not fail on missing optional connectors.

### 4. Compute the freshness

From `last_contact_at` + any cross-reference evidence, compute:

- **Days since last contact** — most recent touchpoint from any source
- **Cadence** — typical gap between contacts (if there are 3+ touchpoints to compare)
- **Status verdict** — `on-rhythm`, `slipping` (past cadence), `dormant` (past 2x cadence with no explicit reason), `fresh` (contacted recently), or `never` (file exists but no contact recorded)

If the person's frontmatter `status` says `do-not-contact`, surface that immediately before anything else and skip the next-action section.

### 5. Extract open threads

From the file and cross-references, extract:

- **Open commitments you owe them** — anything you promised and have not delivered. Name the date promised if present.
- **Open commitments they owe you** — anything they promised that is outstanding. Name the date expected if present.
- **Open questions** — unresolved topics, decisions pending their input
- **Recent topics** — what was discussed last time, in 1-2 lines

Be specific. "Following up on the thing" is not useful. "Owes feedback on the hiring doc since 2026-03-24" is.

### 6. Produce the output

Use this structure. Keep it to one screen unless depth is explicitly requested.

```
# {name} — {status verdict}

## Who
<one-line: role at company, location, relationship framing>

## Freshness
<last contact date + days ago, cadence verdict, next-touch-by if set>

## Recent topics
<2-3 bullets on what was last discussed>

## Open — you owe
<bullets or "none tracked">

## Open — they owe
<bullets or "none tracked">

## Relevant context
<anything surfaced from decisions, projects, companies that colors how to approach this person right now>

## Suggested next action
<one concrete action. Example: "Reply to the 2026-04-02 thread with a short status + new date.">

## Risk flags
<anything that should give pause: "last contact ended on a correction", "status is dormant", "do-not-contact — stop here", or "none">
```

### 7. Tailor to purpose

If `purpose` was supplied, expand the relevant section:

- **reach out** — focus on "Suggested next action" and "Risk flags". Offer to draft the message if the user wants.
- **prep for meeting** — expand "Recent topics" and "Open threads". Add a "Meeting angle" line: what specifically to make sure this meeting accomplishes.
- **decide on status** — surface cadence + freshness prominently; explicitly propose whether to keep `active`, move to `dormant`, or archive.

### 8. MEMORY.md candidates

After the output, if anything surfaced that belongs in `MEMORY.md` (not in short-term, not in person file) — a permanent fact about the relationship, a durable preference — offer to add it. Do not write without user confirmation.

### 9. Handle missing person cleanly

If the person file does not exist:

1. Search the brain for name mentions (they might be referenced in decisions or short-term without having a file yet)
2. If found, offer to create a stub `SENSORY-CORTEX/people/{slug}.md` with the context extracted from mentions
3. If not found, say so plainly and ask whether to create a new person file from scratch with the user's input

Never fabricate details. If the only evidence is "the user mentioned a Jane in a short-term file once", say that and nothing more.

## What to avoid

- Do not relay — analyze. A list of recent emails is not a relationship check; the synthesis of what they mean is.
- Do not produce a next action that would contradict a `do-not-contact` status. Stop instead.
- Do not paste long quotes from emails or messages. Summarize in one line; the user can read the source.
- Do not make up a cadence from a single touchpoint. One contact is not a pattern.
- Do not output "Recent topics" as generic categories ("product", "catch-up"). Be specific or omit.
- Do not write to the person file silently. Any updates to `last_contact_at`, `next_touch_by`, or status go through the user.

## Integration with other skills

- Pair with `meeting-prep` when the purpose is meeting preparation — meeting-prep handles the overall brief, relationship-check handles the person-by-person layer.
- Pair with `decision-check` when the relationship has open decisions — surface whether any pending decision involves this person.
- If the relationship has been dormant, consider whether `reflect` or `foresight` should promote a re-engage action into next week's priorities.
- If the check surfaces a repeated pattern across multiple relationships (e.g., "every investor intro goes dormant after 3 weeks"), suggest persisting it to `CEREBELLUM/patterns.md` via consolidation — do not edit `patterns.md` here.
