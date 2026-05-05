# Install test runbook

A 5-minute end-to-end verification you run yourself in a fresh Claude Code session before shipping the plugin to anyone else. Catches drift between the plugin manifest, hook wiring, and the `/aios-init` flow.

---

## Pre-flight (static audit, already done)

These were verified by static audit on 2026-05-05:

- ✅ All 4 JSON files parse cleanly: `marketplace.json`, `plugin.json`, `hooks.json`, `settings.template.json`
- ✅ Skill discovery works recursively — Claude Code auto-discovers all 17 skills including those under `core/` and `optional/` subdirectories (per [plugins-reference.md](https://code.claude.com/docs/en/plugins-reference.md))
- ✅ Hook env vars: `${CLAUDE_PLUGIN_ROOT}` (in hooks.json) and `$CLAUDE_PROJECT_DIR` (in scripts) are intentionally separate and resolve correctly to plugin-dir vs user-brain-dir
- ✅ All 4 hooks executable, scripts dry-run cleanly

---

## Test (must run interactively in Claude Code)

### Step 1 — Add the marketplace

In a fresh terminal:

```bash
mkdir -p /tmp/aios-install-test && cd /tmp/aios-install-test
claude
```

Inside Claude Code:

```
/plugin marketplace add ~/Desktop/Awra/Github/ludwigkreisel_florentxlundaisociety
```

Expected: marketplace `aios` registers, lists 1 plugin (`aios v0.1.0`).

### Step 2 — Install the plugin

```
/plugin install aios@aios
```

Expected: install completes, restart prompt appears. Restart Claude Code.

### Step 3 — Verify slash commands appear

In a new Claude Code session in the same `/tmp/aios-install-test` dir:

```
/help
```

Expected: `/aios-init`, `/aios-update`, `/aios-explore`, and `/aios:forge-skill` (or similar namespacing) all appear in the list.

### Step 4 — Run the bootstrap

```
/aios-init
```

Expected: 8-question conversational interview. Answer minimally:

```
Name: Test User
Role: testing
Entity: solo
Use case: solo-founder
Goals: test goal 1; test goal 2; test goal 3
Integrations: none
Pillars: skip
Language: English
Tone: sophisticated
```

Expected after confirm: brain folders scaffold under cwd (`memory/`, `learning/`, `knowledge/`, `projects/`, `routines/`, `voice/`, `system/`, `blueprints/`, `archive/`), `CLAUDE.md` and `MEMORY.md` rendered with token substitution, `.claude/aios.config.json` written, git init + commit `AI-OS initialized`.

### Step 5 — Verify hooks fire

End the session (`/exit`). Start a new one in the same dir.

Expected on session start: a fresh session file appears in `memory/short-term/session-YYYY-MM-DD-{uuid}.md` with frontmatter and section headers. Vital signs block prints at session start: short-term file count, last consolidation date, unextracted corrections.

### Step 6 — Verify a skill runs

```
/aios-explore
```

Expected: lists all 17 skills installed, grouped by core / optional / top-level.

### Step 7 — Tear down

```
/exit
rm -rf /tmp/aios-install-test
```

Inside Claude Code (in any session):

```
/plugin uninstall aios@aios
```

---

## Pass criteria

All 7 steps succeed without errors. Any of:

- ❌ Slash command not appearing
- ❌ Hook silently failing (no session file created)
- ❌ Token left unsubstituted (`{{user.name}}` visible in rendered file)
- ❌ JSON parse error during install
- ❌ Permission error on hook scripts

…blocks shipping. Capture the exact error and triage before retrying.

---

## Known issues to watch for

1. **Skill duplication** — `/plugin install` exposes skills as `/aios:reflect` etc; `/aios-init` ALSO copies them to `<brain>/.claude/skills/reflect/`. Both work but local takes precedence in Claude Code's resolution. May become an update-conflict source. Open architectural question — see PLAN.md.
2. **Homepage URL** in `marketplace.json` and `plugin.json` points to `github.com/ludwigawra/florentxlundaisociety` — will 404 after the planned repo rename. Update before submitting to Anthropic marketplace.
3. **First-time hook fire timing** — on macOS, the first `bash` invocation in a fresh session can take 200ms+. Hook timeout is 5000ms for SessionStart, plenty of headroom, but watch for `timed out` warnings on slow disks.
