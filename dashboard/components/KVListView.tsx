import Link from 'next/link';
import FrontmatterChips from './FrontmatterChips';
import { fileRoute } from '@/lib/link-resolver';
import type { ViewProps } from '@/lib/view-registry';

function firstSentence(body: string): string {
  const plain = body
    .replace(/^---[\s\S]*?---\n?/m, '')
    .replace(/\r?\n+/g, ' ')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, t, l) => l ?? t)
    .replace(/[#*`>_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const m = plain.match(/^(.{0,180}?[.!?])(\s|$)/);
  return m ? m[1] : plain.slice(0, 160);
}

export default function KVListView({ files }: ViewProps) {
  if (files.length === 0) {
    return (
      <div className="rounded border border-white/10 bg-white/[0.02] p-6 text-sm text-muted">
        No files in this region yet.
      </div>
    );
  }

  const sorted = [...files].sort((a, b) => a.relPath.localeCompare(b.relPath));

  return (
    <ul className="divide-y divide-white/5 rounded border border-white/10 bg-white/[0.02]">
      {sorted.map((f) => (
        <li key={f.absPath} className="grid grid-cols-1 gap-2 px-4 py-3 md:grid-cols-[14rem_1fr]">
          <Link
            href={fileRoute(f)}
            prefetch={false}
            className="font-heading text-paper hover:text-orange"
          >
            {f.title}
            <div className="truncate font-mono text-[11px] text-muted">{f.relPath}</div>
          </Link>
          <div className="flex flex-col gap-2">
            {f.body.trim() && (
              <p className="font-body text-sm text-paper/80">{firstSentence(f.body)}</p>
            )}
            <FrontmatterChips frontmatter={f.frontmatter} />
          </div>
        </li>
      ))}
    </ul>
  );
}
