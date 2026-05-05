# AI-OS — Working Plan

Concrete tasks in priority order. Strategic roadmap lives in `docs/roadmap.md`.
Done work lives in `PROGRESS.md`.

---

## P0 — Production readiness

- [ ] **Real plugin install** — Ludwig runs the 7-step interactive runbook at `docs/install-test.md` in his own Claude Code session. Static audit done 2026-05-05 (all JSON valid, hook env-vars resolve correctly, recursive skill discovery confirmed). Only the live install + `/aios-init` walkthrough is outstanding.
- [ ] **Repo rename** — GitHub Settings rename `florentxlundaisociety → aios`, then run `bash scripts/post-rename.sh` (updates git remote + 4 hardcoded URLs in README.md, docs/getting-started.md, plugin.json, marketplace.json).
- [x] **README polish** — done 2026-05-05. No `$X/$Y` or `example.com` references remain (cleaned in earlier pass). Added `archive/` to brain-folders table; fixed "10 regions" prose; added `aios-help` to skills list and quickstart commands.
- [ ] **New-skill audit** — sanity-read the autonomy skills (`forge-skill`, `nightly-goal-pursuit`, `behavioral-learning`, `auto-outreach-queue`) end-to-end against the renamed brain. Confirm every path reference uses the new folder names. Confirm graceful failure when preconditions miss (no goals, no people files, no autonomous-runs ledger yet).
- [ ] **Optional skills smoke** — install with `--integrations gmail,gcal`, confirm `meeting-prep` and `relationship-check` land; install with `--integrations none`, confirm they don't.

## P1 — Licensing (real implementation)

- [ ] Replace stub in `plugin/licensing/check.ts` with real ed25519 `node:crypto.verify`.
- [ ] Embed a real public key; document rotation strategy (N trusted keys).
- [ ] 14-day grace window with user-visible messaging in `/aios-init`.
- [ ] License obtain flow stub (email → signed license file delivery).
- [ ] Tier metadata wiring (Starter / Pro / Team).

## P2 — Optional skills still planned

Under `plugin/skills/optional/` — gated at install time by integrations chosen in `/aios-init`.

- [ ] `morning-briefing` (requires Gmail + GCal).
- [ ] `email-triage` (requires Gmail).
- [ ] `brain-dump-content` (requires content pillars set).
- [ ] `content-interview` (requires content pillars set).

## P3 — Distribution

- [ ] Submit to Anthropic plugin marketplace.
- [ ] Landing site (separate repo or `/site` workspace).
- [ ] Pricing page.
- [ ] Demo video: install → init → first session → consolidation.
- [ ] Example archetype brains (operator / researcher / creator).

---

## Decisions pending

- **Plugin env var for hook paths** — `${CLAUDE_PLUGIN_ROOT}` (per `aios-init` spec) vs `$CLAUDE_PROJECT_DIR` (per current generated `settings.json`). Reconcile before P0 install can be reliable.
- **Brain install path default** — current docs imply user-chosen via `/aios-init`; some scripts assume `~/AI-OS/`. Pick one and document it.
- **Transcript format** emitted by `SessionEnd` hook — `.jsonl` vs `.md`. Affects consolidation parser.
