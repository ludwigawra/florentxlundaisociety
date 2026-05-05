# Getting started

This walkthrough takes you from zero to a running AI-OS in about five minutes.

---

## Prerequisites

- Claude Code installed (`claude` on your `PATH`). If you don't have it: [docs.claude.com/en/docs/claude-code](https://docs.claude.com/en/docs/claude-code).

That's all. No Node, no npm, no build step.

---

## 1. Add the marketplace

In any Claude Code session:

```
/plugin marketplace add ludwigawra/AIOS
```

This tells Claude Code to treat this GitHub repo as a plugin marketplace. It clones the repo locally (cached), reads `.claude-plugin/marketplace.json`, and registers AI-OS as an installable plugin.

---

## 2. Install the plugin

```
/plugin install aios@aios
```

(Format: `plugin-name@marketplace-name` — both happen to be `aios` here.)

Claude Code installs the plugin's skills, hooks, and slash commands into its plugin directory. Nothing touches your home directory or any project folder yet.

---

## 3. Bootstrap your brain

Open Claude Code in the directory where you want your brain to live (examples use `~/my-brain`):

```bash
mkdir ~/my-brain && cd ~/my-brain
claude
```

Then run the bootstrap skill:

```
/aios-init
```

`/aios-init` is a short conversational onboarding (eight questions: name, role, company, use case, goals, integrations, content pillars, language, tone). When you confirm, it scaffolds your brain folder:

```
~/my-brain/
├── CLAUDE.md           # Identity and protocols
├── MEMORY.md           # Long-term memory (you trigger writes)
├── risks.md            # Risk flags read before important actions
├── memory/             # Decisions, sessions, transcripts
├── learning/           # Corrections, patterns, skill feedback
├── knowledge/          # People, companies, market notes
├── projects/           # Active projects, each with its own CLAUDE.md
├── routines/           # Daily, weekly, on-demand routines
├── blueprints/         # Templates and reusable how-tos
├── voice/              # Brand and communication style
├── system/             # Goals, architecture, vital signs
└── archive/            # Inactive but searchable
```

Hooks are already wired (the plugin install handles that automatically). From now on, every Claude Code session you start *inside* this folder loads your brain context at session start.

---

## 4. First real session

Stay inside `~/my-brain/` and ask Claude to do something substantive — plan a week, draft an email, research a topic, outline a project. Three things happen automatically:

1. The `SessionStart` hook creates `memory/short-term/session-YYYY-MM-DD-<topic>.md` and injects vital signs and learned patterns.
2. As you work, Claude writes decisions and learnings to that file.
3. The `SessionEnd` hook archives the full transcript to `memory/short-term/transcripts/`.

---

## 5. Let it consolidate

After a few sessions, let the nightly consolidation run. It reads archived transcripts for feedback signals, routes feedback to `learning/skill-feedback/<skill>.md`, extracts patterns from corrections, and improves skills when enough feedback accumulates.

Run it manually any time:

```
/nightly-consolidation
```

Or schedule it (recommended). See [`docs/skills.md`](skills.md) for scheduling patterns.

---

## Next steps

- Run `/aios-explore` for the full menu of installed skills and when to use each.
- Read [`docs/architecture.md`](architecture.md) for the design rationale behind the folder layout.
- Start populating `knowledge/people/` and `knowledge/companies/` — this is where compound context comes from.
- Connect an MCP (Gmail, Notion, Linear) and run `/forge-skill <mcp-name>` to auto-generate intent-wrapped skills for it.
