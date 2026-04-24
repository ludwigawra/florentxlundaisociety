---
name: aios-update
description: Non-destructive update for an installed AI-OS. Pulls new skills, hooks, and templates from the current plugin version into the user's `.claude/` directory without ever touching the brain folders (memory, learning, MEMORY.md, etc.). Use after the user upgrades the plugin (`npm update @aios/plugin` or plugin marketplace auto-update) to sync their local AI-OS with the new plugin version. Handles added skills, changed core skills, removed skills, new hooks, and template changes. Prompts before overwriting any file the user has modified.
---

# AI-OS Update

Sync an installed AI-OS with the current plugin version. This is the mechanism that makes the subscription model honest — users keep getting new skills and hook improvements without ever losing their data or their customizations.

The rule that governs every step: **the brain belongs to the user.** The plugin owns `.claude/skills/`, `.claude/hooks/`, `.claude/settings.json` (hook entries only), and the plugin-shipped templates. Everything else — `memory/`, `learning/` content, `MEMORY.md`, `projects/`, `knowledge/`, `voice/`, `system/context/`, `risks.md` — is user data and must never be touched by an update.

## When to use

Invoke this skill whenever any of the following apply:

- The user just ran `npm update @aios/plugin` and wants to apply the changes to their installed AI-OS
- The plugin marketplace auto-updated and the user is being guided to sync local state
- A specific new skill has been announced and the user wants to pull only that one
- The user suspects their install has drifted from the plugin version and wants a dry-run diff

Do not invoke on a fresh install — use `/aios-init` instead. Update only runs against an existing AI-OS (presence of `aios.config.json` or `CLAUDE.md` at the root).

## Inputs

The caller may provide:

- **Mode** — `diff` (default, read-only report), `apply` (execute the update with a confirmation per conflict), or `apply-all` (execute non-interactively — used only when the user explicitly wants to skip the per-conflict prompt)
- **Scope** — `all` (default), or a specific area: `skills`, `hooks`, `templates`, `settings`
- **Skill filter** — optional list of skill names to restrict the update to (e.g. `--only morning-briefing,reflect`)

## Process

### 1. Locate both trees

- **Plugin tree** — the freshly updated plugin. Resolve via `$CLAUDE_PLUGIN_ROOT` if set, otherwise walk up from this skill file to find the `plugin/` directory.
- **User tree** — the installed AI-OS, rooted at the cwd or at the path in `$CLAUDE_PROJECT_DIR`. Confirm presence of `aios.config.json` or a `CLAUDE.md` with the expected structure. If neither is present, refuse — this is not an installed AI-OS.

### 2. Compare the plugin version

Read `aios.config.json` from the user tree and `plugin/.claude-plugin/plugin.json` from the plugin tree. Report the upgrade path ("upgrading from 0.1.0 → 0.2.0"). If the installed version is newer than the plugin, stop and flag — the user has an incompatible state, likely from using a pre-release.

### 3. Diff skills

For each directory under `plugin/skills/`:

- **Added** — exists in plugin, not in `.claude/skills/`. Action: install.
- **Unchanged** — exists in both, contents identical. Action: no-op.
- **Plugin-updated, user-unchanged** — plugin version newer, user's copy is byte-identical to the last-known-shipped version. Action: update.
- **User-modified** — user has edited their copy (byte diff against the shipped baseline). Action: prompt the user with a diff, choices are `overwrite` / `keep-user` / `keep-both` (user copy renamed to `<skill>.local.md` for inspection).
- **Plugin-removed** — exists in user tree, not in plugin. Action: flag, do not delete. Propose archival to `.claude/skills/archive/`.

Track the "last-known-shipped version" by hashing the skill file at install or last update. Store the hash map in `.claude/skills/.shipped-hashes.json`. On first update run after installing a version that predated this hash tracking, treat every present file as "unknown baseline" and always prompt (never auto-overwrite).

Optional skills (those under `plugin/skills/optional/`) are only considered if the user's `aios.config.json` integrations list matches the skill's `requires` metadata. Do not install an optional skill that the user did not opt into.

### 4. Diff hooks

Same categories as skills, applied to `.sh` files. Hooks changing is more sensitive than skills — a broken hook can fail every session. After every write, run `bash -n <file>` to syntax-check before leaving. If syntax fails, revert and stop.

### 5. Diff settings

Read `.claude/settings.json` and `plugin/settings.template.json`. Only compare the plugin's own hook entries — do not touch user-added hooks, permissions, env vars, or any other settings.

For each hook event the plugin defines:

- **Missing in user settings** — add it.
- **Present with identical command** — no-op.
- **Present with a different command** — likely a plugin-update of the invocation. Propose the change with a diff; default is `overwrite` only if the command clearly points at the same script name (e.g. both reference `session-start.sh`).
- **User removed it** — leave removed. Do not re-add.

### 6. Diff templates

Templates are only relevant if the user requests a template refresh (usually they do not — templates are a one-time boot artifact). When requested:

- Only surface changes to files the user has not modified since install.
- Never overwrite a template-sourced file the user has edited. Their `CLAUDE.md`, `MEMORY.md`, etc. are their own once installed.

### 7. Produce the report

For `mode=diff` the output is:

```
# AI-OS Update — {plugin-version} → {plugin-version}

## Summary
<counts: added X, updated Y, conflicts Z, removed (flagged) W>

## Skills
<per-skill line with action>

## Hooks
<per-hook line with action>

## Settings
<hook-event lines with action>

## Templates
<only if scope included templates>

## Conflicts requiring your decision
<numbered list, each with a diff preview>

## Safe actions
<list of no-ops and auto-applicable changes>
```

If every change is non-conflicting, offer to proceed by re-running with `mode=apply`. If there are conflicts, present them one at a time.

### 8. Apply phase

In `mode=apply`, process each item in this order:

1. Added files — safe, install them.
2. Plugin-updated, user-unchanged — safe, overwrite.
3. Settings updates that are non-conflicting — apply.
4. Conflicts — prompt per item. Default choice is always the safest (`keep-user` for skills, `prompt for each` for hooks, `leave-as-is` for settings).
5. Plugin-removed — never auto-delete. Move to `.claude/skills/archive/{skill}-YYYY-MM-DD/` if the user accepts archival, or leave in place.

After every file write, update the shipped-hash map. At the end, update `aios.config.json` with the new version and `lastUpdatedAt` timestamp.

Write an update log entry to `.claude/update-log/YYYY-MM-DD-HHMMSS.md` with:

```yaml
---
type: aios-update
from_version: <x>
to_version: <y>
created: YYYY-MM-DDTHH:MM:SSZ
tags: [update, meta]
---
```

Body lists each action with the outcome.

### 9. Rollback

If any step fails (syntax error in a hook, file write error, etc.), restore the entire update to pre-run state from a staging copy. Do not leave a partial update. The staging copy lives in `.claude/.update-staging/`, created at the start and removed on success.

If rollback itself fails for some reason, leave the staging copy in place and instruct the user to restore manually with `mv .claude/.update-staging/* .claude/`.

### 10. Explicitly do not touch

To make this rule unmissable — the update MUST NOT touch any of the following:

- `memory/` (anything inside)
- `learning/corrections.md`, `learning/patterns.md`, `learning/skill-feedback/`, `learning/tool-errors.log`
- `MEMORY.md`, `risks.md`, `CLAUDE.md` (the user's root instructions)
- `knowledge/`, `projects/`, `blueprints/`, `voice/`, `system/context/`, `archive/`
- Any file with a user-added frontmatter marker `aios-owned: user`

If the plugin ever ships a file with a name that would land inside one of these directories, stop and flag. That is a plugin packaging bug, not an update action.

## What to avoid

- Do not auto-overwrite a user-modified skill. The only defensible default is to prompt.
- Do not apply without a diff phase first. "Silent update" is the failure mode that destroys trust in a subscription product.
- Do not skip syntax-checking hook files. A broken hook breaks every session.
- Do not compare against "what the plugin shipped most recently" without a hash map — you cannot reliably detect user edits otherwise.
- Do not run this before the plugin is actually updated. If `plugin.json` version matches the `aios.config.json` version, there is nothing to do — say so and exit.
- Do not auto-install an optional skill the user opted out of. Integration gating is the user's choice.

## Integration with other skills

- If the plugin adds a new hook category, the next session's `session-start.sh` will surface it in its banner — no explicit action from this skill.
- If `signal-calibration` is one of the updated skills and the keyword mapping changed, flag this in the update log so the user knows to recalibrate.
- `nightly-consolidation` reads from the brain folders only and is unaffected by plugin updates (but the skill itself may be updated — the file, not the data it processes).
- If the update introduces a breaking change that requires user migration (rare), the plugin ships a migration script under `plugin/scripts/migrate-<from>-<to>.sh` which this skill invokes after the file sync.
