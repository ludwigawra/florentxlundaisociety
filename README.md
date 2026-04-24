# AI-OS

**Your second brain for Claude Code. Persistent memory, learned patterns, skills that improve over time.**

AI-OS is a Claude Code plugin that installs a brain-inspired operating system on your machine. It gives Claude a persistent place to remember, reason, and improve — across every session, in every repo, for as long as you keep using it.

Install once. Keep everything.

---

## Why AI-OS exists

Claude Code is powerful inside a session and forgetful between them.

- Every new session starts from zero. No memory of what you decided yesterday, who you talked to last week, or what didn't work the last three times you tried it.
- No mechanism for learning. Claude makes the same mistake on Tuesday that it made on Monday, because nothing is captured.
- No place for your world. People, companies, projects, decisions — they live in your head or scattered across tools, not somewhere Claude can reach them.

AI-OS fixes this by giving Claude a file-system-native brain. A folder on your machine, modeled on the regions of a real brain, that Claude reads at the start of every session and writes to during it. Your knowledge stays local, versionable, and yours.

---

## What you get

### 1. The brain (a folder on your machine)

One folder, modeled on the brain but named in plain language. Each folder has one purpose. Each file has a place.

| Folder | What lives there |
|---|---|
| `CLAUDE.md` | Identity, decision rules, executive control |
| `MEMORY.md` | Long-term memory — user-triggered writes only |
| `risks.md` | Risk flags — read before important actions |
| `memory/` | Decisions, sessions, transcripts |
| `learning/` | Corrections, patterns, skill feedback |
| `knowledge/` | People, companies, market notes |
| `projects/` | Active projects, each with its own CLAUDE.md |
| `routines/` | Daily, weekly, and on-demand routines |
| `blueprints/` | Templates and reusable how-tos |
| `voice/` | Brand and communication style |
| `system/` | Goals, architecture, vital signs |

No database, no cloud, no vendor lock-in. The folder is the brain — but you can read every file with a normal editor.

### 2. The skills pack

A curated set of skills that ship with the plugin and know how to use the brain.

- `memory-search` — search the brain before starting work
- `decision-check` — prevent contradictions by surfacing prior decisions
- `nightly-consolidation` — process short-term memory, extract patterns, improve skills
- `morning-briefing` — daily prioritized summary
- `email-triage` — categorize and draft replies
- `meeting-prep` — surface relationship and decision context
- `relationship-check` — last contact, open commitments, next action
- `project-status` — progress, blockers, next actions
- `brain-dump-content` — turn raw thoughts into structured content
- `content-interview` — Claude asks, you answer, drafts get made
- `reflect` — goal-by-goal progress and course correction
- `foresight` — forward-looking priorities
- `signal-calibration` — the brain tuning its own signal detector
- `aios-init` — one-shot install and setup

Skills improve over time. When you give feedback, the nightly consolidation edits the skill itself.

---

## Install — three commands, two minutes

AI-OS is a Claude Code plugin distributed directly from this GitHub repo. No Anthropic marketplace submission, no gatekeeper, no shell script. Anyone with Claude Code installed can add it as a plugin marketplace in one line.

### Prerequisites

| Requirement | Check | Install |
|---|---|---|
| Claude Code | `claude --version` | [docs.claude.com/en/docs/claude-code](https://docs.claude.com/en/docs/claude-code) |

That's it. No `git`, no `bash`, no `node`, no `python3` required.

### Step 1 — Add the marketplace

In any Claude Code session, run:

```
/plugin marketplace add ludwigawra/florentxlundaisociety
```

This tells Claude Code to treat this GitHub repo as a plugin marketplace. Claude Code clones it locally (cached), reads `.claude-plugin/marketplace.json`, and registers AI-OS as an installable plugin.

### Step 2 — Install AI-OS

```
/plugin install aios@aios
```

(Format: `plugin-name@marketplace-name` — both happen to be `aios` here.) Claude Code installs the plugin's skills, hooks, and commands into your Claude Code config. Nothing touches your system outside of Claude Code's plugin directory.

### Step 3 — Bootstrap your brain

Open a Claude Code session in the folder where you want your brain to live (examples use `~/my-brain`), then run:

```
/aios-init
```

This is a conversational onboarding skill — Claude walks you through a short setup (name, role, company, which integrations you use), then scaffolds your brain folder: 10 regions, templates, initial `MEMORY.md`, `CLAUDE.md` personalized to you, session hooks wired up, optional demo data if you want to see the system populated.

When it finishes, you have a brain. Every future Claude Code session started inside this folder loads your brain automatically via the `SessionStart` hook.

### Step 4 — Try your first skills

```
/memory-search      load context about a person, project, or decision
/reflect           honest checkpoint on your goals
/foresight         ranked priorities for the week ahead
/project-status    status read on any project
```

Skills write back as you use them: decisions land in `memory/decisions/`, patterns in `learning/patterns.md`, people in `knowledge/people/`. Your context compounds across sessions.

### Updates

When a new version ships, update with:

```
/plugin marketplace update aios
/plugin update aios@aios
```

Your brain folder is never touched — updates only change skills, hooks, and commands. Your memory is yours forever.

### Troubleshooting

- **`command not found: claude`** — Claude Code isn't installed or isn't on your `PATH`. See prerequisites.
- **Skills don't appear after install** — run `/plugin reload` or restart your Claude Code session.
- **`/aios-init` can't find templates** — plugin install didn't complete cleanly. Re-run `/plugin install aios@aios`.
- **SessionStart hook is silent** — make sure you're running Claude Code *inside* the brain folder (`cd ~/my-brain` first). Hooks scope to the current directory.

### Alternative: shell-script install *(fallback)*

If you prefer not to use Claude Code's plugin system, you can still install the classic way by cloning this repo and running `./plugin/scripts/install.sh --target ~/my-brain --name "Your Name"`. See [`plugin/scripts/install.sh --help`](plugin/scripts/install.sh) for all flags. This path is maintained for backwards compatibility but the plugin flow above is the recommended way in.

---

## Architecture

```
  ┌─────────────────────────┐
  │     Claude Code CLI     │
  │  (any repo, any dir)    │
  └────────────┬────────────┘
               │
               │  plugin: hooks, skills, commands
               ▼
  ┌─────────────────────────┐
  │        AI-OS Plugin     │
  │  session start/end      │
  │  skill registry         │
  │  licensing check        │
  └────────────┬────────────┘
               │
               │  reads & writes
               ▼
  ┌─────────────────────────┐
  │      ~/AI-OS/           │
  │  (the brain — your      │
  │   folder, your files)   │
  │                         │
  │  memory/                │
  │  learning/              │
  │  knowledge/             │
  │  projects/              │
  │  routines/              │
  │  ...                    │
  └─────────────────────────┘
```

---

## Who this is for

- **Solo entrepreneurs** running multiple projects who need one place that remembers everything
- **Researchers** who work across long time horizons and need reliable recall
- **Operators** who live in Claude Code and want it to stop forgetting
- **Creators** building a content practice that benefits from compound context
- Anyone who has typed the same context into Claude more than twice and thought "there should be a better way"

---

## Pricing

AI-OS ships as install fee + subscription.

- **Starter** — starting at $X one-time + $Y/month. Core brain, skills pack, single machine.
- **Pro** — starting at $X one-time + $Y/month. Everything in Starter, plus priority skill updates, multi-device sync.
- **Team** — custom. Shared folders, team-level skills, admin controls.

See the [pricing page](https://example.com/pricing) for current tiers.

The plugin, skills pack, and docs in this repo are open source under MIT. The subscription covers licensed distribution, hosted update channels, and support — not your data or your brain folder. Your data is always local and yours.

---

## Documentation

- [Getting started](docs/getting-started.md)
- [Architecture](docs/architecture.md)
- [Skills catalog](docs/skills.md)
- [Roadmap](docs/roadmap.md)
- [Licensing model](plugin/licensing/README.md)

---

## Contributing

We welcome contributions to skills and brain folders. See [`CONTRIBUTING.md`](CONTRIBUTING.md).

---

## License

MIT for the open-source components in this repository. See [`LICENSE`](LICENSE).

The MIT license covers the plugin, skills, and docs. It does not cover the subscription services (licensing server, hosted update channel, support). Those are governed by the terms of your subscription.
