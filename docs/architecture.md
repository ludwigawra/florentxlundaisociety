# Architecture

AI-OS is a brain-inspired operating system for Claude Code. It is not a framework or a database. It is a folder, a plugin, and a local dashboard — each with a narrow role.

This document explains the design: why the system looks like this, what each region is for, and how information flows.

---

## The core metaphor: the folder IS the brain

Most "memory for LLMs" systems reach for a database — vectors, embeddings, schemas. AI-OS deliberately doesn't.

The user's brain is a directory on their disk. Every region is a folder. Every memory is a file. Every link is a wiki-link. The user can open it in their editor, browse it in the dashboard, commit it to git, back it up, move it to another machine, read it without any tooling at all.

This has consequences, and they're all intentional:

- **The brain is readable.** Any model, any editor, any human can open and make sense of it.
- **The brain is portable.** Copy the folder, you copy the brain.
- **The brain is versionable.** Git over the folder gives you time travel for free.
- **The brain is yours.** No vendor, no service, no lock-in.

The tradeoff: retrieval has to be smart without being clever. Skills read the regions they need. The plugin injects relevant context at session start. The dashboard renders what exists without transforming it.

---

## The regions

Each region maps to a cognitive function. The boundaries are opinionated — they were chosen so that most things have an obvious home and very few things belong in two places.

### Identity — `CLAUDE.md` (root)

Identity and executive control. Decision rules, protocols, the session lifecycle, the rules for what goes where. This is the file every session reads first.

### Memory — `memory/`

Episodic memory. What happened, when, and why.

- `decisions/` — named decisions, one file per claim
- `short-term/` — working memory, cleared by consolidation
- `short-term/transcripts/` — archived session transcripts

`MEMORY.md` at the root is the consolidated long-term surface of the hippocampus — the distilled, persistent layer.

### Learning — `learning/`

Error correction and learning.

- `corrections.md` — specific mistakes and their fixes
- `patterns.md` — generalizations extracted from corrections
- `skill-feedback/` — per-skill feedback, one file per skill
- `tool-errors.log` — auto-logged tool and MCP failures

The cerebellum is how the system learns. Feedback flows in. Patterns flow out. Skills update themselves based on what accumulates here.

### Knowledge — `knowledge/`

World knowledge — processed external data.

- `people/` — one file per person
- `companies/` — one file per organization
- `market/` — market digests
- `competitors/`, `linkedin/`, etc. — situational subfolders

Everything here is an entity. Every entity has frontmatter. Every reference between entities is a wiki-link. This is what makes the knowledge graph.

### Projects — `projects/`

Active projects. Each project is a subfolder with its own `CLAUDE.md` and `MEMORY.md`. Projects have isolated memory and identity overrides so a session working on one project doesn't leak context from another.

### Routines — `routines/`

Habits and processes.

- `daily/` — morning briefing, email triage
- `weekly/` — week planning, retrospective
- `on-demand/` — research, proposals, meeting prep

The basal ganglia holds the "how we do things" — the documented routines that run on schedule or on demand.

### Blueprints — `blueprints/`

Templates and blueprints. How to make a thing. Distinct from Routines (how we do things) — procedural memory is the artifact layer.

### Voice — `voice/`

Communication and expression. Brand guidelines, messaging, voice, visual assets. The part of the brain that handles output style.

### Risks — `risks.md` (root)

Risk assessment. Read before important actions. One flat file because it should fit in context and be readable in ten seconds.

### System — `system/`

The system thinking about itself. Architecture docs, capabilities, vital signs, context files. Where the brain keeps its self-model.

### Long-Term Storage — `archive/`

Archive. Not active, but searchable. The place things go when they matter historically but not operationally.

---

## Information flow

### Session start

1. Plugin `SessionStart` hook fires.
2. Hook creates a short-term memory file: `memory/short-term/session-YYYY-MM-DD-<topic>.md`.
3. Hook injects vital signs and recent patterns into Claude's context.
4. Claude reads (in order): `CLAUDE.md`, `MEMORY.md`, `learning/patterns.md`. Reads `risks.md` if the session involves external action. Reads project `CLAUDE.md` if working on a project.
5. Session begins with full context.

### During the session

Claude writes to short-term memory as the session unfolds — decisions, corrections, new information, feedback. Skills read from the brain, do their work, and write back. The Learning captures feedback on skill outputs in real time.

### Session end

1. Plugin `SessionEnd` hook fires.
2. Full transcript archived to `memory/short-term/transcripts/`.
3. Session file is finalized.

### Nightly consolidation

The `nightly-consolidation` skill (invoked on schedule) processes everything that accumulated in short-term memory:

- Reads archived transcripts for missed feedback signals.
- Routes feedback to `learning/skill-feedback/<skill>.md`.
- When 3+ pending entries exist for a skill, edits the skill itself.
- Extracts patterns from corrections.
- Clears processed short-term files.
- Updates vital signs.

This is how the system improves without anyone telling it to.

---

## The plugin

The plugin is what makes the brain a runtime system rather than a pile of markdown.

- `.claude-plugin/` — plugin manifest and metadata
- `hooks/` — `SessionStart`, `SessionEnd`, `PostToolUseFailure`
- `skills/` — the shipped skill pack
- `templates/` — brain region templates installed by `/aios-start`
- `licensing/` — subscription license verification (see `plugin/licensing/README.md`)

The plugin does not store user data. It installs the brain scaffold, wires hooks, and registers skills. The user's brain folder is always the source of truth.

---

## The dashboard

A local-first Next.js app. Runs on `localhost`. No account, no cloud.

- Reads the user's brain folder directly from disk.
- Renders markdown with frontmatter as structured views.
- Follows wiki-links as navigation.
- Surfaces short-term memory, decisions, skill calibration, graph.

The dashboard is a view layer. It never holds state the brain folder doesn't.

---

## Design principles

1. **The folder is the source of truth.** Not a database, not a cache, not a server. The folder.
2. **Everything readable by a human is readable by a model.** Markdown and YAML. No proprietary formats.
3. **Feedback is cheap, learning is compound.** Every session contributes. Skills improve on a schedule.
4. **Local-first by default.** Your data never leaves your machine unless you tell it to.
5. **Opinionated regions, flexible contents.** The regions are fixed. What you put in them is yours.
6. **One place for each thing.** If something belongs in two regions, the regions are wrong.

---

## What's explicitly not in scope

- **Vector embeddings.** Not needed at this scale. Skills read named files. The graph does the rest.
- **Multi-user shared state.** The brain is single-user. Team features compose brains, they don't merge them.
- **Cloud sync.** Out of scope for the open-source core. Subscription tiers may offer it as an opt-in service.
- **Agent frameworks.** AI-OS is the memory and the context. The agent is Claude Code.

---

## See also

- [`docs/getting-started.md`](getting-started.md) — install walkthrough
- [`docs/skills.md`](skills.md) — catalog of shipped skills
- [`docs/roadmap.md`](roadmap.md) — what's built, what's next
- [`plugin/licensing/README.md`](../plugin/licensing/README.md) — subscription model
