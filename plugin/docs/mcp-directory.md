---
type: reference
tags: [mcp, directory, integrations]
created: 2026-04-18
updated: 2026-04-18
---

# MCP Directory

A curated list of MCPs (Model Context Protocols) that work well with AI-OS. Connect one to Claude Code, then run `/forge-skill <mcp-name>` — the brain will propose 3–5 skill candidates that wrap it with intents you can actually use.

MCPs are the nerves of your AI-OS. Each one gives your brain a new sense or a new hand.

---

## How to connect an MCP

1. Open Claude Code.
2. Type `/mcp` to open the MCP manager (or use the plus (+) menu in the chat UI).
3. Pick an MCP from the official directory or paste a custom URL.
4. Authenticate if prompted (OAuth, API key, or headers).
5. Once connected, come back to any Claude Code session and run `/forge-skill <name>` to wrap it in skills.

AI-OS does not handle MCP authentication or storage — that's entirely Claude Code's layer. Your tokens and secrets stay in Claude Code's keychain, not in your brain folder.

---

## Recommended MCPs for solo operators

### Communication

**Gmail** — read threads, search, draft replies, label. Pair with `/forge-skill gmail` to get `/inbox-scan`, `/reply-to-<thread>`, `/follow-up-hunt`.
URL hint: `gmail.mcp.claude.com/mcp`

**Google Calendar** — list events, suggest times, respond to invites. Pair with `/forge-skill gcal` to get `/today`, `/meeting-prep`, `/calendar-gaps`.
URL hint: `gcal.mcp.claude.com/mcp`

**WhatsApp** (community MCP) — list chats, read messages, search contacts, send messages/audio/files. Excellent for founder-mode relationship tracking.

**Slack** — read channels, search, post. Install via the Claude Code connector store.

### Knowledge

**Notion** — read and write pages, manage databases, search, move pages. Pair with `/forge-skill notion` for `/kb-search`, `/kb-capture`, `/kb-link`.
URL hint: `mcp.notion.com/mcp`

**Google Drive** — list, read, and create files across your Drive. Good for research skills.

### Engineering

**GitHub** (community MCP) — issues, PRs, diffs, releases. Essential if you ship code.

**Linear** — issues and project management. Pair with `/forge-skill linear` for `/my-issues`, `/issue-digest`.

**Supabase** — schema inspection, queries, migrations. Pair with `/forge-skill supabase` for `/db-inspect`, `/db-search`.

### Marketing / GTM

**Instantly** — email campaign automation, lead lists, inbox management. Pair with `/forge-skill instantly` for outreach-heavy workflows.

**Miro** — visual canvas, diagrams, tables. Good for research synthesis or brainstorming.

---

## How AI-OS uses MCPs

When you connect an MCP, nothing changes in your brain folder. But when you run `/forge-skill`, a new set of SKILL.md files lands in `.claude/skills/generated/`. From that point on:

- The skills appear in `/aios-explore` alongside the built-in ones.
- They use the MCP's tools to do real work (read your inbox, pull your calendar, etc.).
- They log feedback to `learning/skill-feedback/` like every other skill — the nightly consolidation improves them over time.
- They're inspectable. Open `.claude/skills/generated/{skill-name}/SKILL.md` to see exactly what a skill will do before you run it.

This is how AI-OS grows capabilities as your life grows tools.

---

## Building a custom MCP

If you can't find an MCP for a tool you use, you can write one. See [docs.claude.com/en/docs/claude-code/mcp](https://docs.claude.com/en/docs/claude-code/mcp) for the full SDK. Once yours is connected, `/forge-skill <your-mcp>` works just like the official ones.

---

## Removing a generated skill

Generated skills live at `.claude/skills/generated/`. To remove one, delete the folder. They're not referenced by any hook or core skill — safe to delete individually.

If a generated skill turns out to be low-quality, note it in `learning/corrections.md` so the nightly consolidation can learn why and do better next time you forge.
