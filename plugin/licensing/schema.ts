/**
 * License file schema for AI-OS.
 *
 * A license is a JSON file stored at the user's home directory as `.aios-license`.
 * It contains subscription metadata and an ed25519 signature over the canonical
 * JSON representation of the metadata fields (everything except `signature`).
 *
 * The plugin verifies this file on session start (via the SessionStart hook) and
 * periodically during long-running work. Verification is offline — no network
 * call is required. The signature is produced by the AI-OS licensing server at
 * purchase time using a private key held only by the server. The public key is
 * compiled into the plugin.
 */

/**
 * Subscription tier. Determines which features are enabled.
 *
 * - `starter`: core brain + skills pack, single machine
 * - `pro`:     starter + dashboard pro views, priority skill updates, multi-device sync
 * - `team`:    shared regions, role-based access, admin controls
 */
export type LicenseTier = "starter" | "pro" | "team";

/**
 * The signed portion of the license. These are the fields included in the
 * canonical JSON blob that is signed by the licensing server. When verifying,
 * reconstruct this object (sorted keys, no whitespace) and verify against
 * `License.signature`.
 */
export interface LicensePayload {
  /** Email address the license was issued to. Lowercased, trimmed. */
  email: string;

  /** Subscription tier granted by this license. */
  tier: LicenseTier;

  /** ISO-8601 timestamp (UTC) of when the license was issued. */
  issuedAt: string;

  /** ISO-8601 timestamp (UTC) of when the license expires. */
  expiresAt: string;

  /**
   * License schema version. Incremented when the payload shape changes so
   * old clients can detect a license they don't understand and request a
   * refresh.
   */
  schemaVersion: 1;

  /**
   * Optional machine fingerprint. When present, the license is bound to this
   * machine. Absent for team tiers, where the license travels with the user.
   */
  machineId?: string;

  /**
   * Optional license identifier — useful for support and revocation. Not
   * required for verification.
   */
  licenseId?: string;
}

/**
 * The complete license file on disk. Adds a signature over the payload.
 */
export interface License extends LicensePayload {
  /**
   * Base64-encoded ed25519 signature over the canonical JSON representation
   * of `LicensePayload` (i.e. this object with `signature` removed, with
   * sorted keys and no whitespace).
   */
  signature: string;
}

/**
 * The shape returned by `checkLicense`. Reflects the three outcomes:
 *   - valid:   signature verifies, not expired (or within grace)
 *   - invalid: signature fails, structure malformed, or expired past grace
 *   - missing: no license file present
 *
 * When a license is valid or within grace, enough metadata is returned to
 * allow the caller to decide what features to enable.
 */
export interface LicenseCheckResult {
  valid: boolean;
  tier?: LicenseTier;
  email?: string;
  expiresAt?: Date;

  /**
   * True if the license is past `expiresAt` but still within the grace
   * window (see `GRACE_PERIOD_DAYS`). Treat as valid but surface a renewal
   * reminder to the user.
   */
  inGracePeriod?: boolean;

  /** Human-readable error when `valid` is false. */
  error?: string;
}

/**
 * Number of days after expiration during which the license continues to work.
 * Intended to absorb renewal friction without locking the user out.
 */
export const GRACE_PERIOD_DAYS = 14;
