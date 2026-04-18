import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { AIOS_ROOT, aiosRootExists } from './paths';

export interface DailyRegionActivity {
  /** ISO date yyyy-mm-dd */
  date: string;
  /** region id → commit count */
  byRegion: Record<string, number>;
  /** total commits touching files in known regions */
  total: number;
}

export interface ActivityResult {
  days: DailyRegionActivity[];
  totalCommits: number;
  regionsSeen: string[];
  available: boolean;
  /** Populated when git couldn't run — UI shows an inline note. */
  error?: string;
}

function isGitRepo(dir: string): boolean {
  try {
    return fs.statSync(path.join(dir, '.git')).isDirectory();
  } catch {
    return false;
  }
}

function runGit(args: string[]): string {
  return execFileSync('git', args, {
    cwd: AIOS_ROOT,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024
  });
}

function daysBack(n: number): string[] {
  const out: string[] = [];
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

/**
 * `git log --since=30.days --name-only` in AIOS_ROOT, bucketed per day per
 * top-level folder. Safe: falls back to `available: false` when the brain
 * folder isn't a git repo (or git is missing).
 */
export function getGitActivity(options?: { days?: number }): ActivityResult {
  const windowDays = options?.days ?? 30;
  const empty: ActivityResult = {
    days: daysBack(windowDays).map((date) => ({ date, byRegion: {}, total: 0 })),
    totalCommits: 0,
    regionsSeen: [],
    available: false
  };

  if (!aiosRootExists() || !isGitRepo(AIOS_ROOT)) {
    return { ...empty, error: 'AIOS_ROOT is not a git repository' };
  }

  let raw: string;
  try {
    raw = runGit([
      'log',
      `--since=${windowDays}.days`,
      '--pretty=format:%x00COMMIT %H %cI',
      '--name-only'
    ]);
  } catch (e) {
    return { ...empty, error: (e as Error).message };
  }

  const byDay = new Map<string, Map<string, number>>();
  const regionsSeen = new Set<string>();
  let totalCommits = 0;

  let currentDate: string | null = null;
  let countedThisCommit = new Set<string>();

  for (const line of raw.split('\n')) {
    if (line.startsWith('\x00COMMIT ')) {
      const parts = line.slice('\x00COMMIT '.length).split(' ');
      const iso = parts[1];
      if (iso) currentDate = iso.slice(0, 10);
      countedThisCommit = new Set<string>();
      totalCommits++;
      continue;
    }
    const file = line.trim();
    if (!file || !currentDate) continue;
    const region = file.split('/')[0];
    if (!region) continue;
    // Only count a region once per commit — we want "commits touching this
    // region today", not "files changed".
    const key = `${currentDate}::${region}`;
    if (countedThisCommit.has(key)) continue;
    countedThisCommit.add(key);

    regionsSeen.add(region);
    if (!byDay.has(currentDate)) byDay.set(currentDate, new Map());
    const m = byDay.get(currentDate)!;
    m.set(region, (m.get(region) ?? 0) + 1);
  }

  const days: DailyRegionActivity[] = daysBack(windowDays).map((date) => {
    const m = byDay.get(date) ?? new Map<string, number>();
    const byRegion: Record<string, number> = {};
    let total = 0;
    for (const [k, v] of m) {
      byRegion[k] = v;
      total += v;
    }
    return { date, byRegion, total };
  });

  return {
    days,
    totalCommits,
    regionsSeen: Array.from(regionsSeen).sort(),
    available: true
  };
}
