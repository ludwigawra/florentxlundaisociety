# Demo — AI-OS in 3 minutes

The exact script we use to demonstrate AI-OS on stage or in a one-on-one.

**What gets shown**: install → brain scaffolds → Claude Code picks up the hooks and skills → a real conversation against a seeded example brain → the dashboard visualizing everything.

**Prerequisites on the demo machine**:
- `git`, `bash`, Node.js 20+
- [Claude Code](https://docs.claude.com/en/docs/claude-code) installed
- ~3 minutes of terminal time

---

## Step 1 — Install (60 seconds)

```bash
git clone https://github.com/<your-org>/aios.git aios-demo
cd aios-demo

./plugin/scripts/install.sh \
  --target ~/aios-demo-brain \
  --name "Alex Rivera" \
  --role "Solo founder" \
  --company "Axiom" \
  --integrations "gmail,gcal" \
  --with-demo-data
```

**What to point at**: the final "AI-OS is live at..." message. 9 brain regions scaffolded. 10 skills installed. 4 session hooks wired. Git initialized. Demo data seeded.

```text
AI-OS is live at: /Users/you/aios-demo-brain
```

---

## Step 2 — Start Claude Code in the brain (30 seconds)

```bash
cd ~/aios-demo-brain
claude
```

**What to point at**: immediately after Claude starts, the `SessionStart` hook injects a vital-signs block into the conversation. Short-term file count, last consolidation, patterns learned — Claude reads all of this before the first prompt.

---

## Step 3 — Ask Claude something real (60 seconds)

A prompt that shows off the brain:

> "What should I prioritize this week? Use /foresight."

**What happens**:
1. Claude reads the `foresight` skill from `.claude/skills/core/foresight/`
2. Executes its 8-step process — loads goals, decisions, patterns, projects
3. Produces 3–7 ranked priorities with citations back to the actual files in the seeded brain
4. Names one thing to drop

**What to point at**: the priorities reference specific decisions (e.g., "Ship v1 end of month"), specific people (Maya, Marcus), specific companies (Northfield). This isn't generic advice — it's grounded in the brain that was just installed.

Follow-up prompt for drama:

> "Check the status of Marcus. Use /relationship-check."

Claude pulls `SENSORY-CORTEX/people/marcus-vogel.md`, sees the open commitment ("logo variations by 2026-04-24"), cross-references the brand-refresh project, and reports state + next action.

---

## Step 4 — Open the dashboard (30 seconds)

In a second terminal:

```bash
cd ~/aios-demo/dashboard   # the cloned repo's dashboard dir
npm install
AIOS_ROOT=~/aios-demo-brain npm run dev
```

Then open **http://localhost:3000** in the browser.

**What to show**:
- Home: 6 panels — vital signs, active context (from MEMORY.md), brain activity, patterns recognized, decisions made, memory load
- `/r/HIPPOCAMPUS`: the 3 seeded decisions
- `/r/SENSORY-CORTEX`: Maya, Marcus, Northfield
- `/memory`: the full MEMORY.md sectioned by `##` headers
- Click a wiki-link inside a decision → navigates to the linked entity

---

## Closing line

> "The brain is a folder on your machine. Claude reads it at every session start. Skills write to it. The dashboard visualizes it. Your knowledge compounds. That's the whole product."

---

## If something breaks mid-demo

1. **Claude doesn't see the skills** — restart Claude (`Ctrl+C`, `claude` again). Local skills in `.claude/skills/` load at session start.
2. **Dashboard won't build** — `node --version` must be ≥ 20. The repo assumes Node 20+.
3. **SessionStart hook is silent** — check `chmod +x ~/aios-demo-brain/.claude/hooks/*.sh`. The installer runs chmod but macOS permissions can be fickle.
4. **Total fallback** — the `plugin/scripts/smoke-dashboard.sh` script runs the whole pipeline end-to-end non-interactively. Shows green if install + dashboard are healthy. Great to run as a pre-demo check.

---

## What to say if asked

- **"Is this secure?"** — The brain is local files. The plugin runs local shell scripts. No cloud. No telemetry. The licensing stub is dev-mock for now.
- **"Can I use it with my own data today?"** — Yes. Install without `--with-demo-data` and start writing your own notes, or let Claude write them via skills.
- **"What about updates?"** — `/aios-update` skill diffs plugin files against installed files, prompts per conflict, never touches user data in brain folders. Non-destructive by design.
- **"Roadmap?"** — P2: complete the optional skills pack (morning-briefing, email-triage). P3: real ed25519 licensing. P4: dashboard polish + a11y. P5: marketplace submission.
