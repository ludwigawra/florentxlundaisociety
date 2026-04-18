import fs from 'node:fs';
import path from 'node:path';
import { aiosPath } from './paths';

export type CalibrationStatus = 'learning' | 'calibrated' | 'graduated' | 'unknown';

export interface SkillCalibration {
  skill: string;
  usageCount: number | null;
  approvalRate: string | null; // raw string, e.g. "~50%" or "82%"
  status: CalibrationStatus;
  lastImproved: string | null; // YYYY-MM-DD or null
  file: string; // relative
  feedbackEntries: number; // count of `### ` in the file
  bytes: number;
}

/**
 * Read every CEREBELLUM/skill-feedback/*.md file and parse its frontmatter +
 * some light structure signals. Resilient to missing fields.
 */
export function loadSkillCalibrations(): SkillCalibration[] {
  const dir = aiosPath('CEREBELLUM/skill-feedback');
  let names: string[];
  try {
    names = fs.readdirSync(dir);
  } catch {
    return [];
  }
  const out: SkillCalibration[] = [];
  for (const name of names) {
    if (!name.endsWith('.md')) continue;
    if (name === 'README.md') continue;
    const abs = path.join(dir, name);
    let raw = '';
    let bytes = 0;
    try {
      raw = fs.readFileSync(abs, 'utf8');
      bytes = fs.statSync(abs).size;
    } catch {
      continue;
    }
    const fm = parseFrontmatter(raw);
    const status = normalizeStatus(fm.calibration_status);
    const feedbackEntries = (raw.match(/^###\s+/gm) ?? []).length;
    const usageCount =
      typeof fm.usage_count === 'number'
        ? fm.usage_count
        : Number.parseInt(String(fm.usage_count ?? ''), 10);
    out.push({
      skill: String(fm.skill ?? name.replace(/\.md$/, '')),
      usageCount: Number.isFinite(usageCount) ? (usageCount as number) : null,
      approvalRate: fm.approval_rate ? String(fm.approval_rate) : null,
      status,
      lastImproved:
        fm.last_improved && fm.last_improved !== 'null' ? String(fm.last_improved) : null,
      file: `CEREBELLUM/skill-feedback/${name}`,
      feedbackEntries,
      bytes,
    });
  }

  // Sort: learning first (most interesting), then calibrated, then graduated,
  // then by feedback volume desc.
  const order: Record<CalibrationStatus, number> = {
    learning: 0,
    calibrated: 1,
    graduated: 2,
    unknown: 3,
  };
  out.sort((a, b) => {
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    return b.feedbackEntries - a.feedbackEntries;
  });
  return out;
}

function parseFrontmatter(raw: string): Record<string, unknown> {
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const out: Record<string, unknown> = {};
  for (const line of m[1].split('\n')) {
    const [k, ...rest] = line.split(':');
    if (!k || rest.length === 0) continue;
    const key = k.trim();
    const val = rest.join(':').trim().replace(/^"|"$/g, '');
    if (/^\d+$/.test(val)) out[key] = Number(val);
    else out[key] = val;
  }
  return out;
}

function normalizeStatus(v: unknown): CalibrationStatus {
  const s = String(v ?? '').toLowerCase();
  if (s === 'learning' || s === 'calibrated' || s === 'graduated') return s;
  return 'unknown';
}
