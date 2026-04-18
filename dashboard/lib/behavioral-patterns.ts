import fs from 'node:fs';
import { aiosPath } from './paths';

export type PatternConfidence = 'low' | 'medium' | 'high' | 'unknown';
export type PatternCategory =
  | 'voice'
  | 'skill-usage'
  | 'timing'
  | 'relationships'
  | 'tool-preferences'
  | 'goals'
  | 'unknown';

export interface BehavioralPattern {
  id: string;
  category: PatternCategory;
  confidence: PatternConfidence;
  observations: number;
  window: string;
  firstSeen: string | null;
  lastSeen: string | null;
  patternText: string;
  inferenceText: string;
}

/**
 * Parse `CEREBELLUM/behavioral-patterns.md` into individual pattern records.
 *
 * Each pattern is delimited by a frontmatter block and ends at the next
 * frontmatter block (or EOF). We're tolerant: if a pattern block is malformed,
 * we skip it rather than fail the whole render.
 */
export function loadBehavioralPatterns(): BehavioralPattern[] {
  let raw: string;
  try {
    raw = fs.readFileSync(aiosPath('CEREBELLUM/behavioral-patterns.md'), 'utf8');
  } catch {
    return [];
  }

  // Split on `---` frontmatter fences, being careful not to split the
  // preface or the `## How entries look` sample block. We only treat a
  // fence as a pattern start if it appears at column 0 AND the preceding
  // text ends a paragraph (blank line), AND the fence contains a
  // `pattern_id:` line inside.
  const blocks = extractBlocks(raw);
  const out: BehavioralPattern[] = [];
  for (const { fm, body } of blocks) {
    const id = fm.pattern_id;
    if (!id) continue;
    out.push({
      id: String(id),
      category: normalizeCategory(fm.category),
      confidence: normalizeConfidence(fm.confidence),
      observations: toInt(fm.observations),
      window: String(fm.window ?? ''),
      firstSeen: fm.first_seen ? String(fm.first_seen) : null,
      lastSeen: fm.last_seen ? String(fm.last_seen) : null,
      patternText: extractSection(body, 'The pattern'),
      inferenceText: extractSection(body, 'The inference'),
    });
  }

  // Sort by confidence (high first) then recency
  const rank: Record<PatternConfidence, number> = {
    high: 0,
    medium: 1,
    low: 2,
    unknown: 3,
  };
  out.sort((a, b) => {
    if (rank[a.confidence] !== rank[b.confidence]) {
      return rank[a.confidence] - rank[b.confidence];
    }
    const la = a.lastSeen ?? '';
    const lb = b.lastSeen ?? '';
    return lb.localeCompare(la);
  });
  return out;
}

interface Block {
  fm: Record<string, unknown>;
  body: string;
}

function extractBlocks(raw: string): Block[] {
  // Find every frontmatter fence at column 0 that contains `pattern_id:`.
  const blocks: Block[] = [];
  const fenceRe = /^---\n([\s\S]*?)\n---\n/gm;
  const matches: { start: number; end: number; fmRaw: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = fenceRe.exec(raw)) !== null) {
    if (!/^pattern_id:/m.test(m[1])) continue;
    matches.push({ start: m.index, end: fenceRe.lastIndex, fmRaw: m[1] });
  }
  for (let i = 0; i < matches.length; i++) {
    const { end, fmRaw } = matches[i];
    const nextStart = matches[i + 1]?.start ?? raw.length;
    const body = raw.slice(end, nextStart);
    blocks.push({ fm: parseFrontmatter(fmRaw), body });
  }
  return blocks;
}

function parseFrontmatter(raw: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const line of raw.split('\n')) {
    const [k, ...rest] = line.split(':');
    if (!k || rest.length === 0) continue;
    const key = k.trim();
    const val = rest.join(':').trim().replace(/^"|"$/g, '');
    out[key] = /^\d+$/.test(val) ? Number(val) : val;
  }
  return out;
}

function extractSection(body: string, heading: string): string {
  const re = new RegExp(`^##\\s+${heading}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, 'm');
  const m = body.match(re);
  if (!m) return '';
  return m[1].trim();
}

function normalizeCategory(v: unknown): PatternCategory {
  const s = String(v ?? '').toLowerCase();
  if (
    s === 'voice' ||
    s === 'skill-usage' ||
    s === 'timing' ||
    s === 'relationships' ||
    s === 'tool-preferences' ||
    s === 'goals'
  ) {
    return s;
  }
  return 'unknown';
}

function normalizeConfidence(v: unknown): PatternConfidence {
  const s = String(v ?? '').toLowerCase();
  if (s === 'low' || s === 'medium' || s === 'high') return s;
  return 'unknown';
}

function toInt(v: unknown): number {
  if (typeof v === 'number') return v;
  const n = Number.parseInt(String(v ?? ''), 10);
  return Number.isFinite(n) ? n : 0;
}
