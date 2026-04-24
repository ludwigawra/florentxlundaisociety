# Behavioral Patterns

Inferred from how the user actually works. **Not** written by the user. Not edited by hand. This file is the output of `behavioral-learning`, which reads session transcripts, autonomous-run outcomes, and usage cadence to discover patterns no one articulates explicitly.

The difference between a memory system and an assistant that learns you lives here.

## How entries look

Each pattern has frontmatter, a one-sentence observation, a one-sentence inference, evidence, and (optionally) a proposed action:

```yaml
---
pattern_id: deletes-exclamation-marks
category: voice
confidence: high
observations: 7
window: month
first_seen: 2026-03-22
last_seen: 2026-04-17
---
```

```markdown
## The pattern
User consistently removes exclamation marks from AI-drafted copy before sending.

## The inference
Stop writing exclamation marks in drafts by default. Treat them as a known anti-pattern.

## Evidence
- 7 drafts in the last 30 days where `!` was deleted on review
- Applies across email, LinkedIn, WhatsApp
- No counter-examples (no drafts where `!` was added)

## Proposed action
Add "no exclamation marks unless explicitly requested" to voice/voice-fingerprint.md.
```

## Current patterns

_(none yet — run `/behavioral-learning` to generate inferences from this week's data)_
