# Getting started

This walkthrough takes you from zero to a running AI-OS in about five minutes.

---

## Prerequisites

- Claude Code installed (`claude` on your path)
- Node.js 20 or newer
- A terminal you're comfortable in

---

## 1. Install the plugin

```bash
claude plugin add aios
```

This registers the AI-OS plugin with your Claude Code installation. It does not yet create a brain — that happens next.

> `[screenshot: install-plugin.png]`

---

## 2. Activate your license

On first use, AI-OS will prompt for a license key. Paste the key you received after purchase.

```
? Enter your AI-OS license key: ········
  License validated. Tier: Pro. Expires: 2027-04-18.
```

Your license is stored in `~/.aios-license` as a signed file. It never leaves your machine except during initial verification. For details on the licensing model, grace periods, and what happens at expiration, see [`plugin/licensing/README.md`](../plugin/licensing/README.md).

> `[screenshot: license-prompt.png]`

---

## 3. Initialize the brain

Run Claude Code in any directory and call the init command:

```bash
claude
> /aios-init
```

This creates the brain scaffold at `~/AI-OS/` (or a custom path if you override it):

```
~/AI-OS/
├── CLAUDE.md
├── MEMORY.md
├── risks.md
├── memory/
├── learning/
├── knowledge/
├── projects/
├── routines/
├── blueprints/
├── voice/
├── system/
└── archive/
```

The init skill will ask a handful of questions to personalize `CLAUDE.md` (your name, your work context, your preferences). Nothing is sent anywhere — answers are written directly to your brain folder.

> `[screenshot: aios-init-walkthrough.png]`

---

## 4. Connect the brain stem

AI-OS reads your brain at the start of every session. For this to happen from any directory, add a one-line pointer to your global Claude Code instructions at `~/.claude/CLAUDE.md`:

```markdown
# My system is AI-OS. The brain lives at ~/AI-OS/.
# On every session, read ~/AI-OS/CLAUDE.md before starting real work.
```

`/aios-init` offers to do this for you. If you prefer to manage your own global instructions, decline the prompt and add the pointer yourself.

---

## 5. Launch the dashboard

The dashboard is a local Next.js app that renders your brain.

```bash
git clone https://github.com/example/aios
cd aios
npm install
AIOS_ROOT=~/AI-OS npm run dev
```

Open `http://localhost:3000`. You should see your brain's regions, recent short-term memory, and a graph view.

> `[screenshot: dashboard-first-launch.png]`

---

## 6. First real session

Start Claude Code in any directory. Ask it to do something substantive — plan a week, draft an email, research a topic, outline a project.

Three things happen automatically:

1. The `SessionStart` hook creates `memory/short-term/session-YYYY-MM-DD-<topic>.md` and injects context.
2. As you work, Claude writes decisions and learnings to that file.
3. The `SessionEnd` hook archives the full transcript to `memory/short-term/transcripts/`.

Open the dashboard and you'll see the session appear under "Short-term memory."

> `[screenshot: first-session-short-term.png]`

---

## 7. Let it consolidate

After a few sessions, let the nightly consolidation run. This is a scheduled skill that:

- Reads archived transcripts for feedback signals.
- Routes feedback to `learning/skill-feedback/<skill>.md`.
- Extracts patterns from corrections.
- Improves skills when enough feedback accumulates.

You can run it manually any time:

```bash
claude
> /nightly-consolidation
```

Or schedule it (recommended). See [`docs/skills.md`](skills.md) for scheduling patterns.

> `[screenshot: consolidation-output.png]`

---

## Next steps

- Read [`docs/architecture.md`](architecture.md) to understand the brain model in depth.
- Browse [`docs/skills.md`](skills.md) to see what ships out of the box.
- Check [`docs/roadmap.md`](roadmap.md) for what's coming.
- Start populating `knowledge/people/` and `knowledge/companies/` with the people and organizations in your world. This is where compound context comes from.

---

## Troubleshooting

**The session hook didn't create a short-term file.**
Check `~/.claude/hooks.log` for errors. Most commonly this is a missing `AIOS_ROOT` env var or a plugin install that didn't fully link.

**The dashboard shows "No brain found."**
Ensure `AIOS_ROOT` points to your brain folder when launching `npm run dev`. The default is `~/AI-OS`.

**My license stopped working.**
Subscriptions have a 14-day grace window. Re-enter your license key or contact support. Your data is never locked — only the plugin's hooks pause.

**Claude isn't reading the brain at session start.**
Verify your `~/.claude/CLAUDE.md` contains the pointer from step 4. The brain stem pointer is what makes every session connect.
