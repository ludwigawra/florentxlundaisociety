import path from 'node:path';
import fs from 'node:fs';

/**
 * Absolute path to the AI-OS brain folder this dashboard reads from.
 * Defaults to `..` (the parent of the dashboard package).
 *
 * The dashboard is strictly read-only; nothing here writes to AIOS_ROOT.
 */
export const AIOS_ROOT: string = (() => {
  const raw = process.env.AIOS_ROOT ?? '..';
  return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
})();

/** True if `AIOS_ROOT` exists and is a directory. */
export function aiosRootExists(): boolean {
  try {
    return fs.statSync(AIOS_ROOT).isDirectory();
  } catch {
    return false;
  }
}

/** Join a relative path inside AIOS_ROOT, guarding against traversal. */
export function aiosPath(...segments: string[]): string {
  const joined = path.join(AIOS_ROOT, ...segments);
  const resolved = path.resolve(joined);
  if (!resolved.startsWith(path.resolve(AIOS_ROOT))) {
    throw new Error(`Refusing to resolve outside AIOS_ROOT: ${joined}`);
  }
  return resolved;
}

/** Convert an absolute path inside AIOS_ROOT to a forward-slash relative path. */
export function toRelative(absPath: string): string {
  const rel = path.relative(AIOS_ROOT, absPath);
  return rel.split(path.sep).join('/');
}
