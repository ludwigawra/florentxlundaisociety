# AI-OS licensing

This folder holds the subscription license check for the AI-OS plugin. This document explains the model, the technical contract, and — importantly — what happens to your data if your license expires.

---

## The model

AI-OS is sold as **install fee + subscription**.

- **Install fee** — a one-time cost paid on purchase. Covers the licensed distribution of the plugin, initial setup, and access to the first subscription period.
- **Subscription** — a recurring charge that keeps the plugin licensed and entitles you to skill updates, dashboard updates, and support.

There are three tiers:

| Tier | For | Includes |
|---|---|---|
| **Starter** | Single user, single machine | Core brain, skills pack, local dashboard |
| **Pro** | Single user, any machine | Everything in Starter, plus pro dashboard views, priority skill updates, multi-device sync |
| **Team** | Small teams | Everything in Pro, plus shared brain regions, role-based access, admin controls |

Pricing is listed on the product site. The phrasing in this repo is deliberately price-agnostic — pricing changes faster than source does.

---

## What a license is

A license is a small JSON file stored at `~/.aios-license`. It contains:

- your email
- your subscription tier
- when the license was issued
- when it expires
- an ed25519 signature produced by the AI-OS licensing server

The public key for verification is compiled into the plugin. The private key lives only on our server. Signatures are verified **offline** on every session start — no network call, no telemetry, no tracking.

The full schema is in [`schema.ts`](schema.ts). The verification logic is in [`check.ts`](check.ts).

---

## How to get a license

1. Purchase on the product site.
2. A signed license file is emailed to you immediately.
3. Save it as `~/.aios-license`. Or, when prompted by `/aios-init`, paste the contents — the init skill will write the file for you.
4. Start a new Claude Code session. The plugin verifies the license on the first session start.

---

## What happens when a license expires

**Nothing that touches your data.** Your brain folder is yours. AI-OS never deletes, hides, encrypts, or locks user content on expiration. This is a design commitment.

Here is exactly what happens on license expiration:

### During the 14-day grace period

- The plugin continues to function normally.
- Hooks fire, skills register, the dashboard runs.
- A renewal reminder appears at the start of each session.
- You have two full weeks to renew without any functional loss.

### After the grace period ends

- The plugin stops firing session hooks.
- Skills bundled with the plugin stop registering.
- The dashboard continues to run — it reads the filesystem and holds no license state.
- **Your brain folder is fully intact and readable.** You can open it in any editor, browse it in any filesystem, use it with a different tool, or just keep it.
- Claude Code still works in general; it just no longer auto-reads your brain at session start.
- Renewing restores plugin functionality instantly — no data migration, no reimport.

### What AI-OS never does

- Lock, encrypt, or hide your brain folder.
- Delete your short-term memory, decisions, or skill feedback.
- Upload your data anywhere.
- Phone home on every session start.
- Require an internet connection to verify your license (verification is offline after the initial issuance).

The license governs the plugin's behavior. It does not govern your data. Your data is always yours.

---

## Machine binding

Starter licenses may include an optional `machineId` that binds the license to a single machine. Pro and Team licenses are not machine-bound — they travel with the user.

If you need to move a Starter license to a new machine, contact support. Reissuing takes minutes.

---

## Refunds, renewals, revocation

- **Renewal** — automatic on the billing anniversary unless cancelled. A new license file is issued and delivered by email each cycle.
- **Cancellation** — available at any time from the account portal. Your current license remains valid until its `expiresAt`.
- **Refunds** — within 30 days of purchase, for any reason. Contact support.
- **Revocation** — licenses can be revoked server-side only in cases of chargeback or abuse. Revocation does not affect your brain folder.

---

## For developers / auditors

- Verification is offline, signature-based, using ed25519. No network calls during `checkLicense`.
- The public key lives in [`check.ts`](check.ts). The canonicalization function (`canonicalBytes`) is exported for testing.
- There is no analytics or telemetry code in the plugin. Any such addition would be opt-in and clearly flagged in release notes.
- The plugin, skills, dashboard, and docs are MIT-licensed. The licensing server, the license issuance pipeline, and the private key are not open source.

If you want to audit what's running on your machine, the source you see here is what ships. No obfuscation.

---

## Support

Email the address on the product site. Include your license email and a brief description of the issue. For license reissuance or machine moves, this is usually same-day.
