import fs from 'node:fs';
import path from 'node:path';
import { aiosPath } from './paths';

export interface ConsolidationReport {
  date: string; // YYYY-MM-DD
  path: string; // relative to AIOS_ROOT
  filesDeleted: number;
  decisionsRouted: number;
  sensoryRouted: number;
  skillFeedbackRouted: number;
  patternsExtracted: number;
  correctionsLogged: number;
  memoryPromoted: number;
  dreamFile?: string;
  rawSections: { heading: string; body: string }[];
}

/**
 * Find the newest `consolidation-report-YYYY-MM-DD.md` under short-term.
 * Returns null if none exist (fresh brain, never run /nightly-brain-consolidation).
 */
export function loadLatestConsolidation(): ConsolidationReport | null {
  const dir = aiosPath('HIPPOCAMPUS/short-term');
  let names: string[];
  try {
    names = fs.readdirSync(dir);
  } catch {
    return null;
  }
  const reports = names
    .filter((n) => /^consolidation-report-\d{4}-\d{2}-\d{2}\.md$/.test(n))
    .sort()
    .reverse();
  const newest = reports[0];
  if (!newest) return null;

  const abs = path.join(dir, newest);
  let raw = '';
  try {
    raw = fs.readFileSync(abs, 'utf8');
  } catch {
    return null;
  }

  const date = newest.match(/(\d{4}-\d{2}-\d{2})/)?.[1] ?? '';
  return parseReport(raw, `HIPPOCAMPUS/short-term/${newest}`, date);
}

function parseReport(raw: string, relPath: string, date: string): ConsolidationReport {
  const body = raw.replace(/^---[\s\S]*?---\n/, '');

  const filesDeleted = extractNumber(body, /(\d+)\s+files?\s+deleted/i) ?? 0;
  const decisionsRouted = extractNumber(body, /Routed to HIPPOCAMPUS\/decisions\/:\s*(\d+)/i) ?? 0;
  const sensoryRouted = extractNumber(body, /Routed to SENSORY-CORTEX\/:\s*(\d+)/i) ?? 0;
  const skillFeedbackRouted =
    extractNumber(body, /(\d+)\s+new\s+skill-feedback\s+file/i) ?? 0;
  const correctionsLogged =
    extractNumber(body, /Corrections logged:\s*(\d+)/i) ?? 0;
  const patternsExtracted =
    extractNumber(body, /Pattern library stable at\s*(\d+)/i) ??
    extractNumber(body, /(\d+)\s+new\s+patterns?\s+extracted/i) ??
    0;
  const memoryPromoted = extractNumber(body, /Promoted to MEMORY\.md:\s*(\d+)/i) ?? 0;

  const dreamMatch = body.match(/Dream file written:\s*`?([^`\n]+)`?/i);
  const dreamFile = dreamMatch?.[1]?.trim();

  // Collect ## sections for the drill-down UI.
  const sections: { heading: string; body: string }[] = [];
  const parts = body.split(/^##\s+/m);
  for (const part of parts.slice(1)) {
    const [heading, ...rest] = part.split('\n');
    sections.push({ heading: heading.trim(), body: rest.join('\n').trim() });
  }

  return {
    date,
    path: relPath,
    filesDeleted,
    decisionsRouted,
    sensoryRouted,
    skillFeedbackRouted,
    patternsExtracted,
    correctionsLogged,
    memoryPromoted,
    dreamFile,
    rawSections: sections,
  };
}

function extractNumber(text: string, re: RegExp): number | null {
  const m = text.match(re);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}
