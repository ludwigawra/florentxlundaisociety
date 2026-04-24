---
name: decision-check
description: Check prior decisions and patterns before committing to a new one — surfaces history on a topic, flags contradictions, and recommends whether to proceed, reconsider, or supersede. Use when the user is about to decide something non-trivial, when a new direction sounds familiar, or when you sense tension with a prior call.
---

# Decision Check

The brain's decision archive is one of its most valuable assets — and also the most under-read. This skill makes it useful. Before any meaningful decision is made (or re-made), query `memory/decisions/`, `learning/patterns.md`, and `MEMORY.md` for prior context, then give a clear recommendation.

All paths below are relative to the brain root — the directory containing CLAUDE.md. When invoked as a slash command inside Claude Code, the brain root is the current working directory.

## When to use

Invoke this skill whenever any of the following happens:

- The user is about to commit to a direction, approach, tool choice, pricing call, positioning, process, or architecture
- A new plan sounds similar to something that was discussed or decided before
- You are tempted to change a working practice, template, or system rule
- The user asks "should we do X?", "is this the right call?", or "didn't we decide something about this?"
- A recommendation you are about to give contradicts what you see in `MEMORY.md` or a prior decision

Do not invoke for trivial choices already scoped by the current task. This skill is for decisions the user would want to remember six months from now.

## Inputs

The caller should provide:

- **Topic or claim** — e.g., "pricing for the new product", "use Supabase vs Postgres", "founder-led sales vs hiring AE"
- **Proposed direction** (optional) — the specific stance being considered
- **Context** (optional) — why this is coming up now

If only a vague topic is given, extract the most testable claim from the user's intent before searching. Decision filenames are written as claims, not categories — so frame your search term the same way.

## Process

### 1. Normalize the topic

Turn the topic into both a claim phrasing and a set of keywords.

- Claim: `"charge-for-discovery-calls"`, `"use-typescript-for-all-services"`, `"founder-voice-for-demos"`
- Keywords: domain nouns and verbs that might appear in decision content — e.g., `pricing`, `discovery`, `demo`, `founder`, `voice`

### 2. Search the decision archive and related surfaces

Run these in parallel:

**Filename match on decisions** (decisions are named as claims):

- Glob `memory/decisions/*{keyword}*.md` for each keyword
- Glob `memory/decisions/*.md` and scan the list if keywords are short or ambiguous

**Content match on decisions:**

- Grep case-insensitive across `memory/decisions/` for each keyword
- Also grep `supersedes:` frontmatter — prior chains of decisions on the same topic are a strong signal

**Patterns:**

- Grep `learning/patterns.md` for the keywords. A pattern is a higher-order lesson — it often applies even when no specific decision exists

**Long-term memory:**

- Grep `MEMORY.md` for the topic with two lines of surrounding context

**Goals and current priorities:**

- Read `system/context/goals-metrics.md` if it exists — does the proposed direction advance or conflict with a current goal?

**Corrections:**

- Grep `learning/corrections.md` for the keywords. A prior mistake on this topic is a loud signal

Exclude `.obsidian/`, `node_modules/`, `.git/`, and archived short-term files.

### 3. Read the hits

For every matching decision file, read it in full. Extract:

- **The claim** — from the filename, normalized
- **Date** — from frontmatter `created:` (fall back to git log if missing)
- **Context** — why it was decided
- **Alternatives considered** — what was rejected
- **Status** — `active`, `superseded`, `revisited`, or unset
- **Supersedes / superseded-by** — chain relationships

If a file has no frontmatter or no clear claim, note it but still summarize based on body content.

### 4. Detect contradictions

For each prior decision, compare it against the proposed direction:

- **Direct contradiction** — the old decision says X, the new one says not-X
- **Scope contradiction** — the old decision covered a case that includes the new one, but takes a different stance
- **Implicit contradiction** — the old decision doesn't directly rule on the new case, but the reasoning applies and points the other way
- **Superseding situation** — the conditions that made the old decision correct have changed; the new one is an intentional update

Also compare against:

- **Patterns** — does `learning/patterns.md` say this approach tends to fail?
- **Corrections** — did a prior correction specifically warn against this?
- **Goals** — does this advance current priorities or pull against them?

Be honest about ambiguity — if it's close but not clearly a contradiction, say so.

### 5. Report findings

Present the result in this structure:

```
## Decision Check: {topic}

### Proposed direction
{One-sentence summary of what's being considered.}

### Prior decisions
| Claim | Date | Status | Notes |
|-------|------|--------|-------|
| {claim} | YYYY-MM-DD | active | {one-line context} |
| {claim} | YYYY-MM-DD | superseded | replaced by {claim} |

If none: "No prior decisions on this topic."

### Relevant patterns
- From `learning/patterns.md`: "{pattern statement}" — applies because {reason}.

If none: omit.

### Relevant corrections
- From `learning/corrections.md` (YYYY-MM-DD): "{what went wrong}" — relevant because {reason}.

If none: omit.

### Goal alignment
- Advances: {goal name} — because {reason}.
- Conflicts with: {goal name} — because {reason}.

If neutral: "Neutral against current goals."

### Contradictions found
- {Explicit contradiction with `decision-file.md` — old says X, new says not-X.}

If none: "No contradictions detected."

### Recommendation
{One of:}
- **Proceed.** No conflicting prior context; direction is consistent with patterns and goals.
- **Proceed with framing.** Consistent direction, but note {caveat} before acting.
- **Reconsider.** This contradicts `{prior-decision}` — here is what changed: {either "nothing — respect the prior call" or "conditions X, Y — so supersede explicitly"}.
- **Supersede.** This is an intentional update to `{prior-decision}`. If confirmed, write a new decision file and mark the old one `status: superseded`.
- **Not enough context.** Cannot tell either way — here are the questions that would decide it: {list}.
```

Keep the report tight. If multiple sections are empty, cut them rather than writing "N/A".

### 6. If the user confirms a new decision

After the recommendation, if the user decides to proceed or supersede, help create the decision record:

1. **Filename** — write the claim as hyphenated lowercase, e.g., `charge-for-discovery-calls.md`. Filenames should read as statements, not categories.
2. **Path** — `memory/decisions/{claim}.md`
3. **Frontmatter:**

```yaml
---
type: decision
tags: [relevant, tags]
related: [[Entity One]], [[Entity Two]]
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: active
supersedes: [[prior-decision-filename]]   # only if applicable
---
```

4. **Body structure:**

```
# {The claim as a full sentence.}

## Context
Why this came up. What triggered the decision.

## Options considered
- Option A — {summary} — {why rejected or chosen}
- Option B — {summary} — {why rejected or chosen}

## Decision
{The chosen direction, stated as a claim.}

## Reasoning
{The 2–4 reasons that drove the choice.}

## Implications
{What changes because of this. What breaks if we revisit it.}

## Revisit triggers
{Specific signals that should make us re-open this decision.}
```

5. **If superseding** — open the prior decision file and set `status: superseded` and add `superseded_by: [[new-decision]]` in its frontmatter. Do not delete or rewrite the old file — it is part of the record.

### 7. Consolidation hygiene

If the search reveals three or more active decisions on the same topic that don't cleanly supersede each other, surface this as a consolidation candidate:

- Recommend merging them into a single current decision with the others marked superseded
- Do not auto-merge — flag the situation and let the user confirm

## Rules

- **Decision filenames are claims, not categories.** `use-typescript-across-services.md` beats `tech-stack-decision.md`. Enforce this when helping create new files.
- **Never modify body content of existing decision files.** You may update frontmatter fields (`status`, `superseded_by`, `updated`) but the reasoning is historical record.
- **Never delete decision files.** Supersede, don't erase.
- **Respect ambiguity.** If you cannot tell whether something contradicts a prior decision, say so rather than forcing a verdict.
- **Flag pattern or correction hits explicitly.** These are higher-weight than a single prior decision because they represent repeated experience.
- **Escape regex characters** in topic terms that contain punctuation before grepping.
- **Do not conflate "old" with "wrong."** Age is context, not a verdict — an active decision from two years ago may still be correct.

## Failure modes to avoid

- Searching only by filename and missing content-level hits. A prior decision may live in a differently-named file.
- Reporting "no prior decisions" when there is a clearly-relevant pattern in `learning/patterns.md`. Patterns count.
- Silently overwriting a prior decision's status without writing a new file. The superseding decision needs its own record.
- Recommending "Proceed" when a correction warns against exactly this direction. Corrections outrank intuition.
- Burying the recommendation under a wall of table output. The user should know within one sentence whether to continue, pause, or reconsider.
