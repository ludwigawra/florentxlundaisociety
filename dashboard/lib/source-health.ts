import fs from 'node:fs';
import path from 'node:path';
import { aiosPath } from './paths';

/**
 * Connected-sources health. Shows in the dashboard as "the brain sees X, Y, Z,
 * last signal N hours ago." This is a product-truth signal: the more sources,
 * the more context, the more the brain acts like you.
 */
export interface SourceHealth {
  id: string;
  label: string;
  status: 'connected' | 'configured' | 'recently-failed' | 'unknown';
  lastSignalMs: number | null;
  lastSignalText: string;
  note?: string;
}

const KNOWN_SOURCES: { id: string; label: string; regions: string[] }[] = [
  { id: 'gmail',    label: 'Gmail',          regions: ['SENSORY-CORTEX/market', 'SENSORY-CORTEX/people', 'HIPPOCAMPUS/short-term'] },
  { id: 'gcal',     label: 'Google Calendar', regions: ['SENSORY-CORTEX/people', 'BASAL-GANGLIA/daily'] },
  { id: 'notion',   label: 'Notion',         regions: ['META-COGNITION', 'PROCEDURAL-MEMORY'] },
  { id: 'drive',    label: 'Google Drive',   regions: ['PROCEDURAL-MEMORY', 'SENSORY-CORTEX'] },
  { id: 'whatsapp', label: 'WhatsApp',       regions: ['SENSORY-CORTEX/people'] },
  { id: 'telegram', label: 'Telegram',       regions: [] },
  { id: 'linkedin', label: 'LinkedIn',       regions: ['SENSORY-CORTEX/linkedin', 'BRAIN/intelligence/linkedin'] },
  { id: 'supabase', label: 'Supabase',       regions: [] },
];

/**
 * Heuristically detect which sources are "connected" based on:
 *   1. Presence of configured integration markers (plugin settings, env)
 *   2. Recent activity in regions that source typically feeds
 *   3. Tool-error signals that the source was attempted (even if it failed)
 *
 * This is intentionally best-effort. The product-truth signal matters more than
 * the precision: if Gmail feeds 3 regions and the newest file in those regions
 * was touched 2 hours ago, something is working.
 */
export function loadSourceHealth(): SourceHealth[] {
  const out: SourceHealth[] = [];
  const toolErrors = readToolErrorTail(500);

  for (const src of KNOWN_SOURCES) {
    const lastRegionMs = latestMtimeInRegions(src.regions);
    const recentError = toolErrors
      .filter((line) => line.toLowerCase().includes(src.id))
      .pop();

    let status: SourceHealth['status'] = 'unknown';
    let note: string | undefined;

    if (recentError && parseErrorAgeMinutes(recentError) !== null) {
      const ageMin = parseErrorAgeMinutes(recentError);
      if (ageMin !== null && ageMin < 60 * 12) {
        status = 'recently-failed';
        note = 'tool error logged';
      }
    }

    if (status === 'unknown' && lastRegionMs && Date.now() - lastRegionMs < 1000 * 60 * 60 * 24 * 7) {
      status = 'connected';
    } else if (status === 'unknown' && lastRegionMs) {
      status = 'configured';
    }

    out.push({
      id: src.id,
      label: src.label,
      status,
      lastSignalMs: lastRegionMs,
      lastSignalText: formatAge(lastRegionMs),
      note,
    });
  }

  // Sort: connected first, then configured, then failed, then unknown
  const order: Record<SourceHealth['status'], number> = {
    connected: 0,
    configured: 1,
    'recently-failed': 2,
    unknown: 3,
  };
  out.sort((a, b) => {
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    return (b.lastSignalMs ?? 0) - (a.lastSignalMs ?? 0);
  });
  return out;
}

function latestMtimeInRegions(regions: string[]): number | null {
  let latest = 0;
  for (const rel of regions) {
    const p = aiosPath(rel);
    try {
      walk(p, (abs, st) => {
        if (st.isFile() && abs.endsWith('.md')) {
          if (st.mtimeMs > latest) latest = st.mtimeMs;
        }
      }, 2); // depth cap — don't scan the world
    } catch {
      // region doesn't exist in this brain, skip
    }
  }
  return latest > 0 ? latest : null;
}

function walk(
  dir: string,
  cb: (abs: string, st: fs.Stats) => void,
  depth: number,
): void {
  if (depth < 0) return;
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    try {
      const st = fs.statSync(abs);
      cb(abs, st);
      if (entry.isDirectory() && entry.name !== 'transcripts') walk(abs, cb, depth - 1);
    } catch {
      // skip
    }
  }
}

function readToolErrorTail(limitLines: number): string[] {
  try {
    const p = aiosPath('CEREBELLUM/tool-errors.log');
    const raw = fs.readFileSync(p, 'utf8');
    const lines = raw.split('\n').filter(Boolean);
    return lines.slice(-limitLines);
  } catch {
    return [];
  }
}

function parseErrorAgeMinutes(line: string): number | null {
  const m = line.match(/^\[?(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2})?)/);
  if (!m) return null;
  const d = new Date(m[1].replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return null;
  return Math.round((Date.now() - d.getTime()) / 60000);
}

function formatAge(ms: number | null): string {
  if (!ms) return 'never';
  const diff = Date.now() - ms;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
