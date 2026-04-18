import { getIndex, type IndexedFile } from './fs-index';

/**
 * Build a slug → file map for wiki-link resolution. If multiple files
 * share the same slug (e.g. `foo.md` in two regions), the first one in
 * index order wins — the others are still reachable through their
 * direct routes.
 */
function bySlug(): Map<string, IndexedFile> {
  const idx = getIndex();
  const map = new Map<string, IndexedFile>();
  for (const f of idx) {
    if (!map.has(f.matchSlug)) map.set(f.matchSlug, f);
  }
  return map;
}

/** Route used by the detail page for a given indexed file. */
export function fileRoute(f: IndexedFile): string {
  const segs = f.regionPath.map((s) => encodeURIComponent(s)).join('/');
  return `/r/${encodeURIComponent(f.region)}/${segs}`;
}

export interface ResolvedLink {
  href: string;
  label: string;
  resolved: boolean;
}

/**
 * Resolve a wiki-link target to an internal route.
 * Returns `{ resolved: false }` when no file matches — callers render
 * that state with an orange dotted underline.
 */
export function resolveWikiLink(target: string, label?: string): ResolvedLink {
  const wanted = target.trim().toLowerCase();
  const hit = bySlug().get(wanted);
  if (hit) {
    return { href: fileRoute(hit), label: label ?? target, resolved: true };
  }
  return {
    href: `/search?q=${encodeURIComponent(target)}`,
    label: label ?? target,
    resolved: false
  };
}

/** Files that link TO the given file (by slug). */
export function getBacklinks(target: IndexedFile): IndexedFile[] {
  const slug = target.matchSlug;
  const out: IndexedFile[] = [];
  for (const f of getIndex()) {
    if (f.absPath === target.absPath) continue;
    if (f.links.includes(slug)) out.push(f);
  }
  return out;
}
