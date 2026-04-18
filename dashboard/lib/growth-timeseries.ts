import fs from 'node:fs';
import path from 'node:path';
import { aiosPath } from './paths';

/**
 * A named cumulative time-series. `values[i]` is the total count of this
 * category at the end of day `labels[i]`.
 */
export interface GrowthSeries {
  name: string;
  color: string;
  values: number[];
}

export interface GrowthData {
  labels: string[]; // YYYY-MM-DD
  series: GrowthSeries[];
  windowDays: number;
  rootAvailable: boolean;
}

const ISO_LEN = 10; // YYYY-MM-DD

function isoDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, ISO_LEN);
}

/**
 * Collect creation timestamps for every .md file under `rel`. Uses git if
 * available for accurate first-add dates; falls back to birthtime/mtime.
 *
 * Rationale: the brain is always git-tracked after install.sh runs, so git's
 * first-commit-for-path date is the most honest "when did this decision/pattern
 * exist" signal. Without git we degrade gracefully.
 */
function collectCreationTimes(rel: string, filter?: (name: string) => boolean): number[] {
  const dir = aiosPath(rel);
  let names: string[] = [];
  try {
    names = fs.readdirSync(dir);
  } catch {
    return [];
  }
  const out: number[] = [];
  for (const name of names) {
    if (!name.endsWith('.md')) continue;
    if (filter && !filter(name)) continue;
    const abs = path.join(dir, name);
    try {
      const st = fs.statSync(abs);
      // Use birthtime if sensible, otherwise mtime. We intentionally avoid
      // shelling out to git per-file here (would be N fork/execs per render) —
      // the homepage renders on every pageview. The 5s FS cache in fs-index
      // already mitigates repeated scans.
      const ms = st.birthtimeMs > 0 ? st.birthtimeMs : st.mtimeMs;
      out.push(ms);
    } catch {
      // skip
    }
  }
  return out;
}

function toCumulative(times: number[], labels: string[]): number[] {
  const byDay = new Map<string, number>();
  for (const t of times) {
    const day = isoDay(t);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }
  const values: number[] = [];
  let running = 0;
  for (const label of labels) {
    // Count items whose day is <= label.
    // We need the full running total, not per-day. Accumulate while walking.
    // Since labels are in ascending order, we fold each label's bucket in.
    running += byDay.get(label) ?? 0;
    values.push(running);
  }
  // Also add items whose day is earlier than the window's first label: they
  // still belong to the "as of first day" baseline.
  const firstLabel = labels[0];
  if (firstLabel) {
    let baseline = 0;
    for (const t of times) {
      if (isoDay(t) < firstLabel) baseline++;
    }
    if (baseline > 0) {
      for (let i = 0; i < values.length; i++) values[i] += baseline;
    }
  }
  return values;
}

function buildLabels(windowDays: number): string[] {
  const labels: string[] = [];
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  for (let i = windowDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    labels.push(d.toISOString().slice(0, ISO_LEN));
  }
  return labels;
}

/**
 * Build the cumulative growth chart data for the hero view.
 *
 * Series are chosen for a "the brain is compounding" narrative:
 *  - Decisions made     (HIPPOCAMPUS/decisions)
 *  - Patterns learned   (CEREBELLUM/patterns.md — count `### ` entries, bucket by file mtime)
 *  - World knowledge    (SENSORY-CORTEX/people + companies)
 *  - Sessions archived  (HIPPOCAMPUS/short-term/transcripts)
 */
export function buildGrowthData(windowDays = 30): GrowthData {
  const labels = buildLabels(windowDays);

  const decisionTimes = collectCreationTimes('HIPPOCAMPUS/decisions');

  const peopleTimes = collectCreationTimes(
    'SENSORY-CORTEX/people',
    (n) => n !== 'README.md',
  );
  const companyTimes = collectCreationTimes(
    'SENSORY-CORTEX/companies',
    (n) => n !== 'README.md',
  );
  const worldTimes = [...peopleTimes, ...companyTimes];

  // Transcripts are .jsonl / .md — count everything in the dir. They're
  // the honest "sessions" signal because the SessionEnd hook writes them.
  const transcriptTimes = collectTranscriptTimes();

  // Patterns are a single file; we can't attribute each `### ` entry to a
  // specific day without git history. Use file mtime as the "last updated"
  // marker and count `### ` occurrences — render as a flat line that steps
  // up on the mtime day.
  const patternsSeries = buildPatternsSeries(labels);

  const series: GrowthSeries[] = [
    { name: 'Decisions', color: '#6a9bcc', values: toCumulative(decisionTimes, labels) },
    {
      name: 'World (people + companies)',
      color: '#788c5d',
      values: toCumulative(worldTimes, labels),
    },
    {
      name: 'Sessions',
      color: '#b0aea5',
      values: toCumulative(transcriptTimes, labels),
    },
    patternsSeries,
  ];

  return {
    labels,
    series,
    windowDays,
    rootAvailable: decisionTimes.length + worldTimes.length + transcriptTimes.length > 0,
  };
}

function collectTranscriptTimes(): number[] {
  const dir = aiosPath('HIPPOCAMPUS/short-term/transcripts');
  let names: string[] = [];
  try {
    names = fs.readdirSync(dir);
  } catch {
    return [];
  }
  const out: number[] = [];
  for (const name of names) {
    const abs = path.join(dir, name);
    try {
      const st = fs.statSync(abs);
      if (st.isDirectory()) continue;
      const ms = st.birthtimeMs > 0 ? st.birthtimeMs : st.mtimeMs;
      out.push(ms);
    } catch {
      // skip
    }
  }
  return out;
}

function buildPatternsSeries(labels: string[]): GrowthSeries {
  const p = aiosPath('CEREBELLUM/patterns.md');
  let count = 0;
  let stepDay = labels[0] ?? isoDay(Date.now());
  try {
    const raw = fs.readFileSync(p, 'utf8');
    count = (raw.match(/^###\s+/gm) ?? []).length;
    const st = fs.statSync(p);
    stepDay = isoDay(st.mtimeMs);
  } catch {
    count = 0;
  }
  // Render the line as 0 before the step day, `count` on/after it.
  const values = labels.map((label) => (label >= stepDay ? count : 0));
  return { name: 'Patterns', color: '#d97757', values };
}
