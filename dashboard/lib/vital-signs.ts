import fs from 'node:fs';
import path from 'node:path';
import { aiosPath, aiosRootExists } from './paths';

export type Severity = 'green' | 'yellow' | 'red' | 'unknown';

export interface VitalSign {
  id: 'st-memory' | 'consolidation' | 'corrections';
  label: string;
  value: number | null;
  /** Short qualifier like "files", "days", "unextracted". */
  unit: string;
  severity: Severity;
  note: string;
  /** File or command that produced the number — rendered as "Source:". */
  source: string;
}

/*
 * Thresholds come straight from META-COGNITION/vital-signs.md.
 *
 * 1. Short-term memory files: green 0-10, yellow 11-20, red 21+
 * 2. Consolidation freshness: green 0-1 day, yellow 2-3, red 4+
 * 3. Unextracted corrections: green 0-4, yellow 5-7, red 8+
 */

function severityForCount(count: number, yellowAt: number, redAt: number): Severity {
  if (count >= redAt) return 'red';
  if (count >= yellowAt) return 'yellow';
  return 'green';
}

function severityForDays(days: number, yellowAt: number, redAt: number): Severity {
  if (days >= redAt) return 'red';
  if (days >= yellowAt) return 'yellow';
  return 'green';
}

function listDir(dir: string): string[] {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
}

function computeShortTermMemory(): VitalSign {
  const dir = aiosPath('HIPPOCAMPUS/short-term');
  const entries = listDir(dir).filter((name) => {
    if (!name.endsWith('.md')) return false;
    if (name === 'README.md') return false;
    if (name.startsWith('consolidation-report-')) return false;
    if (name.startsWith('dream-')) return false;
    return true;
  });
  const count = entries.length;
  const sev = severityForCount(count, 11, 21);
  const note =
    sev === 'green'
      ? 'Normal load'
      : sev === 'yellow'
        ? 'Accumulating — consolidation may be falling behind'
        : 'Overloaded — run consolidation before other work';
  return {
    id: 'st-memory',
    label: 'Short-term memory',
    value: count,
    unit: 'files',
    severity: sev,
    note,
    source: 'HIPPOCAMPUS/short-term/'
  };
}

function computeConsolidationFreshness(): VitalSign {
  const dir = aiosPath('HIPPOCAMPUS/short-term');
  const reports = listDir(dir).filter((n) => n.startsWith('consolidation-report-') && n.endsWith('.md'));
  if (reports.length === 0) {
    return {
      id: 'consolidation',
      label: 'Consolidation freshness',
      value: null,
      unit: 'days',
      severity: 'unknown',
      note: 'No consolidation report found',
      source: 'HIPPOCAMPUS/short-term/consolidation-report-*.md'
    };
  }
  let mostRecent = 0;
  for (const name of reports) {
    try {
      const st = fs.statSync(path.join(dir, name));
      if (st.mtimeMs > mostRecent) mostRecent = st.mtimeMs;
    } catch {
      // ignore
    }
  }
  if (!mostRecent) {
    return {
      id: 'consolidation',
      label: 'Consolidation freshness',
      value: null,
      unit: 'days',
      severity: 'unknown',
      note: 'Could not stat consolidation reports',
      source: 'HIPPOCAMPUS/short-term/consolidation-report-*.md'
    };
  }
  const days = Math.floor((Date.now() - mostRecent) / (1000 * 60 * 60 * 24));
  const sev = severityForDays(days, 2, 4);
  const note =
    sev === 'green'
      ? 'Fresh'
      : sev === 'yellow'
        ? 'Stale — check nightly trigger'
        : 'Stalled — run consolidation before other work';
  return {
    id: 'consolidation',
    label: 'Consolidation freshness',
    value: days,
    unit: 'days',
    severity: sev,
    note,
    source: 'HIPPOCAMPUS/short-term/consolidation-report-*.md'
  };
}

function computeUnextractedCorrections(): VitalSign {
  const file = aiosPath('CEREBELLUM/corrections.md');
  let raw: string;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch {
    return {
      id: 'corrections',
      label: 'Unextracted corrections',
      value: null,
      unit: 'entries',
      severity: 'unknown',
      note: 'corrections.md not found',
      source: 'CEREBELLUM/corrections.md'
    };
  }
  // Convention from the AI-OS: one entry per `### ` block; an entry is
  // considered extracted once it carries the `[extracted]` tag somewhere
  // in its body.
  const blocks = raw.split(/^###\s+/m).slice(1);
  let unextracted = 0;
  for (const block of blocks) {
    if (!/\[extracted\]/i.test(block)) unextracted++;
  }
  const sev = severityForCount(unextracted, 5, 8);
  const note =
    sev === 'green'
      ? 'Normal'
      : sev === 'yellow'
        ? 'Threshold approaching — extract when time allows'
        : 'Learning backlog — extract patterns before other work';
  return {
    id: 'corrections',
    label: 'Unextracted corrections',
    value: unextracted,
    unit: 'entries',
    severity: sev,
    note,
    source: 'CEREBELLUM/corrections.md'
  };
}

export function getVitalSigns(): VitalSign[] {
  if (!aiosRootExists()) {
    return [
      {
        id: 'st-memory',
        label: 'Short-term memory',
        value: null,
        unit: 'files',
        severity: 'unknown',
        note: 'AIOS_ROOT not configured',
        source: 'HIPPOCAMPUS/short-term/'
      },
      {
        id: 'consolidation',
        label: 'Consolidation freshness',
        value: null,
        unit: 'days',
        severity: 'unknown',
        note: 'AIOS_ROOT not configured',
        source: 'HIPPOCAMPUS/short-term/consolidation-report-*.md'
      },
      {
        id: 'corrections',
        label: 'Unextracted corrections',
        value: null,
        unit: 'entries',
        severity: 'unknown',
        note: 'AIOS_ROOT not configured',
        source: 'CEREBELLUM/corrections.md'
      }
    ];
  }
  return [
    computeShortTermMemory(),
    computeConsolidationFreshness(),
    computeUnextractedCorrections()
  ];
}
