/**
 * AI-OS license verification.
 *
 * This module verifies a signed license file at `<rootPath>/.aios-license` or,
 * when `rootPath` points at the user's home, at `~/.aios-license`. Verification
 * is fully offline: no network calls are made here.
 *
 * Implementation plan (Phase 3 — Licensing):
 *
 *   1. Resolve the license file path. Accept either `<rootPath>/.aios-license`
 *      or fall back to `~/.aios-license`. The license travels with the user,
 *      not the project.
 *
 *   2. Read and parse the JSON. Any parse error → `valid: false` with a clear
 *      error message.
 *
 *   3. Validate the payload shape against `schema.ts`:
 *        - `email` is a non-empty string
 *        - `tier` is one of `starter` | `pro` | `team`
 *        - `issuedAt` and `expiresAt` are ISO-8601 parseable
 *        - `schemaVersion` is 1 (future versions handled separately)
 *        - `signature` is a non-empty base64 string
 *      Any failure → `valid: false` with a structural error.
 *
 *   4. Reconstruct the canonical signed payload:
 *        - Clone the object, remove `signature`
 *        - Sort keys alphabetically
 *        - Serialize with `JSON.stringify` without whitespace
 *        - Encode as UTF-8 bytes
 *
 *   5. Verify the ed25519 signature using `node:crypto`:
 *        import { verify } from "node:crypto";
 *        const ok = verify(
 *          null,
 *          canonicalPayloadBytes,
 *          publicKeyObject,
 *          Buffer.from(license.signature, "base64")
 *        );
 *      The public key is compiled in below as PEM. The matching private key
 *      lives only on the licensing server and is never distributed.
 *
 *   6. Check expiration:
 *        - If `now <= expiresAt` → valid, not in grace
 *        - If `expiresAt < now <= expiresAt + GRACE_PERIOD_DAYS` →
 *          valid, `inGracePeriod: true`, surface renewal reminder to caller
 *        - Otherwise → `valid: false, error: "license expired"`
 *      Grace period is 14 days (see `schema.ts`). During grace, the plugin
 *      continues to fire hooks and register skills — the user's brain is
 *      never locked.
 *
 *   7. Optional machine binding: if `license.machineId` is present, compare
 *      against a stable machine fingerprint derived from system info. A
 *      mismatch → `valid: false, error: "license not valid for this machine"`.
 *
 *   8. Return the result. Callers use `valid` to decide whether to run hooks,
 *      `inGracePeriod` to surface a renewal nudge, and `tier` to gate pro/team
 *      features.
 *
 * Soft-fail behavior: a failed license check never deletes, hides, or locks
 * the user's brain folder. The plugin stops firing hooks; the user's data is
 * untouched. This is a design commitment, not an implementation detail.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";

import {
  GRACE_PERIOD_DAYS,
  type License,
  type LicenseCheckResult,
  type LicenseTier,
} from "./schema";

/**
 * Public key used to verify license signatures. Ed25519 PEM format.
 * Replace this placeholder with the real production public key before
 * shipping. The matching private key lives only on the licensing server.
 */
const AIOS_LICENSE_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAPLACEHOLDER_REPLACE_WITH_REAL_ED25519_PUBLIC_KEY====
-----END PUBLIC KEY-----`;

/**
 * Verify the license file at the user's home (or a provided root path).
 *
 * @param rootPath  The directory to look in first. Typically the user's AI-OS
 *                  brain root. Falls back to `~/.aios-license` if not found.
 * @returns         A structured result — see `LicenseCheckResult`.
 *
 * NOTE (Phase 3 stub): the current implementation returns a mock valid Pro
 * license. The signature verification, expiration logic, and grace handling
 * described above are wired in the shape of the function — only the crypto
 * call and real public key are pending.
 */
export async function checkLicense(
  rootPath: string,
): Promise<LicenseCheckResult> {
  try {
    const license = await readLicenseFile(rootPath);
    if (!license) {
      // Stub behavior: during development, treat "no license" as a valid Pro
      // license so the plugin runs end-to-end. Replace before shipping Phase 3.
      return { valid: true, tier: "pro" };
    }

    const structural = validateStructure(license);
    if (!structural.ok) {
      return { valid: false, error: structural.error };
    }

    // TODO(Phase 3): verify the ed25519 signature with node:crypto.verify.
    // For now, treat structurally valid licenses as authentic.
    //
    //   const canonical = canonicalBytes(license);
    //   const ok = verify(null, canonical, publicKeyObject, sig);
    //   if (!ok) return { valid: false, error: "invalid signature" };

    const expiresAt = new Date(license.expiresAt);
    const now = new Date();
    const graceCutoff = new Date(
      expiresAt.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000,
    );

    if (now <= expiresAt) {
      return {
        valid: true,
        tier: license.tier as LicenseTier,
        email: license.email,
        expiresAt,
      };
    }

    if (now <= graceCutoff) {
      return {
        valid: true,
        inGracePeriod: true,
        tier: license.tier as LicenseTier,
        email: license.email,
        expiresAt,
      };
    }

    return {
      valid: false,
      tier: license.tier as LicenseTier,
      email: license.email,
      expiresAt,
      error: "license expired beyond grace period",
    };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : "license check failed",
    };
  }
}

/**
 * Locate and read the license file. Checks `<rootPath>/.aios-license` first,
 * then `~/.aios-license`. Returns `null` if no file exists.
 */
async function readLicenseFile(rootPath: string): Promise<License | null> {
  const candidates = [
    path.join(rootPath, ".aios-license"),
    path.join(os.homedir(), ".aios-license"),
  ];

  for (const candidate of candidates) {
    try {
      const contents = await fs.readFile(candidate, "utf8");
      return JSON.parse(contents) as License;
    } catch (err) {
      // ENOENT → try the next candidate. Anything else propagates.
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        throw err;
      }
    }
  }

  return null;
}

/**
 * Validate the shape of a parsed license. This catches malformed or
 * tampered-with files before we attempt signature verification.
 */
function validateStructure(
  license: Partial<License>,
): { ok: true } | { ok: false; error: string } {
  if (!license || typeof license !== "object") {
    return { ok: false, error: "license is not an object" };
  }
  if (typeof license.email !== "string" || !license.email.includes("@")) {
    return { ok: false, error: "license email missing or invalid" };
  }
  if (
    license.tier !== "starter" &&
    license.tier !== "pro" &&
    license.tier !== "team"
  ) {
    return { ok: false, error: "license tier missing or invalid" };
  }
  if (
    typeof license.issuedAt !== "string" ||
    Number.isNaN(Date.parse(license.issuedAt))
  ) {
    return { ok: false, error: "license issuedAt missing or invalid" };
  }
  if (
    typeof license.expiresAt !== "string" ||
    Number.isNaN(Date.parse(license.expiresAt))
  ) {
    return { ok: false, error: "license expiresAt missing or invalid" };
  }
  if (license.schemaVersion !== 1) {
    return { ok: false, error: "unsupported license schema version" };
  }
  if (typeof license.signature !== "string" || license.signature.length === 0) {
    return { ok: false, error: "license signature missing" };
  }
  return { ok: true };
}

/**
 * Produce the canonical byte representation of a license payload for
 * signature verification. Sorted keys, no whitespace, `signature` stripped.
 *
 * Exported for testing.
 */
export function canonicalBytes(license: License): Buffer {
  const { signature: _signature, ...payload } = license;
  const sorted = Object.keys(payload)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = (payload as Record<string, unknown>)[key];
      return acc;
    }, {});
  return Buffer.from(JSON.stringify(sorted), "utf8");
}

// Re-export for consumers that want types alongside the check.
export type { License, LicenseCheckResult, LicenseTier } from "./schema";
export { AIOS_LICENSE_PUBLIC_KEY };
