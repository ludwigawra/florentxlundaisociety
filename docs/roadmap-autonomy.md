# From Memory System → Personal Assistant That Acts Like You

The strategic roadmap. How AI-OS gets from "brain on disk that remembers" to "assistant that follows you around, knows you, and acts like you."

## The five pillars

Every competitor plays in one or two of these. AI-OS plays in all five. The moat is the combination.

| Pillar | The claim | The proof |
|---|---|---|
| **Persistence** | "It remembers." | Files on disk, git-versioned, structured regions |
| **Ubiquity** | "It follows you." | Global brain-stem fires in every Claude session, every repo |
| **Connection** | "It sees everything." | Hooked into Gmail, Calendar, Notion, Drive, WhatsApp, (more to come) |
| **Behavioral learning** | "It learns *how you work*, not just what you said." | Consolidation reads raw transcripts + autonomous-run outcomes, extracts behavioral patterns (*not* content), and rewrites its own triggers and defaults |
| **Agency** | "It acts like you." | Nightly autonomous skills, voice-matched drafts, review queue |

Memory products stop at pillar 1. Personal-AI products claim 1+5 but lose on 2, 3, and 4 (they're cloud-locked black boxes that store what you *said*, not what you *did*). AI-OS holds all five.

### Why the behavioral-learning pillar is the real moat

Every other memory system works on **content signals** — the words you type, the files you save, the notes you take. AI-OS also works on **behavioral signals** — the patterns the system observes across your usage:

- You edit out every exclamation mark → skill stops writing them
- You abandon `/foresight` when under deadline pressure → the brain infers "when stressed, switch to `/decision-check` instead"
- You approve 90% of investor drafts unedited but heavily edit product drafts → voice fingerprint splits by context
- You always open the dashboard Sunday at 6pm → morning-briefing shifts to evening-review for that day
- You haven't logged a decision on a goal in 14 days → brain surfaces a check-in skill unprompted

You don't write these rules. The brain *infers* them by watching. That's what an assistant who's been with you five years looks like — not an assistant with a bigger RAG.

**What makes this possible in AI-OS and impossible in a memory MCP:**

1. **Raw transcripts are archived** — the SessionEnd hook preserves the full session, not just its outputs
2. **Autonomous-run outcomes are ledgered** — we know what the brain did and whether you kept it
3. **The consolidation skill can edit other skills** — behavior patterns become triggers and defaults automatically
4. **The brain stem fires in every session** — a single cross-repo substrate for observation

No standalone memory product ships hooks. No MCP-memory product runs nightly code. No "second brain" app mutates its own skills. This pillar requires the full operating-system footprint AI-OS already has.

## Where we are today

### ✅ Shipped (and visible in the demo)

**Persistence**
- 13-region brain structure (HIPPOCAMPUS, CEREBELLUM, SENSORY-CORTEX, MOTOR-CORTEX, BROCA, BASAL-GANGLIA, PROCEDURAL-MEMORY, META-COGNITION, AMYGDALA, …)
- Frontmatter-typed entities, wiki-linked graph
- Git-backed, local, grep-able
- Short-term → long-term promotion pipeline
- MEMORY.md as explicit user-triggered long-term store
- Reference brain has accumulated 28 decisions, 33 people/companies, and 53 archived sessions within the first 18 days of use

**Ubiquity**
- Global brain-stem at `~/.claude/CLAUDE.md` — every Claude session loads the brain regardless of cwd
- 4 hooks (SessionStart, SessionEnd, PostToolUse, UserPromptSubmit) wired into every session
- THALAMUS keyword-based intent router already activating regions by topic

**Connection**
- Hook points for every claude.ai MCP (Gmail, GCal, Drive, Notion, Supabase, Miro)
- Skills call those MCPs where relevant
- `SENSORY-CORTEX/` is the structured store for external data once ingested

**Agency**
- `nightly-brain-consolidation` (11-phase consolidation, runs autonomously)
- `thalamus-calibration` (intent detector tunes itself)
- Skill self-improvement loop (3+ feedback signals → edits `SKILL.md`)
- `nightly-goal-pursuit` (advances one stalled goal overnight)
- `reflect` / `foresight` / `project-status` / `decision-check` / `brain-search` — decision-grade introspective skills

### ⚠️ Demo-critical gaps — **72-hour build list**

These close the gap between "this is memory" and "this is a personal assistant that acts like you." Must ship before pitch.

| Priority | Gap | What unblocks it | Cost |
|---|---|---|---|
| 🔴 P0 | **No scheduler** — nightly skills fire only when user invokes them. Undermines the "while you sleep" claim. | `plugin/scripts/schedule.sh` installs launchd (macOS) / cron (linux) entry. One-shot. | 1h |
| 🔴 P0 | **No autonomous-run ledger** — invisible when things fire. | Shared `BASAL-GANGLIA/autonomous-runs.jsonl`. Every autonomous skill appends. Dashboard panel shows last 7 days. | 45m |
| 🔴 P0 | **Only one "acts like you" skill** (`nightly-goal-pursuit`). Need a second to show range. | `auto-outreach-queue` — scans SENSORY-CORTEX/people, ranks by staleness × open commitments × goal relevance, drafts N personalized follow-ups. | 1h |
| 🟡 P1 | **No pending-review queue** in dashboard — user can't see "3 things my assistant did, waiting for me." | New panel reading the ledger filtered by `status=pending-review`. | 30m |
| 🟡 P1 | **"Connection" is invisible in UI** — no "Gmail last seen 4m ago" signal. | `Connected sources` panel reading per-integration last-activity markers. Derives from tool-errors.log + hook state. | 30m |
| 🟡 P1 | **Hero framing still reads "dashboard"** not "control center." | Headline copy tweak + one-line narrative blocks above each major panel. | 15m |
| 🟡 P1 | **Behavioral-learning is a claim with no visible proof** | New skill `behavioral-learning` runs nightly after consolidation. Reads transcripts + autonomous-run outcomes + usage frequency. Writes inferred behavioral patterns to `CEREBELLUM/behavioral-patterns.md`. Dashboard panel surfaces the 5 most recent inferences. | 1.5h |

### 🟢 Post-demo (30-day build)

**Voice that gets sharper over time**
- `voice-fingerprint` skill — reads 20 past LinkedIn posts, 10 emails, 5 pitches. Extracts tone rules (sentence length, opener patterns, anti-patterns). Writes to `BROCA/voice-fingerprint.md`.
- Every draft any skill produces is run through the voice fingerprint before delivery.
- Nightly: when new writing shows up, refresh the fingerprint.

**Smarter intent routing**
- Replace keyword-based THALAMUS with a small-model classifier (Haiku call) for higher-precision region activation.
- Dashboard panel: precision/recall on region activation over time.

**Source ingestion as a first-class pattern**
- Every integration gets a `sensory-ingest-<source>` skill with a consistent contract: read source → write typed file to `SENSORY-CORTEX/<category>/` → log to ledger.
- Health view in dashboard: coverage, last ingest, error rate per source.

**Autonomous-skill expansion pack**
- `weekly-review-prep` — assembles Monday's foresight inputs overnight every Sunday
- `decision-followup` — scans decisions older than 14 days for "did this actually happen?" check-ins
- `content-pipeline` — picks a brain-dump, drafts a LinkedIn post in voice, queues for review
- `meeting-prep` (already drafted, not wired to cron)
- `morning-briefing` (already drafted, not wired to cron)

**Review queue UX**
- Keyboard-first triage: J/K to navigate drafts, A to approve, E to edit, D to discard.
- Approved drafts auto-send via the right MCP (Gmail create+send, WhatsApp send, LinkedIn) — with one-click confirmation.

**Observability**
- `/system-observatory` skill — benchmarks patterns produced, skills calibrated, corrections extracted per week.
- Memory-benchmark: "here's what your brain knew 30/60/90 days ago vs today."

### 🔵 The long vision (6-month bets)

1. **MCP gateway** — AI-OS becomes an MCP provider. Any Claude client (desktop, mobile, third-party) can load the brain over MCP. Expands market from Claude Code users to every Claude user.
2. **Team brains** — two users with overlapping `SENSORY-CORTEX/` (shared people, companies, decisions) but isolated CEREBELLUM/BROCA. Co-founders, agencies, partners.
3. **Brain marketplace** — procedural-memory templates shared across users. "Install the founder-fundraise pack." Skills too.
4. **Cross-model portability** — plugin layer so the brain works with GPT-5, Gemini, local models. Today it's Claude-specific; the folder is already model-agnostic.
5. **Autonomous negotiation / execution** — the assistant doesn't just draft, it sends. Gates via a single approval channel (Telegram, mobile). Full L2 loop becomes real.
6. **Longitudinal benchmarks** — publish anonymized aggregate data. "After 90 days on AI-OS, users recover N hours/week of context re-explanation." Credible sales artifact no competitor has.

## Why this order

The 72-hour list is ruthlessly ranked by **demo truth value**. Every item on it is something that, if missing, would let a skeptic say "but it doesn't actually _do_ that." The post-demo 30-day list is ranked by **conversion leverage** — things that turn a "cool" reaction into a subscription. The 6-month list is ranked by **market defensibility** — things that make AI-OS hard to copy once others notice.

## Framing moves (non-code)

**Stop saying:**
- "Persistent memory for Claude" (commodity framing)
- "Second brain" (Notion / Roam own that phrase)
- "Local-first personal AI" (Rewind poisoned this — dead product)

**Start saying:**
- "One assistant. Every workflow. Acts like you."
- "Every AI automation fails on context. AI-OS is the context."
- "Not memory. A brain that follows you around and does the work."
- "While you sleep, your assistant ships."

## The demo script implication

A 3-minute demo now has five moments (one per pillar + one close):

1. **Install (15s)** — one command, brain appears. *Persistence.*
2. **`cd` anywhere, `claude` — brain loads (20s)** — same context in every repo. *Ubiquity.*
3. **Ask one real question against a mature brain (45s)** — `/foresight` or `/relationship-check Marcus`. Show the answer cites real decisions, real people. *Connection + Persistence.*
4. **Dashboard: growth curve + last night's consolidation + pending-review queue (45s)** — the compounding shot + the "it acts" shot. *Agency.*
5. **The close (30s)** — *"This is 18 days. Every other AI you've bought stops learning at install. This one wakes up tomorrow smarter than it was tonight. And it works for you while you sleep. Sign up, point at your Gmail, tell it your goals — and never explain yourself to an AI again."*

## Open questions worth deciding before pitch

- **Pricing.** Still placeholder in README. The positioning doc says $33/mo (Personal.ai ceiling) is reasonable. Decision needed.
- **First-run experience.** `aios-init` is conversational (8 questions). Good for depth, slow for demo. Do we ship a "skip — use defaults" path?
- **Privacy messaging.** We say "local, yours." Do we write a 1-pager on data handling before the pitch, to pre-empt the first investor question?
- **Positioning against Anthropic.** Claude memory is shipped. Is AI-OS *with* Anthropic (complement) or *despite* Anthropic (replacement)? This decides the pitch tone.

These aren't build tasks. They're alignment decisions that change the pitch deck.
