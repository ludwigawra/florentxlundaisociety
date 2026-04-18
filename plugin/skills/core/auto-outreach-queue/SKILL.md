---
name: auto-outreach-queue
description: Autonomously draft a queue of personalized follow-up messages for people in SENSORY-CORTEX/people/ who are overdue, have open commitments, or are relevant to an active goal. Each draft matches the user's voice (BROCA rules + behavioral-patterns), cites real prior context, and is queued under HIPPOCAMPUS/short-term/outreach-queue-YYYY-MM-DD.md for morning review. Nothing is sent — the user approves, edits, or discards. The proof that AI-OS acts like you.
---

# Auto Outreach Queue

The most common thing a founder forgets: staying in touch. The most common thing a memory system can't do: draft a follow-up that sounds like you, cites the right prior context, and targets the right person at the right moment.

This skill does both. Autonomously. Nightly. Into a queue.

The user doesn't dictate who to reach out to or what to say. The brain picks from the contacts it already knows, scores who's stalest vs most relevant, writes drafts grounded in real interaction history, and queues them for a 5-minute morning triage.

The AI-OS root is at `~/Desktop/AI-OS/` by default; use the configured root if different. All paths below are relative to that root.

## When to use

Typically invoked nightly by the scheduler. Manual invocation is fine when:

- The user is prepping for a networking push (conference, fundraise, hiring run)
- A goal has been flagged in `foresight` output that requires outreach (e.g., "fundraise: talk to 10 investors this week")
- The user explicitly says "queue up some follow-ups"

Do not invoke when:

- SENSORY-CORTEX/people/ has fewer than 5 person files (insufficient signal)
- The last run was in the same calendar day (avoid duplication; check the ledger)
- No active or at-risk goal exists in `META-COGNITION/context/goals-metrics.md` (drafts without a reason are noise)

## Inputs

Optional caller hints:

- **Queue size** — `N` (default 5), `light` (3), `deep` (8). Cap at 8 to keep the review honest.
- **Goal filter** — a specific goal id/label to bias selection (e.g., "fundraise"). Default: infer from goals-metrics.md.
- **Channel filter** — `email` (default), `linkedin`, `whatsapp`, `any`. Determines which draft formats to produce.

## Process (execute in order)

### Step 1 — Load context

Read, in this order:

1. `META-COGNITION/context/goals-metrics.md` — identify the 1–2 goals most dependent on external outreach (fundraise, hiring, sales, partnership — not internal execution)
2. `SENSORY-CORTEX/people/` — every person file, including frontmatter (relationship, last-contact markers, open commitments)
3. `SENSORY-CORTEX/companies/` — for context on who a person represents
4. `HIPPOCAMPUS/decisions/` — pull any decision in the last 90 days that references outreach, a relationship, or a specific contact
5. `CEREBELLUM/patterns.md` and `CEREBELLUM/behavioral-patterns.md` — voice and timing rules the drafts must respect
6. `BROCA/` — voice, brand, tone guidelines; `voice-fingerprint.md` if present
7. `AMYGDALA.md` — outreach red flags (people you should not contact, or contact only under specific conditions)

### Step 2 — Score every person

For each person file, compute a composite score:

| Signal | Points |
|---|---|
| Open commitment from user to them, overdue | +4 |
| Open commitment from them to user, overdue | +3 |
| No contact in >30 days but marked as `active` relationship | +3 |
| Relevant to a goal currently flagged RED or falling behind | +3 |
| Explicit follow-up date noted in their file, now reached | +5 |
| Last interaction ended on an open question or next-step hook | +2 |
| Person is in AMYGDALA.md as a sensitive contact | apply guardrails; only queue if the file explicitly permits this cycle |
| Person is marked `archived` or `closed` | −10 |

Take the top `N + 2` by score (you'll prune down in step 4).

### Step 3 — Build the draft for each selected person

For each candidate:

1. **Pull interaction memory.** Pick the 2–4 most recent touchpoints from their file (notes, meeting summaries, decision references). Never fabricate — if the record is thin, write a thinner draft.
2. **Pick the angle.** One of:
   - *Commitment delivery* — "here's the thing I promised"
   - *Open-loop close* — "circling back on [specific topic]"
   - *Value signal* — "thought of you when [specific thing happened]"
   - *Direct ask* — "I'm working on [goal]; would you [specific ask]?"
   - *Check-in with hook* — "quick check-in; also, [specific reason]"
3. **Draft in the user's voice.** Respect:
   - `BROCA/voice-fingerprint.md` rules (tone, sentence length, anti-patterns)
   - `CEREBELLUM/behavioral-patterns.md` entries in the `voice` category
   - Language preference from MEMORY.md (English for business / Swedish for internal, or as configured)
4. **Keep it honest.** 2–5 sentences max for email; 1–2 sentences for LinkedIn; 1 sentence for WhatsApp. No fabricated specifics, no AI-ish hedging, no exclamation marks unless the voice fingerprint explicitly permits them.
5. **Cite context** in a collapsed `<details>` block under each draft so the user can verify the grounding: "Last interaction: [file] · Open commitment: [quote from file] · Related decision: [[decision-title]]."

### Step 4 — Prune

Drop any draft that:

- Cannot cite a real prior interaction (you'd be cold-starting — wrong skill for that)
- Triggers AMYGDALA guardrails on that specific contact
- Duplicates a draft already produced in a prior run this week (check `outreach-queue-*.md` files in short-term)
- Would be the 3rd+ outreach to the same person in a rolling 30-day window (annoyance risk)

Keep the top `N` survivors.

### Step 5 — Write the queue file

Write exactly one file:

`HIPPOCAMPUS/short-term/outreach-queue-YYYY-MM-DD.md`

Structure:

```yaml
---
type: outreach-queue
created: YYYY-MM-DD
status: pending-review
channel: email | linkedin | whatsapp | mixed
goal_bias: <goal id or 'general'>
count: N
---
```

Then:

```markdown
# Outreach queue — <date>

## Triage

Approve → A · Edit → E · Discard → D · Skip tonight → S

## Drafts

### 1. <Person Name> <[[Company]]>
**Why now**: <one phrase from the scoring>
**Channel**: <email | linkedin | whatsapp>
**Subject** (email only): <line>

<draft body — 2–5 sentences in the user's voice>

<details>
<summary>Context</summary>
- Last: <file ref + date>
- Open: <commitment quote>
- Related: [[decision]] · [[project]]
</details>

---

### 2. <next person>
...
```

### Step 6 — Log the autonomous run

Append one line to `BASAL-GANGLIA/autonomous-runs.jsonl`:

```json
{"ts":"<ISO-8601>","skill":"auto-outreach-queue","mode":"<channel>","status":"pending-review","outputs":<N>,"trigger":"<cron|manual>","artifact":"HIPPOCAMPUS/short-term/outreach-queue-YYYY-MM-DD.md"}
```

This is what the dashboard reads for the "pending review" panel.

### Step 7 — Notify (if Telegram configured)

If `.claude/channels/telegram/.env` exists in the brain, send a single notification at the user's configured morning time (or immediately if no schedule):

```
📬 <N> drafts ready for review — <goal bias>. Open: outreach-queue-YYYY-MM-DD.md
```

If not configured, skip silently.

## Format

- Follow the user's language preference from MEMORY.md
- Each draft is self-contained; do not cross-reference other drafts in the same queue
- No emojis unless the voice fingerprint allows them
- Never more than 5 sentences per email draft; 2 per LinkedIn; 1 per WhatsApp

## Anti-patterns (do not do these)

- **Do not fabricate.** If you can't cite a real prior touchpoint, drop the draft.
- **Do not auto-send.** This skill queues; the user sends.
- **Do not include someone flagged in AMYGDALA.md** unless the flag permits the specific cycle you're in.
- **Do not over-score open commitments from very long ago.** An open commitment from 6 months ago is probably dead or already resolved off-record; weight recency.
- **Do not produce generic openers.** "Hope you're well" is a voice anti-pattern by default; the voice fingerprint will usually exclude it.
- **Do not touch the person's file.** You read from SENSORY-CORTEX; only the consolidation writes back.

## Calibration

Initial state: **learning**. Expect heavy editing on the first 3–5 queues — voice, angle, timing. Log every edit signal to short-term for nightly consolidation.

Graduation criteria: 3 consecutive queues where ≥60% of drafts are approved unedited → status moves to **calibrated**. Once calibrated, the scheduler may fire this skill up to 3 nights/week.

Never auto-send. The user's approval is the final gate — always.
