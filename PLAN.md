# AI-OS — Working Plan

Concrete tasks in priority order. Strategic roadmap lives in `docs/roadmap.md`.
Each task is sized to fit in one `/loop` iteration (with verify step).

---

## P0 — Baseline gates (must pass before anything else)

- [ ] **Dashboard baseline build** — `npm install` in `dashboard/`; `npm run typecheck` and `npm run build` both pass. Fix any scaffold-level type errors. Creates `dashboard/package-lock.json`.
- [ ] **Plugin smoke test** — validate `plugin/.claude-plugin/plugin.json` and `plugin/.claude-plugin/marketplace.json` are well-formed JSON; hooks are executable (`chmod +x`); `plugin/settings.template.json` is valid JSON with four hooks wired.
- [ ] **Root workspaces** — `npm install` at repo root resolves both workspaces cleanly.

## P1 — Missing core skills (shipped-with-plugin, always on)

Currently shipped in `plugin/skills/core/`: `brain-search`, `decision-check`, `nightly-brain-consolidation`.

- [ ] `reflect` — on-demand strategic reflection across goals, decisions, corrections.
- [ ] `foresight` — forward-looking weekly priorities from goals, calendar, pipeline, patterns.
- [ ] `project-status` — quick status check on any active project in `MOTOR-CORTEX/`.
- [ ] `thalamus-calibration` — nightly improvement of the signal detector that injects context.

## P2 — Optional (integration-gated) skills

Under `plugin/skills/optional/`, gated at install time by the integrations the user enabled in `/aios-init`.

- [ ] `morning-briefing` (requires Gmail + GCal).
- [ ] `email-triage` (requires Gmail).
- [ ] `meeting-prep` (requires GCal).
- [ ] `relationship-check` (standalone — reads `SENSORY-CORTEX/people/`).
- [ ] `brain-dump-content` (requires content pillars set).
- [ ] `content-interview` (requires content pillars set).

## P3 — Plugin completeness

- [ ] `plugin/assets/` directory with placeholder screenshot files referenced by `marketplace.json`.
- [ ] `/aios-update` skill — pulls new skills/hooks/templates on `npm update` without touching user data.
- [ ] Validate `$CLAUDE_PLUGIN_ROOT` env var by installing the plugin against the reference AI-OS and inspecting; adjust hook paths in `settings.template.json` if needed.
- [ ] Real-world dry-run of `/aios-init` against an empty temp directory. Verify: folders scaffolded, templates substituted, hooks wired, initial commit created.

## P4 — Licensing (real implementation)

- [ ] Replace the dev stub in `plugin/licensing/check.ts` with real ed25519 `node:crypto.verify`.
- [ ] Embed a real public key; document the rotation strategy (N trusted keys).
- [ ] 14-day grace window logic with user-visible messaging in the `/aios-init` flow.
- [ ] License obtain flow (email → signed license file delivery) — at least a placeholder endpoint stub.
- [ ] Tier enforcement hooks (Starter / Pro / Team) — mostly metadata for now, real gating in Phase 5.

## P5 — Dashboard polish

Scaffold is complete. Next passes:

- [ ] Loading skeletons for the six home-page panels.
- [ ] Empty states when `AIOS_ROOT` points at a fresh (post-init) brain.
- [ ] Accessibility: keyboard nav for region list, ARIA labels on panels, color-contrast check on dark theme.
- [ ] Error boundary component + graceful fallback when filesystem read fails.
- [ ] Search page: tag facet + type facet working with multi-select.
- [ ] Wiki-link tooltip with frontmatter preview on hover.
- [ ] Configurable time windows for Brain Activity (query param `?days=`).
- [ ] Optional ESLint config on top of Next defaults.

## P6 — Distribution

- [ ] Publish to Claude Code plugin marketplace.
- [ ] Landing site (separate repo or `/site` workspace).
- [ ] Pricing page with tier comparison.
- [ ] Demo video: install → init → first session → consolidation → dashboard open.
- [ ] Example archetype brains (operator / researcher / creator).

---

## Decisions pending

These need to be resolved before or during the tasks that touch them. Captured so they don't block a loop iteration silently.

- **Plugin registry name** — `aios` vs `second-brain` vs other. Docs currently say `claude plugin add aios`.
- **Brain install path default** — `~/AI-OS/` (current docs) vs `~/.aios/` vs user-chosen in `/aios-init`.
- **Plugin env var for hook paths** — `$CLAUDE_PLUGIN_ROOT` vs `$CLAUDE_PROJECT_DIR`; confirm at smoke test.
- **Transcript format** emitted by `SessionEnd` hook — `.jsonl` vs `.md`. Affects consolidation parser.
