import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { AIOS_ROOT, aiosRootExists, toRelative } from './paths';

/** Frontmatter shape — loose because authors differ, but common keys typed. */
export interface Frontmatter {
  type?: string;
  tags?: string[];
  related?: string[];
  created?: string;
  updated?: string;
  status?: string;
  [key: string]: unknown;
}

export interface IndexedFile {
  /** Absolute path on disk. */
  absPath: string;
  /** Forward-slash path relative to AIOS_ROOT (e.g. `HIPPOCAMPUS/decisions/foo.md`). */
  relPath: string;
  /** Top-level directory — treated as the "region" for routing. */
  region: string;
  /** Path segments inside the region (e.g. `['decisions', 'foo.md']`). */
  regionPath: string[];
  /** File slug — basename without extension. */
  slug: string;
  /** Lowercased slug without extension, used for wiki-link resolution. */
  matchSlug: string;
  /** File name with extension. */
  fileName: string;
  /** Human-friendly title: `title` frontmatter, first `#` heading, or slug. */
  title: string;
  /** Parsed frontmatter (empty object for files with none). */
  frontmatter: Frontmatter;
  /** Body text with frontmatter stripped. */
  body: string;
  /** Wiki-link targets referenced from this file (normalised to lowercase). */
  links: string[];
  /** fs.Stats-derived milliseconds for sorting. */
  mtimeMs: number;
  birthtimeMs: number;
  /** File size in bytes. */
  size: number;
}

const IGNORED_DIRS = new Set([
  '.git',
  '.obsidian',
  'node_modules',
  '.next',
  '.vercel',
  '.DS_Store',
  'dashboard'
]);

const SUPPORTED_EXT = new Set(['.md', '.markdown', '.mdx']);

const WIKI_LINK_RE = /\[\[([^\]|#]+?)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;

function extractWikiLinks(body: string): string[] {
  const out = new Set<string>();
  for (const m of body.matchAll(WIKI_LINK_RE)) {
    const raw = m[1]?.trim();
    if (!raw) continue;
    out.add(raw.toLowerCase());
  }
  return Array.from(out);
}

function firstHeading(body: string): string | undefined {
  const m = body.match(/^#\s+(.+)$/m);
  return m?.[1]?.trim();
}

function stripExt(name: string): string {
  const i = name.lastIndexOf('.');
  return i === -1 ? name : name.slice(0, i);
}

function walk(dir: string, out: string[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    if (ent.name.startsWith('.') && IGNORED_DIRS.has(ent.name)) continue;
    if (IGNORED_DIRS.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walk(full, out);
    } else if (ent.isFile()) {
      const ext = path.extname(ent.name).toLowerCase();
      if (SUPPORTED_EXT.has(ext)) out.push(full);
    }
  }
}

function readFile(abs: string): IndexedFile | null {
  let raw: string;
  let stat: fs.Stats;
  try {
    raw = fs.readFileSync(abs, 'utf8');
    stat = fs.statSync(abs);
  } catch {
    return null;
  }

  let fm: Frontmatter = {};
  let body = raw;
  try {
    const parsed = matter(raw);
    fm = (parsed.data ?? {}) as Frontmatter;
    body = parsed.content ?? '';
  } catch {
    // Files with malformed YAML still show up — we just lose frontmatter.
    fm = {};
    body = raw;
  }

  const rel = toRelative(abs);
  const segments = rel.split('/').filter(Boolean);
  const region = segments[0] ?? '';
  const regionPath = segments.slice(1);
  const fileName = path.basename(abs);
  const slug = stripExt(fileName);
  const matchSlug = slug.toLowerCase();
  const title =
    (typeof fm.title === 'string' && fm.title.trim()) ||
    firstHeading(body) ||
    slug;

  return {
    absPath: abs,
    relPath: rel,
    region,
    regionPath,
    slug,
    matchSlug,
    fileName,
    title,
    frontmatter: fm,
    body,
    links: extractWikiLinks(body),
    mtimeMs: stat.mtimeMs,
    birthtimeMs: stat.birthtimeMs || stat.ctimeMs,
    size: stat.size
  };
}

let cache: IndexedFile[] | null = null;
let cacheAt = 0;
const CACHE_TTL_MS = 5_000;

/**
 * Walk AIOS_ROOT and return every supported markdown file with
 * frontmatter + wiki-link metadata attached.
 *
 * Short-lived cache (5s) so a single page request doing multiple reads
 * doesn't re-walk the filesystem repeatedly.
 */
export function getIndex(options?: { force?: boolean }): IndexedFile[] {
  if (!options?.force && cache && Date.now() - cacheAt < CACHE_TTL_MS) {
    return cache;
  }
  if (!aiosRootExists()) {
    cache = [];
    cacheAt = Date.now();
    return cache;
  }

  const paths: string[] = [];
  walk(AIOS_ROOT, paths);

  const out: IndexedFile[] = [];
  for (const p of paths) {
    const f = readFile(p);
    if (f) out.push(f);
  }
  out.sort((a, b) => a.relPath.localeCompare(b.relPath));

  cache = out;
  cacheAt = Date.now();
  return cache;
}

/** Filter the index by region id (top-level folder). */
export function filesByRegion(region: string): IndexedFile[] {
  return getIndex().filter((f) => f.region === region);
}

/** Look up a single file by its relative path. */
export function findByRelPath(relPath: string): IndexedFile | undefined {
  const wanted = relPath.replace(/^\/+/, '').split('/').filter(Boolean).join('/');
  return getIndex().find((f) => f.relPath === wanted);
}

/** Discover all top-level folders present in AIOS_ROOT. */
export function topLevelRegions(): string[] {
  if (!aiosRootExists()) return [];
  try {
    return fs
      .readdirSync(AIOS_ROOT, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !IGNORED_DIRS.has(d.name) && !d.name.startsWith('.'))
      .map((d) => d.name)
      .sort();
  } catch {
    return [];
  }
}
