import Link from 'next/link';
import FrontmatterChips from './FrontmatterChips';
import { fileRoute } from '@/lib/link-resolver';
import type { ViewProps } from '@/lib/view-registry';

function excerpt(body: string, max = 160): string {
  const cleaned = body
    .replace(/\r?\n+/g, ' ')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, t, l) => l ?? t)
    .replace(/[#*`>_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length > max ? cleaned.slice(0, max - 1).trimEnd() + '…' : cleaned;
}

export default function GridView({ files }: ViewProps) {
  if (files.length === 0) {
    return (
      <div className="rounded border border-white/10 bg-white/[0.02] p-6 text-sm text-muted">
        No files in this region yet.
      </div>
    );
  }

  const sorted = [...files].sort((a, b) => b.mtimeMs - a.mtimeMs);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((f) => (
        <Link
          key={f.absPath}
          href={fileRoute(f)}
          prefetch={false}
          className="group flex h-full flex-col gap-2 rounded border border-white/10 bg-white/[0.02] p-4 transition hover:border-orange/40"
        >
          <h3 className="font-heading text-paper group-hover:text-orange">{f.title}</h3>
          <div className="truncate font-mono text-[11px] text-muted">{f.relPath}</div>
          {f.body.trim().length > 0 && (
            <p className="font-body text-sm text-paper/80">{excerpt(f.body)}</p>
          )}
          <div className="mt-auto pt-2">
            <FrontmatterChips frontmatter={f.frontmatter} />
          </div>
        </Link>
      ))}
    </div>
  );
}
