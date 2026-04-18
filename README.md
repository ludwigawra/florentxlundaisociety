# AI-OS

**Your second brain for Claude Code. Persistent memory, learned patterns, skills that improve over time.**

AI-OS is a Claude Code plugin paired with a local dashboard that installs a brain-inspired operating system on your machine. It gives Claude a persistent place to remember, reason, and improve — across every session, in every repo, for as long as you keep using it.

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

One folder, structured like a brain. Each region has a purpose. Each file has a place.

| Region | Role |
|---|---|
| **Prefrontal Cortex** (`CLAUDE.md`) | Identity, decision rules, executive control |
| **Hippocampus** (`HIPPOCAMPUS/`) | Episodic memory — decisions, sessions, transcripts |
| **Cerebellum** (`CEREBELLUM/`) | Error correction — corrections, patterns, skill feedback |
| **Sensory Cortex** (`SENSORY-CORTEX/`) | World knowledge — people, companies, markets |
| **Motor Cortex** (`MOTOR-CORTEX/`) | Active projects, each with its own CLAUDE.md |
| **Basal Ganglia** (`BASAL-GANGLIA/`) | Habits and routines — daily, weekly, on-demand |
| **Procedural Memory** (`PROCEDURAL-MEMORY/`) | Templates and blueprints |
| **Broca** (`BROCA/`) | Voice, brand, communication style |
| **Amygdala** (`AMYGDALA.md`) | Risk flags — read before important actions |
| **Meta-Cognition** (`META-COGNITION/`) | The system thinking about itself |

The folder **is** the brain. No database, no cloud, no vendor lock-in.

### 2. The skills pack

A curated set of skills that ship with the plugin and know how to use the brain.

- `brain-search` — search the brain before starting work
- `decision-check` — prevent contradictions by surfacing prior decisions
- `nightly-brain-consolidation` — process short-term memory, extract patterns, improve skills
- `morning-briefing` — daily prioritized summary
- `email-triage` — categorize and draft replies
- `meeting-prep` — surface relationship and decision context
- `relationship-check` — last contact, open commitments, next action
- `project-status` — progress, blockers, next actions
- `brain-dump-content` — turn raw thoughts into structured content
- `content-interview` — Claude asks, you answer, drafts get made
- `reflect` — goal-by-goal progress and course correction
- `foresight` — forward-looking priorities
- `thalamus-calibration` — the brain tuning its own signal detector
- `aios-init` — one-shot install and setup

Skills improve over time. When you give feedback, the nightly consolidation edits the skill itself.

### 3. The dashboard

A local-first web dashboard that renders your brain. No account. No cloud. Runs on `localhost`.

- Browse regions, read files, follow wiki-links
- Inspect short-term memory and decisions
- Watch skills calibrate
- See the graph

---

## Quick start

```bash
claude plugin add aios
claude
> /aios-init
```

That's it. The plugin installs the brain scaffold into `~/AI-OS/`, wires the session hooks, and registers the skills. Open the dashboard with `npm run dev` inside the repo or follow the prompt after `/aios-init`.

See [`docs/getting-started.md`](docs/getting-started.md) for the full walkthrough.

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
  │  HIPPOCAMPUS/           │
  │  CEREBELLUM/            │
  │  SENSORY-CORTEX/        │
  │  MOTOR-CORTEX/          │
  │  ...                    │
  └────────────┬────────────┘
               │
               │  renders
               ▼
  ┌─────────────────────────┐
  │   Local Dashboard       │
  │   (Next.js, localhost)  │
  │   browse, search, graph │
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

## Screenshots

> _Dashboard — brain region browser_
>
> `[screenshot: dashboard-regions.png]`

> _Short-term memory view_
>
> `[screenshot: dashboard-short-term.png]`

> _Skill calibration panel_
>
> `[screenshot: dashboard-skills.png]`

> _Knowledge graph_
>
> `[screenshot: dashboard-graph.png]`

---

## Pricing

AI-OS ships as install fee + subscription.

- **Starter** — starting at $X one-time + $Y/month. Core brain, skills pack, single machine.
- **Pro** — starting at $X one-time + $Y/month. Everything in Starter, plus dashboard pro views, priority skill updates, multi-device sync.
- **Team** — custom. Shared brain regions, team-level skills, admin controls.

See the [pricing page](https://example.com/pricing) for current tiers.

The plugin, skills pack, dashboard, and docs in this repo are open source under MIT. The subscription covers licensed distribution, hosted update channels, and support — not your data or your brain folder. Your data is always local and yours.

---

## Documentation

- [Getting started](docs/getting-started.md)
- [Architecture](docs/architecture.md)
- [Skills catalog](docs/skills.md)
- [Roadmap](docs/roadmap.md)
- [Licensing model](plugin/licensing/README.md)

---

## Contributing

We welcome contributions to skills, brain regions, and dashboard views. See [`CONTRIBUTING.md`](CONTRIBUTING.md).

---

## License

MIT for the open-source components in this repository. See [`LICENSE`](LICENSE).

The MIT license covers the plugin, skills, dashboard, and docs. It does not cover the subscription services (licensing server, hosted update channel, support). Those are governed by the terms of your subscription.
