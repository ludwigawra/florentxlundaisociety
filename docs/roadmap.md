# Roadmap

AI-OS is built in five phases. Each phase is complete before the next begins — this keeps the system coherent and the work shippable.

---

## Phase 1 — Skeleton

**Goal:** The brain exists and connects to Claude Code.

- [x] Brain region structure (folders, templates, conventions)
- [x] Plugin scaffold with `SessionStart`, `SessionEnd`, `PostToolUseFailure` hooks
- [x] Short-term memory auto-creation per session
- [x] Transcript archiving on session end
- [x] Brain-stem pointer pattern (global `~/.claude/CLAUDE.md`)
- [x] `/aios-init` installer skill
- [x] Root `CLAUDE.md`, `MEMORY.md`, `AMYGDALA.md` templates
- [x] Basic plugin manifest

**Outcome:** A user can install AI-OS, run `/aios-init`, and have Claude read their brain at every session start.

---

## Phase 2 — Skills pack

**Goal:** Compound value through skills that read and write to the brain.

- [x] `brain-search` — context retrieval before work starts
- [x] `decision-check` — contradiction prevention
- [x] `morning-briefing` — daily prioritization
- [x] `email-triage` — inbox processing
- [x] `meeting-prep`, `relationship-check`, `project-status` — relational/operational skills
- [x] `brain-dump-content`, `content-interview` — content pipeline
- [x] `reflect`, `foresight` — strategic reflection and planning
- [x] `nightly-brain-consolidation` — the learning loop
- [x] `thalamus-calibration` — meta-level self-improvement
- [x] Skill feedback file convention (`CEREBELLUM/skill-feedback/<skill>.md`)
- [x] Calibration status progression (`learning` → `calibrated` → `graduated`)

**Outcome:** A user has a working, improving skill set out of the box. Skills read from and write to the brain. Feedback flows into calibration automatically.

---

## Phase 3 — Licensing

**Goal:** Sustainable business model without compromising user data sovereignty.

- [ ] License key schema and file format (`plugin/licensing/schema.ts`)
- [ ] License check implementation with ed25519 signature verification (`plugin/licensing/check.ts`)
- [ ] 14-day grace window on expiration, with clear user messaging
- [ ] Soft-fail behavior — expired licenses pause plugin hooks but never lock user data
- [ ] Purchase flow and license delivery (email-based)
- [ ] Tier enforcement: Starter, Pro, Team
- [ ] License refresh and renewal flow
- [ ] Support channel for license issues

**Outcome:** The plugin verifies a license on first use and periodically thereafter. If the license is invalid or expired beyond grace, hooks stop firing and a clear message is shown. The user's brain folder remains fully readable and editable regardless.

---

## Phase 4 — Dashboard

**Goal:** A local, account-free web interface for the brain.

- [ ] Brain regions browser — navigate the folder structure
- [ ] Markdown rendering with frontmatter parsing and wiki-link navigation
- [ ] Short-term memory view — active sessions and recent activity
- [ ] Decisions timeline — chronological view of `HIPPOCAMPUS/decisions/`
- [ ] Skill calibration panel — usage, approval rates, calibration status per skill
- [ ] Graph view — entities and their links across the brain
- [ ] Search — full-text across the brain folder
- [ ] Vital signs dashboard — unextracted corrections, last consolidation, short-term file count
- [ ] Pro-tier views — extended analytics, calibration history charts, cross-skill comparisons
- [ ] Auto-launch from `/aios-init`

**Outcome:** A user can open `localhost:3000` and understand the state of their brain at a glance. The dashboard reads the filesystem directly and holds no state of its own.

---

## Phase 5 — Distribution

**Goal:** Ship, onboard, and sustain.

- [ ] Plugin registry listing and installable via `claude plugin add aios`
- [ ] Landing site with clear pricing, demo, and docs
- [ ] Paid plans live (Starter, Pro, Team) with license issuance on purchase
- [ ] Onboarding flow: install → license → init → first session → first consolidation
- [ ] Demo video showing a realistic week with AI-OS
- [ ] Example brains for different user archetypes (operator, researcher, creator)
- [ ] Feedback and issue channels
- [ ] Monthly release cadence for skills pack updates
- [ ] Opt-in telemetry for aggregate skill calibration (never content, always anonymous)
- [ ] Team tier: shared brain regions, role-based access within a single brain

**Outcome:** AI-OS is something a solo operator can find, buy, install, and grow with over months and years. Updates ship regularly. The skill pack gets better in the wild.

---

## Beyond Phase 5

Candidates on the long list — not committed, not scheduled. These become real when the first five phases are shipped and stable.

- Opt-in cloud sync for multi-device users (bring-your-own-storage)
- Mobile companion for capture-only use (voice notes, screenshots into short-term)
- Marketplace for community-contributed skills
- Team brains with role-based access
- Language packs for non-English brains
- Integration layer for Notion, Linear, Obsidian bidirectional sync

None of these are in scope until Phase 5 is done.
