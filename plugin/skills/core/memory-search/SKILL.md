---
name: memory-search
description: Search the AI-OS brain for entities, context, prior decisions, and relevant files before starting work. Use when you need context about a person, company, project, topic, or decision — or any time a session begins referencing something that may already exist in the brain.
---

# Brain Search

Query the user's AI-OS brain to surface everything relevant before you start thinking or writing. The goal is to eliminate duplicate work, avoid contradicting prior decisions, and load the right context into the session.

All paths below are relative to the brain root — the directory containing CLAUDE.md. When invoked as a slash command inside Claude Code, the brain root is the current working directory.

## When to use

Invoke this skill whenever any of the following apply:

- A person, company, project, product, or concept is mentioned and you don't already have full context on it this session
- The user asks "what do we know about X?" or "have we looked into X before?"
- You are about to draft something external (email, proposal, message) and need relationship or decision history
- You are preparing for a meeting, interview, or negotiation
- A topic sounds familiar but you can't place it
- You are in the boot sequence of a session with a clear topic and want to pre-load relevant files
- Before making a decision that might contradict a prior one (pair with the `decision-check` skill)

Do not invoke for trivial lookups already visible in the current session context.

## Inputs

The caller should provide:

- **Query** — one or more entity names, topic keywords, or a natural-language question
- **Optional scope** — a specific brain region to restrict the search to (e.g., `knowledge/people/`)
- **Optional recency** — only return files modified within N days

If only a fuzzy question is given ("what's going on with the pricing thing?"), extract the best keywords yourself before searching.

## Process

### 1. Parse the query into search targets

From the user's input, extract:

- **Entity names** — people, companies, products (proper nouns, often capitalized)
- **Topic keywords** — concepts, themes, deliverables (e.g., "pricing", "pipeline", "onboarding")
- **Time anchors** — "last week", "Q1", a specific date
- **Relationship hints** — "the investor I met at…", "the partner from…"

Build both exact-match and loose-match variants. For person names, prepare a lowercased-hyphenated variant for filename matches (e.g., `Jane Doe` → `jane-doe`).

### 2. Run searches in parallel across brain regions

Prefer running these as a batch (multiple tool calls in a single message) for speed. Use the Grep and Glob tools — not raw shell — so results are consistent and respect permissions.

**Dedicated entity files** (highest-signal hit):

- Glob `knowledge/people/*TARGET*.md`
- Glob `knowledge/companies/*TARGET*.md`
- Glob `projects/*TARGET*/` (project directories)
- Glob `memory/decisions/*TARGET*.md`

**Wiki-link references** (the graph):

- Grep `\[\[TARGET` across all `.md` files under the brain root. Wiki-links mean the entity is treated as a first-class node in the graph.

**Content mentions** (may include plain text references):

- Grep `TARGET` (case-insensitive) across `knowledge/`, `memory/decisions/`, `projects/`, and `MEMORY.md`
- Also search `routines/` and `blueprints/` if the query is about a process, routine, or template

**Frontmatter matches** (typed lookups):

- Grep `type: person` combined with a name match
- Grep `tags:.*TARGET` for tagged content
- Grep `related:.*TARGET` to find files that link to the target

**Memory surface:**

- Read relevant lines from `MEMORY.md` — grep the target and include two lines of context around each hit
- Grep `learning/patterns.md` for patterns that reference the entity or topic

Exclude `.obsidian/`, `node_modules/`, `.git/`, and `memory/short-term/archive/` from all searches unless explicitly asked to include them.

### 3. Rank the hits

Score results by likely usefulness, not just recency:

1. **Dedicated entity files** — `knowledge/people/{name}.md`, `knowledge/companies/{name}.md`, `projects/{project}/CLAUDE.md`. Read these in full.
2. **Decision files** — `memory/decisions/*.md` matching the topic. Read in full; these are frequently under-used.
3. **MEMORY.md hits** — Pull the exact lines with two lines of context.
4. **Pattern hits** — `learning/patterns.md` entries referencing the topic. Always relevant to how you should approach the work.
5. **Project CLAUDE.md / MEMORY.md** under `projects/` — Load if the query is project-scoped.
6. **Routine or template hits** under `routines/` or `blueprints/`.
7. **Short-term session files** in `memory/short-term/` — Only if recent (within ~7 days) and directly relevant. Archived short-term files are lower priority.

Drop duplicates (a file that matches by both filename and content is one hit, not two).

Cap the surfaced list at ~12 files. If you have more hits than that, mention the overflow count and offer to drill in.

### 4. Read top hits before reporting

For items in tiers 1 and 2, read the file before presenting. Your one-line summary should reflect the actual content, not a filename guess.

For items in lower tiers, a filename-plus-header summary is acceptable.

If you hit a dedicated entity file, also extract its `related:` frontmatter — those are the next nodes to consider traversing.

### 5. Report findings in a consistent format

Present the results in this structure:

```
## Brain Search: {query}

### What the brain knows

- **{Most important fact} —** source: `path/to/file.md`
- **{Second fact} —** source: `path/to/file.md`
  (Keep this to the 3–6 most relevant facts. No fluff.)

### Files worth reading in full

1. `knowledge/people/{name}.md` — one-line summary
2. `memory/decisions/{claim}.md` — one-line summary
3. `projects/{project}/CLAUDE.md` — one-line summary

### Relationships to follow

- [[Entity A]] — connected via {reason}, file: `path.md`
- [[Entity B]] — mentioned in `path.md`

### Relevant prior decisions

- `{claim-as-filename}` ({date}) — {status: active / superseded / stale}
  If none: "No prior decisions on this topic — this is new ground."

### Patterns that apply

- From `learning/patterns.md`: {short pattern statement}
  If none: omit the section.

### Gaps

- {Something the brain does not know that would matter for this task.}
- {Broken wiki-links — entity referenced but no file exists.}

### Stale signals

- `path.md` — `updated: YYYY-MM-DD` (>30 days old, may be out of date)
```

Skip any section that has nothing to report. A short accurate answer beats a padded one.

### 6. Suggest next moves

End with one of:

- **"Recommend reading:"** a short list of files the current session would benefit from loading
- **"No context found — this is new."** If genuinely nothing comes back, say so clearly so the user knows the brain is a blank page on this topic and can decide whether to create an entity file

If the search surfaced a potential contradiction with a prior decision, call it out and recommend invoking the `decision-check` skill next.

## Modes

### Interactive mode (default)

Full formatted report as described above. Use when the user explicitly invokes the skill.

### Boot mode

When invoked silently during session startup, skip the formatting. Instead:

1. Read the top 3–5 most relevant files
2. Keep their content in working memory
3. Do not announce what you loaded — let the answer reflect that context naturally

The user should feel that you already know the relevant background without being told you looked it up.

## Rules

- **Read-only.** This skill never writes, edits, or deletes brain files.
- **Respect scope limits.** If the query clearly targets a person, don't flood the report with unrelated company hits.
- **Never guess at file contents.** If you haven't read a file, don't fabricate a summary — list the filename only.
- **Flag broken links.** If wiki-links point to entities without files, mention them as gaps. Do not auto-create stubs in this skill — that belongs to consolidation.
- **Prefer specific over comprehensive.** Twelve useful pointers beat fifty noisy ones.
- **Escape regex characters** in entity names that include punctuation (`.`, `&`, parentheses) before grepping.
- **Avoid re-reading** files already in session context — check what you already have before making tool calls.

## Failure modes to avoid

- Reporting a long list of filenames without reading any of them. If you list a decision file, you should be able to summarize the decision.
- Missing the wiki-link search. Many entities are only referenced through `[[Name]]` — a plain text grep will miss these if the name is abbreviated elsewhere.
- Ignoring `learning/patterns.md`. Patterns are often the highest-leverage context for how to approach a task.
- Surfacing stale files without flagging the staleness. An out-of-date fact presented confidently is worse than no answer.
- Reading every archived short-term session file. These are high-volume, low-signal — only load if directly relevant and recent.
