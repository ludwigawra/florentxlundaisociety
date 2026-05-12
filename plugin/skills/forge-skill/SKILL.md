---
name: forge-skill
description: Auto-generate intent-wrapped skills from a connected MCP's tool definitions. The user connects a new MCP (Gmail, Notion, Linear, Supabase, whatever), then runs /forge-skill [mcp-name] and the brain proposes 3-5 skill candidates that wrap those tools with natural-language intents. Every skill is approved by the user before it's written. This is how AI-OS grows capabilities as the user connects new tools.
---

# Forge Skill

You are reading the tool definitions of a connected MCP server and proposing skills that wrap those tools with intents the user would naturally say in a session.

The goal: turn "I connected Gmail" into *"every time I say 'reply to my investor', Claude knows exactly which tools to call and how to voice-match me."* Without this skill, connecting an MCP just adds tools — with this skill, connecting an MCP adds *capabilities the brain knows when to trigger*.

---

## Phase 0 — Inputs

If the user invoked `/forge-skill <name>`, use `<name>` as the target MCP slug.

If they invoked `/forge-skill` with no argument:
- List every MCP currently connected in this Claude Code session. You can detect these from tool names following the pattern `mcp__<server>__<tool>` (e.g. `mcp__claude_ai_Gmail__search_threads` implies `Gmail`). Dedupe by server name.
- If zero MCPs are connected, say so plainly and point the user to `plugin/docs/mcp-directory.md` for suggestions of what to connect. Stop.
- If one or more are connected, list them and ask which one to forge skills for. Wait for the answer.

**Refuse to run on a stale brain.** Check that the user's cwd has `.claude/aios.config.json`. If not, tell them to run `/aios-start` first. Stop.

---

## Phase 1 — Read the MCP's tool surface

Collect every tool name, description, and parameter schema for the chosen MCP. Group tools by *verb*:

- **Read** — list, get, search, fetch, download, count
- **Write** — create, update, delete, reply, send, move
- **Admin** — connect, disconnect, configure

This grouping feeds skill proposals.

Also collect the MCP's *domain* — infer from the server name and tool descriptions. Examples: Gmail = email, Google Calendar = scheduling, Notion = knowledge base, Linear = issue tracking, Supabase = database, Miro = visual canvas.

Hold this in working context — you'll need it in Phase 2.

---

## Phase 2 — Propose 3–5 skill candidates

Skills are the bridge between *what the user naturally says* and *which tools Claude calls*. A great generated skill has:

- **Clear intent** — what the user wants in plain language ("reply to my most recent inbound email")
- **Trigger phrases** — the 3–5 ways a user actually expresses that intent ("reply to X", "draft a response to X", "what should I say back")
- **Tool choreography** — which MCP tools to call, in what order, to satisfy the intent
- **Voice match** — how output should read (pulls from `voice/brand-guidelines.md` and `learning/behavioral-patterns.md` if present)

Propose skills that cover the *most common jobs-to-be-done* for this domain. Do not propose skills that are trivial wrappers around a single tool unless the intent is genuinely useful in isolation.

### Canonical templates for common domains

When the MCP's domain matches one of these, use the template as a starting point — adapt the trigger phrases and tool names to the specific MCP.

**Email (Gmail, Outlook, etc.)**
- `/inbox-scan` — summarize unread, flag high-priority, propose triage
- `/reply-to-<thread>` — voice-matched reply draft, never sent without approval
- `/follow-up-hunt` — find emails awaiting response >N days, propose next moves
- `/email-search` — fuzzy search the inbox by topic, person, or intent

**Calendar (GCal, Outlook Calendar)**
- `/today` — next 3 events + prep context from the brain
- `/meeting-prep` — one-screen brief for the next event (attendees, open threads, asks)
- `/reschedule-hunt` — events that should be moved based on user state
- `/calendar-gaps` — open blocks where deep work could go

**Knowledge base (Notion, Confluence, Obsidian MCP)**
- `/kb-search` — find a note by topic, person, or recency
- `/kb-capture` — take a raw thought and file it in the right database with the right frontmatter
- `/kb-link` — find related pages and propose backlinks

**Issue tracker (Linear, Jira, GitHub Issues)**
- `/my-issues` — everything assigned to me, sorted by decay risk
- `/issue-digest` — what changed on my issues since last session
- `/close-loops` — issues I opened that should be closed

**Database (Supabase, Postgres MCP)**
- `/db-inspect` — show schema and row counts for a table
- `/db-search` — find rows matching a description without writing SQL by hand

**Messaging (Slack, WhatsApp, Discord)**
- `/unread-scan` — what threads need my attention
- `/draft-reply-to-<contact>` — voice-matched response
- `/thread-catch-up` — summary + my likely stance in a long thread

For MCPs that don't match these domains, generate skills by grouping tools into jobs-to-be-done and writing a 1-line intent for each.

---

## Phase 3 — Present candidates

Show the proposals as a numbered list the user can edit. Use this exact structure — no preamble:

```
Connected: {{mcp-name}} ({{N}} tools)

Proposed skills:

1. /{{skill-1-name}}
   Intent:   {{one-line description}}
   Triggers: "{{phrase 1}}", "{{phrase 2}}", "{{phrase 3}}"
   Uses:     {{tool-1}}, {{tool-2}}

2. /{{skill-2-name}}
   Intent:   ...
   ...

Reply with the numbers you want, or say:
  "all"            install all of them
  "rename 2 as X"  rename a proposed skill
  "drop 3"         remove one
  "skip"           don't install anything, end the skill
```

Wait for the user's answer. Loop on edits until they confirm.

---

## Phase 4 — Write the approved skills

For each approved skill, write a new SKILL.md at:

```
.claude/skills/generated/{{skill-name}}/SKILL.md
```

Frontmatter template:

```yaml
---
name: {{skill-name}}
description: {{intent description — used by Claude to decide when to invoke}}
generated_from: {{mcp-name}}
generated_at: {{today}}
triggers:
  - "{{phrase 1}}"
  - "{{phrase 2}}"
uses_mcp_tools:
  - {{tool-1}}
  - {{tool-2}}
---
```

Body template:

```markdown
# {{Skill Title}}

{{One paragraph: what this skill does, when it fires, what the user gets.}}

## When to invoke

- Trigger phrases: {{list}}
- Implicit triggers: {{any AI-OS context that should fire this — e.g. "when the user opens a session after a period of being away and asks 'what did I miss'"}}

## Process

1. {{step 1 — which tool to call, with what params}}
2. {{step 2 — how to format or filter the result}}
3. {{step 3 — what to do with the output (draft, save, ask)}}

## Output format

{{Describe the shape of the response — a summary, a draft, a list, etc. Keep voice matched to voice/brand-guidelines.md if it exists in the user's brain.}}

## Never do

- Send anything without the user's explicit approval (same rule as every other write-capable skill).
- Skip voice matching. If voice/brand-guidelines.md exists, read it before drafting.
- Over-summarize. The user wants signal, not a digest of everything.

## Improvement

Feedback on this skill routes to `learning/skill-feedback/{{skill-name}}.md`. The nightly consolidation reads it and edits this file when three pending signals accumulate.
```

Adapt each skill's body to fit the actual tools and intent — do not leave `{{placeholder}}` tokens in the output file.

---

## Phase 5 — Log the run

Append a new entry to `learning/skill-forge-history.md` (create the file with a H1 header if missing):

```markdown
## {{today}} — forged from {{mcp-name}}

Generated:
- `/{{skill-1}}` — {{one-line intent}}
- `/{{skill-2}}` — {{one-line intent}}

Proposed but dropped by user:
- `/{{skill-x}}` — {{reason user gave, or "declined without reason"}}

All files written to `.claude/skills/generated/`.
```

---

## Phase 6 — Confirm and exit

Show this final block:

```
Forged {{N}} skills from {{mcp-name}}.

They're live in this session. Try:
  /{{first-generated-skill}}

Feedback on any generated skill routes to its own feedback file. Nightly consolidation will improve them automatically.
```

Stop. Do not keep talking.

---

## Hard rules

- **Never** write outside the user's `.claude/skills/generated/` directory.
- **Never** generate a skill that auto-sends messages or executes destructive writes without approval. All writes are proposed, the user approves.
- **Never** overwrite a skill in `.claude/skills/generated/` without telling the user it existed and asking if they want to replace.
- **Never** generate more than 5 skills per MCP in a single run. Quality over quantity.
- If the MCP has zero tools, say so and stop. Do not invent tools.
- If a tool's description is empty or unclear, flag it to the user rather than guessing intent.

## Tone

Minimalist, confident. You're handing the user new capabilities. Show them the menu, let them pick, write the files, step aside. No celebration copy. No exclamation points. No emojis.

## Tick setup-progress

After the skills are written, tick the integration checkbox so `/aios-help status` reflects the new connection. Pick the substring matching the integration that was just forged:

| MCP forged | Substring to tick |
|---|---|
| Gmail | `Gmail` |
| Google Calendar / GCal | `Google Calendar` |
| Notion | `Notion` |
| WhatsApp | `WhatsApp` |
| Telegram | `Telegram` |
| (any other) | append a new line under `## Custom integrations forged via /forge-skill` |

For known integrations:

```bash
bash $CLAUDE_PROJECT_DIR/system/scripts/tick-progress.sh "Integrations" "<substring>" "forge-skill"
```

For custom MCPs not in the table, append `- [x] <mcp-name> — forge-skill, <today>` under the `## Custom integrations forged via /forge-skill` section in `system/setup-progress.md`. Recompute the status line by counting `- [x]` vs `- [ ]` lines, or just re-run any known-substring tick to trigger the recount.

Idempotent. Skip silently if `system/setup-progress.md` is missing.
