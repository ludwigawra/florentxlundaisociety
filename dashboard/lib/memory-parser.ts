import fs from 'node:fs';
import { aiosPath, aiosRootExists } from './paths';

export interface MemorySection {
  /** Header text, e.g. "Active Context". */
  section: string;
  /** Slug of the section, for anchors. */
  slug: string;
  /** Body Markdown between this `## ` header and the next one. */
  body: string;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s-]+/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/**
 * Split MEMORY.md into sections keyed by its `## ` headers.
 * Everything before the first `## ` is discarded (title + preamble).
 */
export function parseMemoryMd(raw: string): MemorySection[] {
  const lines = raw.split(/\r?\n/);
  const out: MemorySection[] = [];
  let current: { section: string; bodyLines: string[] } | null = null;

  for (const line of lines) {
    const m = /^##\s+(.+?)\s*$/.exec(line);
    if (m && !line.startsWith('###')) {
      if (current) {
        out.push({
          section: current.section,
          slug: slugify(current.section),
          body: current.bodyLines.join('\n').trim()
        });
      }
      current = { section: m[1], bodyLines: [] };
      continue;
    }
    if (current) current.bodyLines.push(line);
  }
  if (current) {
    out.push({
      section: current.section,
      slug: slugify(current.section),
      body: current.bodyLines.join('\n').trim()
    });
  }
  return out;
}

export function readMemoryMd(): { raw: string; sections: MemorySection[] } {
  if (!aiosRootExists()) return { raw: '', sections: [] };
  let raw = '';
  try {
    raw = fs.readFileSync(aiosPath('MEMORY.md'), 'utf8');
  } catch {
    return { raw: '', sections: [] };
  }
  return { raw, sections: parseMemoryMd(raw) };
}

/** Pull a single section by its header (case-insensitive match). */
export function getMemorySection(name: string): MemorySection | undefined {
  const { sections } = readMemoryMd();
  const wanted = name.toLowerCase();
  return sections.find((s) => s.section.toLowerCase() === wanted);
}
