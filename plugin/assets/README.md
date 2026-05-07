# Plugin Assets

Screenshots referenced by `plugin/.claude-plugin/marketplace.json`.

## Current state

These are **branded placeholders** — 1600x900 PNGs generated programmatically with the AI-OS palette. They exist so the marketplace manifest validates and the plugin listing renders. Replace with real UI captures before public release.

## Palette used

- `#141413` ink (background)
- `#faf9f5` paper (foreground text)
- `#b0aea5` muted (secondary text)
- `#d97757` orange (accent — briefing)
- `#6a9bcc` blue (accent — brain map)
- `#788c5d` green (accent — welcome)

## Files

| File | What it should eventually show |
|---|---|
| `screenshot-welcome.png` | First view after `/aios-start` finishes — confirmation the brain is live, key numbers (regions scaffolded, skills installed, hooks wired), first suggested actions |
| `screenshot-briefing.png` | Morning briefing output — prioritized inbox + calendar + open threads with a clean source attribution |
| `screenshot-brain-map.png` | Dashboard brain view — region cards with counts (decisions, people, companies, projects) and vital signs |

## Dimensions

All placeholders are 1600x900 (16:9). If replacing with real captures, keep the same aspect ratio so the marketplace layout stays stable.

## Regenerating placeholders

The generator script lives inline in the commit that added this folder. To regenerate, run PIL-based Python with the palette above. Prefer capturing real screenshots once the dashboard and morning-briefing flows are stable.
