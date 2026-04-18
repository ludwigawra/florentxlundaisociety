# AI-OS Dashboard

Local-first, no-account web dashboard that reads an AI-OS brain folder and
visualises system health, memory, decisions, and patterns.

It is read-only. All edits happen elsewhere (e.g. through Claude Code in a
terminal). Each file view exposes a copy-to-clipboard button with a
`claude "<absolute-path>"` command so you can jump straight into editing.

## Requirements

- Node.js 20+
- An AI-OS brain folder somewhere on your filesystem. The dashboard never
  writes to it.

## Setup

```bash
cp .env.example .env.local
# Edit .env.local so AIOS_ROOT points at your brain folder (absolute path
# recommended). It defaults to `..` — the directory containing this app.

npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

- `npm run dev` — local dev server with hot reload
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run typecheck` — TypeScript type-check (no emit)

## What you get

- `/` System Progress — 6 panels covering vital signs, active context,
  brain activity (git commits per region), patterns recognised, decisions
  logged, memory load.
- `/memory` — `MEMORY.md` split by `##` headers.
- `/r/[region]` — index of files in a brain region. Folders listed in
  `brain-regions.default.json` get a curated view type; any other top-level
  folder in `AIOS_ROOT` is discovered and shown too.
- `/r/[region]/[...path]` — file detail with rendered Markdown,
  frontmatter chips, wiki-link resolution, and a backlinks list.
- `/search` — full-text search with tag/type filters.

## Configuration

- `brain-regions.default.json` ships with the app. To override it, create
  `META-COGNITION/regions.json` inside your AI-OS brain folder; it is
  merged on top of the defaults by `lib/region-manifest.ts`.

## Missing data

If `AIOS_ROOT` is absent or the path does not exist, pages render an
empty state explaining where to point the env variable.
