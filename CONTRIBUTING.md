# Contributing to AI-OS

AI-OS is a small, opinionated system with room for contribution in three areas: **skills**, **brain regions**, and **dashboard views**. This guide explains how to propose and ship changes in each.

Before you start, please open an issue describing what you want to do. AI-OS values coherence over coverage — a well-designed skill beats three adequate ones.

---

## Repository layout

```
plugin/
  .claude-plugin/     plugin manifest
  skills/             shipped skills (one folder per skill)
  hooks/              session hooks (SessionStart, SessionEnd, PostToolUseFailure)
  templates/          brain region templates installed by /aios-init
  licensing/          subscription license check
dashboard/
  src/                Next.js app — brain browser and views
docs/                 architecture, getting started, skills, roadmap
```

---

## Adding a new skill

A skill is a named behavior Claude can invoke. Each skill lives in `plugin/skills/<skill-name>/` and includes:

- `SKILL.md` — the skill definition, invocation conditions, and prompt
- `README.md` — short description, inputs, outputs, example
- optional: helper scripts, prompts, or templates

**Before adding a skill, ask:**

1. **Does this belong as a skill, or is it a one-off?** Skills are for repeated, compound behaviors — not single commands.
2. **What brain region does it read from, and what does it write to?** Every skill should name its reads and writes. A skill that doesn't touch the brain is usually a raw tool, not a skill.
3. **How will it improve?** Every skill has a feedback file at `CEREBELLUM/skill-feedback/<skill-name>.md`. If you can't describe what good vs. bad output looks like, the skill won't calibrate.

**Process:**

1. Open an issue proposing the skill. Describe the trigger, the inputs, the outputs, and the brain regions it touches.
2. Create `plugin/skills/<skill-name>/SKILL.md` following the format of existing skills (start with `brain-search` or `morning-briefing` as references).
3. Add an entry to `docs/skills.md`.
4. If the skill produces files, add any templates to `plugin/templates/`.
5. Submit a PR with an example invocation in the description.

---

## Adding a new brain region

Brain regions are top-level folders in the user's AI-OS directory. They are opinionated — adding one is a design decision, not a feature request. The current regions (Hippocampus, Cerebellum, Sensory Cortex, Motor Cortex, Basal Ganglia, Procedural Memory, Broca, Amygdala, Meta-Cognition) were chosen to cover distinct cognitive functions without overlap.

**Before proposing a new region, ask:**

1. **Does this fit in an existing region?** Most proposed new regions are subfolders of existing ones.
2. **What's the cognitive analog?** If you can't name the brain function, it probably isn't a region.
3. **What reads from it and writes to it?** A region with no readers or no writers is dead weight.

**Process:**

1. Open an RFC issue. Include: the cognitive analog, the reads/writes, how it differs from existing regions, and what would break without it.
2. If accepted, add a template folder to `plugin/templates/<REGION-NAME>/` with a `README.md` explaining the region.
3. Update `docs/architecture.md` to describe the new region.
4. Update `plugin/templates/CLAUDE.md` (the root brain identity file) to reference the new region.

---

## Proposing a new view type (dashboard)

The dashboard renders the brain. A "view" is a route in `dashboard/src/app/` that presents a slice of the brain in a specific way — regions browser, short-term memory, graph, skill calibration, etc.

**Before proposing a view, ask:**

1. **What question does this view answer?** A view without a clear question is a dashboard cemetery entry.
2. **What files does it read?** Views should read the user's brain folder directly — no intermediate database.
3. **Does it need state?** The dashboard is local-first and account-free. If a view requires server state beyond the filesystem, reconsider.

**Process:**

1. Open an issue with a mock or sketch. Describe the question the view answers.
2. Implement under `dashboard/src/app/<view-name>/page.tsx`.
3. Keep reads filesystem-native. Use `gray-matter` for frontmatter and `react-markdown` for rendering.
4. Add a nav link in the dashboard layout.
5. Submit a PR with a screenshot.

---

## Development

```bash
npm install
npm run dev         # dashboard at http://localhost:3000
npm run typecheck   # type-check all workspaces
npm run lint        # lint all workspaces
```

To test the plugin end-to-end against a local brain, set `AIOS_ROOT=/path/to/test-brain` and run the dashboard against it.

---

## Code style

- TypeScript. No `any` without a comment explaining why.
- Functional React components. No class components.
- Plain markdown in brain files. No custom extensions beyond YAML frontmatter and wiki-links.
- Keep skills small. If a skill prompt gets long, it's doing too much.

---

## Commit and PR conventions

- One concern per PR.
- Commit messages: imperative mood, one line under 72 chars, optional body.
- PRs must include: what changed, why, how to test.

---

## License

By contributing, you agree that your contributions are licensed under the MIT License (see [`LICENSE`](LICENSE)).
