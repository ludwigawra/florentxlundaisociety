# AI-OS Positioning — Competitive Landscape (April 2026)

The pitch-ready comparison of every product that could be confused for AI-OS.

## The one-line positioning

**ChatGPT memory is a black box in the cloud. Notion AI searches. Claude projects forget. AI-OS is a brain on your machine that learns from you, works in every repo, and compounds forever.**

## The moat — five axes no one combines

| Axis | Why it matters | Who's closest |
|---|---|---|
| **Local file-system** | You own it, version it, grep it, carry it between models | Claude Code, Cursor, Pieces |
| **Structured / typed / region-based** | Not a RAG dump — decisions, people, patterns, skills are first-class | Reflect (graph), Letta (memory blocks) |
| **Learns from feedback** | Skills rewrite themselves from corrections | Personal.ai (weights), Letta (self-edit) |
| **Nightly consolidation** | Brain compounds while you sleep | AutoDream, OpenClawDreams (nascent) |
| **Agentic action on memory** | Not just retrieval — the brain acts | Notion 3.0, Letta |

**No product hits all 5.** That's the defensible space.

## Comparison table

| Product | Local/Cloud | Structure | Learns? | Acts? | Nightly? | Pricing | Biggest limit |
|---|---|---|---|---|---|---|---|
| **ChatGPT Memory** | Cloud | Flat bullet list (~6K tokens) | No | No | No | Plus $20 / Pro $200 | Opaque dossier, cloud-locked |
| **Claude Projects / Memory** | Cloud | Project-scoped chat search | No | No | No | $20/$30 | No cross-project brain |
| **Claude Code CLAUDE.md** | Local | Hierarchical markdown | Auto-notes from corrections | In-IDE | No | Included | Repo-scoped, no skill loop |
| **Mem.ai** | Cloud | Auto-tagged notes | No | No | No | $12/mo | Notes app, no agents |
| **Reflect Notes** | Cloud (E2E) | Daily notes + backlinks | No | No | No | $10/mo | Single-user notes |
| **Rewind.ai** | Local (Mac) | Vector DB over screen OCR | No | No | No | **DEAD** — Meta acquihire Dec 2025 | Product shut down |
| **MemGPT / Letta** | Self-host | Typed memory blocks | Self-edit via tools | Yes — framework | No | OSS + usage | Framework, not product |
| **Pieces.app** | Local-first | Vector over 9-mo OS capture | No | IDE copilot | No | Free + paid | Capture-and-retrieve only |
| **Notion AI / Agents 3.0** | Cloud | Pages/DBs | No | Yes (Sep 2025) | No | $16–20/seat | Session-scoped agent memory |
| **Cursor Rules + Memory** | Local `.cursor/rules/` | Flat rule files | Manual | In-IDE | No | $20/mo | Static rules, no learning |
| **Personal.ai** | Cloud | Paragraph "memory blocks" | Continuous fine-tune | Limited copilot | No | $33/mo | Chat-centric, no file system |
| **Supermemory.ai** | Cloud API | Vector memory | No | Via MCP client | No | Free / $19 / $399 | Infra layer, unstructured |
| **AgentGPT / Cognosys** | Cloud (OSS / dead) | Short-term task | No | Yes | No | Varies / dead | Toy / acquired |
| **AutoDream / OpenClawDreams** | Local (CC plugins) | Flat encrypted memory | Rewrites memory | Via Claude Code | **Yes — cron** | OSS | No typed entities, no skills |
| **claude-mem plugin** | Local | Session compression | No | No | Session-end only | OSS | Coding-session memory only |

## Stage-ready positioning lines

**The headline (against the whole market):**
> "Right now your AI is fragmented — a different assistant in every tool, and none of them know you. AI-OS is the opposite: one brain, loaded into every Claude session, across every workflow. Stop onboarding your AI. Start compounding with it."

**Against memory products (ChatGPT, Claude, Mem, Supermemory):**
> "They store what you said. AI-OS stores who you are — on your machine, in files you can read, with a region for every cognitive function. A bullet list in OpenAI's cloud is not a brain."

**Against personal AI (Personal.ai, Rewind):**
> "Personal.ai fine-tunes a model on your paragraphs. Rewind recorded your screen — then Meta killed it. AI-OS is the opposite bet: the intelligence stays in Claude; what's yours is the structured brain on disk. You own it, version it, carry it between models."

**Against dev-IDE context (Cursor, CLAUDE.md):**
> "CLAUDE.md is a static instruction file. AI-OS is a living brain — thirteen regions, a cerebellum that learns from your corrections, a hippocampus that consolidates overnight. Cursor rules don't dream. AI-OS does."

**Against agentic frameworks (Letta, AgentGPT):**
> "Letta gives developers memory primitives. AI-OS gives *you* a brain — preinstalled, structured, self-improving, already wired to Gmail, Calendar, Notion, WhatsApp. Framework vs. finished operating system."

## Known scale numbers (thin, handle with care)

- **ChatGPT memory cap**: ~6K tokens (~45–50K chars) before user must prune
- **Pieces.app**: markets "9 months of context" as ceiling
- **Rewind.ai**: claimed ~14 GB/month compressed local capture (product now dead)
- **Stack Overflow 2025 survey**: devs spend ~23% of AI interaction time re-supplying context
- **Supermemory**: sub-300ms recall, "10x faster than Zep" (vendor-reported)

**No authoritative retention/DAU data exists for any personal-memory product.** That's whitespace — AI-OS has the opportunity to be the first with a mature cohort.

## Why this wins

1. **One assistant, every workflow.** Today every AI tool is an island. Cursor has your code context. ChatGPT has your chat context. Notion has your workspace context. Claude has nothing of yours. You re-explain yourself every time you switch surfaces. AI-OS collapses that: the *same* brain is loaded into every Claude session, across every repo, every project, every task. Coding, writing, research, pitches, email — one context, one assistant. Stop onboarding your AI over and over.
2. **Composability**: AI-OS is the *substrate* every future personal-AI automation will need. Most automations built on top of chat assistants fail on context — they have to be re-fed who the user is, what they care about, and what already happened, every time. AI-OS fixes that — automations inherit the whole brain instead of being rebuilt from zero each time.
3. **Portability**: the brain is a folder, not a vendor. Switch from Claude to Opus 5 to GPT-6 — the brain comes with you.
4. **Compounding**: the skill-feedback loop means usage → improvement → better usage. Competitors plateau; AI-OS accelerates.
5. **Trust**: local files, zero telemetry, git-tracked. The opposite of the Rewind story.

## Sources

- [OpenAI Memory](https://openai.com/index/memory-and-new-controls-for-chatgpt/)
- [Simon Willison — ChatGPT memory dossier](https://simonwillison.net/2025/May/21/chatgpt-new-memory/)
- [Claude Code memory docs](https://code.claude.com/docs/en/memory)
- [Letta / MemGPT](https://docs.letta.com/concepts/memgpt/) · [paper](https://arxiv.org/abs/2310.08560)
- [Pieces long-term memory](https://pieces.app/features/copilot/long-term-memory)
- [Notion 3.0 Agents](https://www.notion.com/releases/2025-09-18)
- [Personal.ai](https://www.personal.ai/pricing)
- [Cursor Rules](https://docs.cursor.com/context/rules)
- [OpenClawDreams](https://github.com/RogueCtrl/OpenClawDreams) · [claude-mem](https://github.com/thedotmack/claude-mem)
- [Memory in the Age of AI Agents survey](https://arxiv.org/abs/2512.13564)
- [Rewind post-shutdown](https://screenpi.pe/blog/rewind-ai-alternative-2026)
