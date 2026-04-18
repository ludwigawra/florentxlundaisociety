---
type: reference
tags: [architecture, meta, ai-os, brain-model]
created: 2026-04-18
updated: 2026-04-18
status: active
---

# AI-OS Architecture

The AI-OS is a brain-inspired operating system for a single person. Each top-level folder maps to a region of the human brain. The folder IS the brain — there is no separate database, no hidden state. If a file isn't here, the system doesn't know about it.

This document is a reference for how the pieces fit together.

---

## Design principles

1. **Files over services.** Everything the agent knows lives as plain markdown on disk. Portable, inspectable, versioned with git.
2. **The folder IS the brain.** Regions have meanings. Putting something in the wrong region weakens the whole system.
3. **Context is loaded, not stored.** Each session hydrates from a small set of files (`CLAUDE.md`, `MEMORY.md`, `patterns.md`) and pulls in more as needed.
4. **Write during, consolidate after.** Working memory is captured in real time; consolidation happens nightly.
5. **The system improves itself.** Feedback on skills and corrections on behavior flow into the skills and patterns they refer to.

---

## The regions

### Prefrontal Cortex — `CLAUDE.md`
Identity, session protocol, decision rules, authority levels, and the full brain map. This is the first file read every session.

### Amygdala — `AMYGDALA.md`
Risk rules. Read before any important action. Defines the red flags that downshift authority regardless of what the decision rules would otherwise allow.

### Hippocampus — `HIPPOCAMPUS/` + `MEMORY.md`
- `MEMORY.md` — long-term, user-triggered memory.
- `HIPPOCAMPUS/short-term/` — working memory files per session. Consolidated nightly.
- `HIPPOCAMPUS/short-term/transcripts/` — raw session transcripts archived by hooks.
- `HIPPOCAMPUS/decisions/` — episodic memory. One file per decision, named as a claim.

### Cerebellum — `CEREBELLUM/`
Error correction and learning.
- `corrections.md` — what went wrong and what should have happened.
- `patterns.md` — reusable lessons extracted from corrections.
- `skill-feedback/{skill}.md` — per-skill feedback and improvement history.
- `tool-errors.log` — auto-logged MCP and tool failures.

### Sensory Cortex — `SENSORY-CORTEX/`
Processed external knowledge.
- `people/` — one file per individual.
- `companies/` — one file per organization.
- `market/` — digests, scans, competitive notes.

### Basal Ganglia — `BASAL-GANGLIA/`
Habits and routines that run repeatedly.
- `daily/` — morning briefing, email triage.
- `weekly/` — planning, retros.
- `on-demand/` — research flows, prep routines.

### Motor Cortex — `MOTOR-CORTEX/`
Active projects. Each project is a subfolder with its own `CLAUDE.md` and `MEMORY.md` — local identity, local context, isolated from the rest of the brain except via explicit links.

### Procedural Memory — `PROCEDURAL-MEMORY/`
Templates and blueprints. "How to make a proposal." "How to structure a client brief." Reusable scaffolding for repeated outputs.

### Broca — `BROCA/`
Communication. Brand guidelines, voice, messaging, visual assets, canonical copy.

### Meta-Cognition — `META-COGNITION/`
Self-awareness — the system thinking about itself.
- `architecture.md` — this file.
- `vital-signs.md` — health thresholds used at session start.
- `context/` — goals, metrics, capabilities, external context.

### Long-Term Storage — `LONG-TERM-STORAGE/`
Archive. Things no longer active but worth keeping searchable.

---

## The nervous system

**Senses** — MCPs that read the world (email, calendar, CRM, docs, messaging).
**Hands** — MCPs that act in the world (send email, create events, update records).
**Reflexes** — scheduled tasks that fire without a human trigger (morning briefing, nightly consolidation).
**Skills** — learned complex behaviors that combine tools, knowledge, and process. Each has its own feedback file in `CEREBELLUM/skill-feedback/`.

---

## Data flow

```
External input -> Senses (MCPs) -> short-term notes (HIPPOCAMPUS/short-term/)
                                -> filed to SENSORY-CORTEX/ when worth keeping

Session activity -> short-term memory file (logged as it happens)
                 -> transcript archived (session end hook)

Nightly consolidation:
  transcripts + short-term + corrections ->
    - patterns extracted -> CEREBELLUM/patterns.md
    - decisions filed    -> HIPPOCAMPUS/decisions/
    - skill edits        -> SKILL.md (when 3+ feedback entries)
    - MEMORY.md          -> only if user approved
```

---

## Extending the system

When something new appears, ask "where in the brain does this belong?"

| Want | Region | Concrete step |
|---|---|---|
| New data source | Sensory cortex | Add MCP + filing convention in `SENSORY-CORTEX/` |
| New weekly routine | Basal ganglia | Add process file in `BASAL-GANGLIA/weekly/` + scheduled trigger |
| New deliverable type | Procedural memory | Add template in `PROCEDURAL-MEMORY/` |
| Remember a situation | Hippocampus | Ask the user; if yes, add to `MEMORY.md` |
| Avoid a known mistake | Amygdala | Add to `AMYGDALA.md` |
| Track a new project | Motor cortex | New `MOTOR-CORTEX/[project]/` subfolder with its own CLAUDE.md |

If a new need doesn't fit any region cleanly, that's a signal the architecture itself needs to evolve — flag it rather than forcing a fit.
