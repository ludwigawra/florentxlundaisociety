import Link from 'next/link';
import FrontmatterChips from '@/components/FrontmatterChips';
import { aiosRootExists } from '@/lib/paths';
import { getIndex, type IndexedFile } from '@/lib/fs-index';
import { fileRoute } from '@/lib/link-resolver';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ q?: string; type?: string; tag?: string }>;
}

function match(file: IndexedFile, q: string): { score: number; excerpt: string } {
  const hay = `${file.title}\n${file.relPath}\n${file.body}`.toLowerCase();
  const needle = q.toLowerCase();
  const idx = hay.indexOf(needle);
  if (idx === -1) return { score: 0, excerpt: '' };

  // Very rough scoring: earlier matches and title hits score higher.
  const titleHit = file.title.toLowerCase().includes(needle) ? 20 : 0;
  const pathHit = file.relPath.toLowerCase().includes(needle) ? 10 : 0;
  const score = 100 - Math.min(idx, 100) + titleHit + pathHit;

  const bodyLower = file.body.toLowerCase();
  const bodyIdx = bodyLower.indexOf(needle);
  let excerpt = '';
  if (bodyIdx !== -1) {
    const start = Math.max(0, bodyIdx - 60);
    const end = Math.min(file.body.length, bodyIdx + needle.length + 100);
    excerpt =
      (start > 0 ? '…' : '') +
      file.body.slice(start, end).replace(/\s+/g, ' ').trim() +
      (end < file.body.length ? '…' : '');
  }
  return { score, excerpt };
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim();
  const type = (sp.type ?? '').trim();
  const tag = (sp.tag ?? '').trim();

  if (!aiosRootExists()) {
    return (
      <div className="rounded border border-orange/30 bg-orange/10 p-4 text-sm text-paper">
        AIOS_ROOT is not configured, so search has nothing to index.
      </div>
    );
  }

  const all = getIndex();

  const tagLower = tag.toLowerCase();
  const typeLower = type.toLowerCase();

  let filtered = all.filter((f) => {
    if (typeLower) {
      const t = typeof f.frontmatter.type === 'string' ? f.frontmatter.type.toLowerCase() : '';
      if (t !== typeLower) return false;
    }
    if (tagLower) {
      const tags = Array.isArray(f.frontmatter.tags)
        ? f.frontmatter.tags.map((x) => String(x).toLowerCase())
        : [];
      if (!tags.includes(tagLower)) return false;
    }
    return true;
  });

  let results: { file: IndexedFile; score: number; excerpt: string }[];
  if (q) {
    results = filtered
      .map((f) => ({ file: f, ...match(f, q) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 80);
  } else {
    results = filtered
      .slice(0, 80)
      .map((file) => ({ file, score: 0, excerpt: '' }));
  }

  // Facet data — top 12 of each, derived from the *filtered* set so users
  // can progressively narrow.
  const typeCounts = new Map<string, number>();
  const tagCounts = new Map<string, number>();
  for (const f of filtered) {
    if (typeof f.frontmatter.type === 'string') {
      typeCounts.set(
        f.frontmatter.type,
        (typeCounts.get(f.frontmatter.type) ?? 0) + 1
      );
    }
    if (Array.isArray(f.frontmatter.tags)) {
      for (const t of f.frontmatter.tags) {
        const key = String(t);
        tagCounts.set(key, (tagCounts.get(key) ?? 0) + 1);
      }
    }
  }
  const topTypes = Array.from(typeCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 12);
  const topTags = Array.from(tagCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 18);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <h1 className="font-heading text-3xl text-paper">Search</h1>
        <form className="flex flex-wrap items-center gap-2" action="/search">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search titles, paths, body text…"
            className="w-full min-w-[16rem] flex-1 rounded border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-sm text-paper placeholder:text-muted focus:border-orange/60 focus:outline-none"
          />
          {type && <input type="hidden" name="type" value={type} />}
          {tag && <input type="hidden" name="tag" value={tag} />}
          <button
            type="submit"
            className="rounded border border-white/15 bg-white/[0.03] px-3 py-2 font-mono text-xs uppercase tracking-wider text-paper hover:border-orange/60 hover:text-orange"
          >
            Search
          </button>
        </form>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {(type || tag || q) && (
            <Link
              href="/search"
              className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-muted hover:border-orange/60 hover:text-orange"
            >
              clear all
            </Link>
          )}
          {type && (
            <span className="rounded-full border border-blue/40 bg-blue/10 px-2 py-0.5 font-mono text-blue">
              type: {type}
            </span>
          )}
          {tag && (
            <span className="rounded-full border border-white/15 bg-white/[0.03] px-2 py-0.5 font-mono text-muted">
              #{tag}
            </span>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[14rem_1fr]">
        <aside className="flex flex-col gap-5">
          <div>
            <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted">
              Types
            </div>
            <ul className="flex flex-col gap-1">
              {topTypes.length === 0 && <li className="text-xs text-muted">—</li>}
              {topTypes.map(([t, c]) => {
                const qs = new URLSearchParams();
                if (q) qs.set('q', q);
                if (tag) qs.set('tag', tag);
                qs.set('type', t);
                return (
                  <li key={t}>
                    <Link
                      href={`/search?${qs.toString()}`}
                      className="flex items-center justify-between gap-2 font-mono text-xs text-muted hover:text-orange"
                    >
                      <span>{t}</span>
                      <span className="text-muted/60">{c}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted">
              Tags
            </div>
            <ul className="flex flex-col gap-1">
              {topTags.length === 0 && <li className="text-xs text-muted">—</li>}
              {topTags.map(([t, c]) => {
                const qs = new URLSearchParams();
                if (q) qs.set('q', q);
                if (type) qs.set('type', type);
                qs.set('tag', t);
                return (
                  <li key={t}>
                    <Link
                      href={`/search?${qs.toString()}`}
                      className="flex items-center justify-between gap-2 font-mono text-xs text-muted hover:text-orange"
                    >
                      <span>#{t}</span>
                      <span className="text-muted/60">{c}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        <div className="flex flex-col gap-3">
          <div className="font-mono text-[11px] uppercase tracking-wider text-muted">
            {q ? `${results.length} result${results.length === 1 ? '' : 's'}` : `${results.length} file${results.length === 1 ? '' : 's'}`}
          </div>
          {results.length === 0 ? (
            <div className="rounded border border-white/10 bg-white/[0.02] p-6 text-sm text-muted">
              No matches. Try a different query or clear filters.
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {results.map(({ file, excerpt }) => (
                <li key={file.absPath}>
                  <Link
                    href={fileRoute(file)}
                    prefetch={false}
                    className="block rounded border border-white/10 bg-white/[0.02] p-4 transition hover:border-orange/40"
                  >
                    <div className="mb-1 flex items-baseline justify-between gap-4">
                      <h3 className="font-heading text-paper">{file.title}</h3>
                      <span className="font-mono text-[11px] text-muted">{file.region}</span>
                    </div>
                    <div className="mb-2 truncate font-mono text-[11px] text-muted">
                      {file.relPath}
                    </div>
                    {excerpt && (
                      <p className="mb-2 line-clamp-3 font-body text-sm text-paper/80">
                        {excerpt}
                      </p>
                    )}
                    <FrontmatterChips frontmatter={file.frontmatter} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
