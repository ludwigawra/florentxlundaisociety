import fs from 'node:fs';
import { aiosPath } from './paths';

/**
 * A single row in BASAL-GANGLIA/autonomous-runs.jsonl.
 *
 * Each autonomous skill (`nightly-brain-consolidation`, `nightly-goal-pursuit`,
 * `auto-outreach-queue`, etc.) appends one row on every fire. Never rewrite old
 * rows — the file is an append-only ledger.
 */
export interface AutonomousRun {
  ts: string; // ISO 8601
  skill: string;
  mode: string;
  status: 'completed' | 'pending-review' | 'failed' | 'partial';
  outputs: number;
  goal?: string;
  artifact?: string; // relative path to the produced file(s), comma-separated if >1
  note?: string;
  trigger?: 'cron' | 'manual' | 'chained';
}

export function loadAutonomousRuns(limit = 50): AutonomousRun[] {
  let raw: string;
  try {
    raw = fs.readFileSync(aiosPath('BASAL-GANGLIA/autonomous-runs.jsonl'), 'utf8');
  } catch {
    return [];
  }
  const rows: AutonomousRun[] = [];
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const obj = JSON.parse(trimmed);
      if (obj && typeof obj === 'object' && obj.ts && obj.skill) {
        rows.push(obj as AutonomousRun);
      }
    } catch {
      // skip malformed row
    }
  }
  // newest first
  rows.sort((a, b) => (a.ts < b.ts ? 1 : -1));
  return rows.slice(0, limit);
}

export function countPendingReview(runs: AutonomousRun[]): number {
  return runs.filter((r) => r.status === 'pending-review').length;
}

export function pendingReviewRuns(runs: AutonomousRun[]): AutonomousRun[] {
  return runs.filter((r) => r.status === 'pending-review');
}

export function groupByDay(
  runs: AutonomousRun[],
): { day: string; runs: AutonomousRun[] }[] {
  const map = new Map<string, AutonomousRun[]>();
  for (const r of runs) {
    const day = r.ts.slice(0, 10);
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(r);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([day, runs]) => ({ day, runs }));
}
