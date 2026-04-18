import Link from 'next/link';
import FrontmatterChips from './FrontmatterChips';
import { fileRoute } from '@/lib/link-resolver';
import type { ViewProps } from '@/lib/view-registry';

function pickDate(f: ViewProps['files'][number]): number {
  const fm = f.frontmatter;
  const updated = typeof fm.updated === 'string' ? Date.parse(fm.updated) : NaN;
  if (!Number.isNaN(updated)) return updated;
  const created = typeof fm.created === 'string' ? Date.parse(fm.created) : NaN;
  if (!Number.isNaN(created)) return created;
  return f.mtimeMs;
}

function fmt(ms: number): string {
  try {
    return new Date(ms).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

export default function TimelineView({ files }: ViewProps) {
  const sorted = [...files].sort((a, b) => pickDate(b) - pickDate(a));

  if (sorted.length === 0) {
    return (
      <div className="rounded border border-white/10 bg-white/[0.02] p-6 text-sm text-muted">
        No files in this region yet.
      </div>
    );
  }

  return (
    <ol className="relative ml-3 space-y-4 border-l border-white/10 pl-6">
      {sorted.map((f) => (
        <li key={f.absPath} className="relative">
          <span
            aria-hidden="true"
            className="absolute -left-[30px] top-2 h-2 w-2 rounded-full bg-orange"
          />
          <Link
            href={fileRoute(f)}
            prefetch={false}
            className="group block rounded border border-white/5 bg-white/[0.02] p-4 transition hover:border-orange/40"
          >
            <div className="mb-1 flex items-baseline justify-between gap-4">
              <h3 className="font-heading text-paper group-hover:text-orange">
                {f.title}
              </h3>
              <time className="font-mono text-xs text-muted">{fmt(pickDate(f))}</time>
            </div>
            <div className="truncate font-mono text-[11px] text-muted">{f.relPath}</div>
            <div className="mt-2">
              <FrontmatterChips frontmatter={f.frontmatter} />
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
}
