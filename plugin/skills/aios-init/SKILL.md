---
name: aios-init
description: Bootstrap a new AI-OS in the current directory. Conversational onboarding that scaffolds a brain-inspired personal operating system — persistent memory, learned patterns, and skills that improve over time. Use this the first time a user sets up AI-OS in a repo.
---

# AI-OS Init

You are installing AI-OS — a second brain for Claude Code — in the user's current working directory.

Your job is to make this feel like being welcomed into a well-designed product, not running a script. The tone is calm, confident, minimal. No emojis unless the user uses them first. No corporate phrases. Short lines. One question at a time.

This is a one-time setup. Get it right.

---

## Phase 0 — Pre-flight

Before asking anything, check the current working directory.

**Detect an existing AI-OS.** If the cwd already contains any of the following, the user already has an AI-OS installed:
- `CLAUDE.md` at the repo root that references "AI-OS" or "brain"
- A `HIPPOCAMPUS/` directory
- A `CEREBELLUM/` directory
- An `.aios-license` file (already scaffolded)
- A `.claude/aios.config.json` file

If any of those exist, **stop and refuse**:

> AI-OS is already installed in this directory.
>
> Running `/aios-init` again would overwrite memory, patterns, and skill calibration. If you want to reinstall from scratch, move or delete the existing brain files first, then run this again. If you want to add or update skills, use `/aios-update` instead (coming soon).

Do not proceed. End the skill.

**Confirm cwd is sane.** If the cwd is a user's home directory, `/`, `/tmp`, or anywhere obviously unsafe, warn the user and ask them to `cd` into the repo where they want the brain installed.

---

## Phase 1 — Welcome

Show this once, then begin the interview:

> Welcome to AI-OS.
>
> This is your second brain for Claude Code — persistent memory, learned patterns, and skills that improve over time. Eight short questions and you're set up. Answers get better with a full sentence, but a few words is fine.

Do not narrate the phases. Do not say "now I will ask you eight questions." Just ask Q1.

---

## Phase 2 — The Interview (8 questions, one at a time)

Ask each question in a single short message. Wait for the answer. Do not batch. Do not show a numbered list of all eight upfront. Between questions, a one-line acknowledgment is fine ("Got it.") but keep it minimal.

Store answers internally as a single JSON object so you can substitute tokens later. Use this shape:

```json
{
  "user": {
    "name": "",
    "role": "",
    "company": "",
    "use_case": "",
    "goals": [],
    "integrations": [],
    "pillars": [],
    "language": "English",
    "tone": "sophisticated"
  }
}
```

### Q1 — Identity

> What's your name, and how would you describe what you do in one line?

Parse into `user.name` (first name is fine) and `user.role` (the one-liner, as-is).

### Q2 — Entity

> Are you building this around a company or entity? Name and one line, or say "solo" if it's just you.

If the user says "solo", "none", "just me", etc., set `user.company = ""`. Otherwise store verbatim.

### Q3 — Primary use case

> What's the primary use case you want AI-OS to serve? Pick one: solo founder, operator, researcher, creator, or other (describe).

Normalize to one of: `solo-founder`, `operator`, `researcher`, `creator`, or a short slug if other. Save to `user.use_case`.

### Q4 — 90-day goals

> What are your top three goals for the next 90 days? A short phrase for each — one goal per line is easiest.

Parse up to three goals into `user.goals` as an array of strings. If the user gives more than three, keep the first three and tell them gently that the rest can live in `META-COGNITION/context/goals-metrics.md` after setup.

### Q5 — Integrations

> Which of these do you want to connect? Gmail, Google Calendar, Notion, Slack, WhatsApp, or none. Pick any combination — you can always add more later.

Parse into `user.integrations` as an array of lowercase slugs (`gmail`, `gcal`, `notion`, `slack`, `whatsapp`). If the user says "none" or lists nothing, set it to `[]`.

If the user lists any integration, remember to mention in Phase 5 that connecting the MCP itself happens inside Claude Code (`/mcp` command or the plus menu) and that they can run `/forge-skill <mcp-name>` after connecting to auto-generate intent-wrapped skills for it. See `plugin/docs/mcp-directory.md` for the full list of recommended MCPs.

### Q6 — Content pillars (conditional)

Only ask this question if `user.use_case == "creator"`. Otherwise, ask it as an opt-in:

> One more optional question — do you publish content (LinkedIn, blog, video, etc.)? If yes, what are your two or three content pillars? Say "skip" otherwise.

If the user skips, set `user.pillars = []`. Otherwise parse into `user.pillars` as an array of short strings.

### Q7 — Language

> What language should I default to for written output? Press enter for English.

If the user just confirms or says English, keep `user.language = "English"`. Otherwise store what they say.

### Q8 — Tone

> Last one — preferred tone: sophisticated, casual, or technical?

Normalize to one of those three. Save to `user.tone`.

---

## Phase 3 — Confirm

Echo the eight answers back in a tight block so the user can catch mistakes:

```
Name:          {{user.name}}
Role:          {{user.role}}
Company:       {{user.company or "—"}}
Use case:      {{user.use_case}}
Goals:         {{user.goals joined with "; "}}
Integrations:  {{user.integrations joined with ", " or "none"}}
Pillars:       {{user.pillars joined with ", " or "—"}}
Language:      {{user.language}}
Tone:          {{user.tone}}
```

Then ask:

> Does this look right? Say "yes" to install, or tell me what to change.

Loop on corrections until the user confirms. Never guess.

---

## Phase 4 — Install

Once confirmed, perform the installation as a single flowing step. Do not ask for permission between sub-steps. Show the user a short running progress list as you go — one line per step, one word of status at the end.

**The plugin files live at these absolute paths** (resolve from the installed plugin root, typically `{{PLUGIN_ROOT}}`). When the skill actually runs inside Claude Code, the plugin root is available as the directory containing this SKILL.md's grandparent. Use relative paths from the skill root: `../../.claude-plugin/`, `../../templates/`, `../../skills/core/`, `../../skills/optional/`, `../../hooks/`.

### 4.1 — Render templates

For every file in `plugin/templates/**`, copy it into the user's cwd at the same relative path, substituting these tokens:

| Token | Source |
|---|---|
| `{{user.name}}` | `user.name` |
| `{{user.role}}` | `user.role` |
| `{{user.company}}` | `user.company` (empty string if solo) |
| `{{user.use_case}}` | `user.use_case` |
| `{{user.goals}}` | rendered as a markdown bullet list, one per line |
| `{{user.integrations}}` | comma-joined lowercase slugs |
| `{{user.pillars}}` | comma-joined, or "—" if empty |
| `{{user.language}}` | `user.language` |
| `{{user.tone}}` | `user.tone` |
| `{{today}}` | today's date in `YYYY-MM-DD` |

Replace all occurrences. If a token appears but has no value, substitute an em-dash `—`.

**Important:** Only render files from `plugin/templates/`. The folder structure in `plugin/templates/` mirrors the final brain layout, so copying it verbatim (after substitution) gives the user the full brain regions: `BASAL-GANGLIA/`, `BROCA/`, `CEREBELLUM/`, `HIPPOCAMPUS/`, `LONG-TERM-STORAGE/`, `META-COGNITION/`, `MOTOR-CORTEX/`, `PROCEDURAL-MEMORY/`, `SENSORY-CORTEX/`, plus root-level `CLAUDE.md`, `MEMORY.md`, and `AMYGDALA.md` if templates for those exist.

### 4.2 — Install core skills

Copy every directory inside `plugin/skills/core/` into `.claude/skills/` in the user's cwd. Preserve directory structure. These are the always-on skills (`brain-search`, `decision-check`, `nightly-brain-consolidation`, `reflect`, `foresight`, `thalamus-calibration`).

### 4.3 — Install opt-in skills (gated by integrations)

For each directory inside `plugin/skills/optional/`, read its `SKILL.md` frontmatter. If it declares a `requires:` key listing integration slugs, only install the skill when every required integration is present in `user.integrations`. Apply these specific gates:

| Skill | Requires |
|---|---|
| `morning-briefing` | `gmail` AND `gcal` |
| `email-triage` | `gmail` |
| `meeting-prep` | `gcal` |
| `relationship-check` | at least one of `gmail`, `whatsapp`, `slack`, `notion` |
| `project-status` | no gate — always install |
| `brain-dump-content` | install if `user.pillars` is non-empty OR `user.use_case == "creator"` |
| `content-interview` | install if `user.pillars` is non-empty OR `user.use_case == "creator"` |

Skills that fail their gate are silently skipped. Later, if the user connects a new integration, they can run `/aios-update` (future skill) to install the now-eligible ones.

### 4.4 — Write settings.json

Create or merge `.claude/settings.json` in the user's cwd.

**If the file does not exist**, write a fresh one containing:

```json
{
  "$schema": "https://anthropic.com/claude-code/settings.schema.json",
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          { "type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/session-start.sh" }
        ]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [
          { "type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/session-end.sh" }
        ]
      }
    ],
    "PostToolUseFailure": [
      {
        "hooks": [
          { "type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/post-tool-failure.sh" }
        ]
      }
    ]
  }
}
```

**If the file already exists**, load it as JSON, deep-merge the `hooks` key by appending AI-OS's hook entries (do not overwrite the user's existing hooks), then write it back with 2-space indentation. If the user already has an AI-OS hook registered under the same command path, skip it — do not duplicate.

### 4.5 — Write aios.config.json

Write `.claude/aios.config.json` with the full onboarding answers plus metadata, so future skills (including `/aios-update`) can read it:

```json
{
  "version": "0.1.0",
  "installed_at": "{{today}}",
  "user": { ...the object from Phase 2... },
  "installed_skills": ["brain-search", "decision-check", "..."],
  "hooks": ["SessionStart", "SessionEnd", "PostToolUseFailure"]
}
```

### 4.6 — Git

If the user's cwd has no `.git` directory, run `git init` quietly.

Stage everything that was just created, then commit with the message:

```
AI-OS initialized
```

Do not add any co-author trailer. Do not skip hooks. If git commit fails because the user has commit hooks that complain, surface the error plainly and let the user resolve it — do not force-push or amend.

### 4.7 — Progress display

While installing, show a single running block. Update it in place where possible:

```
Scaffolding brain regions   done
Installing core skills      done
Installing opt-in skills    3 of 7 eligible
Wiring hooks                done
Writing config              done
Committing                  done
```

Keep it under 80 columns. No spinners, no emojis.

---

## Phase 5 — Welcome screen

After the install commits cleanly, show this final block (substituting `{{user.name}}`):

```
AI-OS is installed.

Your brain lives at:  .
Your config:          .claude/aios.config.json
Your skills:          .claude/skills/

Five things to try next, {{user.name}}:

1. /aios-explore
   The full menu of every skill AI-OS has installed for you.

2. /brain-search "a person or topic you care about"
   Pulls anything your brain already knows.

3. /reflect
   A short, honest progress check against your three goals.

4. Connect an MCP, then /forge-skill <mcp-name>
   Gmail, Notion, Linear, Supabase — each one you connect, the brain can
   auto-generate intent-wrapped skills for it. See docs/mcp-directory.md.

5. Just work.
   Every session writes to short-term memory automatically.
   Patterns emerge. Skills improve. The brain remembers.

Open CLAUDE.md at the repo root if you want to see how the brain is wired.
```

Then stop. Do not keep talking. Do not ask what to do next. The user is welcome home.

---

## Hard rules

- **Never** write outside the user's current working directory during install. No global config, no `~/.claude/` edits.
- **Never** overwrite an existing AI-OS. If Phase 0 detects one, refuse.
- **Never** commit without the user's answers in Phase 3 confirmed.
- **Never** invent skills, integrations, or pillars the user didn't give you.
- **Never** emit emojis unless the user does first.
- If any step in Phase 4 fails, stop the install, surface the error plainly, and do not run the git commit. Leave the partial state for the user to inspect — do not attempt to roll back automatically.

## Tone

Minimalist, confident, quiet. You're setting up someone's second brain — act like a good notebook, not a marketing page. No exclamation points. No "Great!" No "Awesome!". Short sentences win.
