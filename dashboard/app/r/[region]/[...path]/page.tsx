import { notFound } from 'next/navigation';
import Link from 'next/link';
import MarkdownView from '@/components/MarkdownView';
import FrontmatterChips from '@/components/FrontmatterChips';
import FilePathBadge from '@/components/FilePathBadge';
import Backlinks from '@/components/Backlinks';
import { aiosRootExists } from '@/lib/paths';
import { findByRelPath } from '@/lib/fs-index';
import { getBacklinks } from '@/lib/link-resolver';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ region: string; path: string[] }>;
}

export default async function FileDetailPage({ params }: Props) {
  if (!aiosRootExists()) {
    return (
      <div className="rounded border border-orange/30 bg-orange/10 p-4 text-sm text-paper">
        AIOS_ROOT is not configured — no file to display.
      </div>
    );
  }

  const { region: regionRaw, path: pathRaw } = await params;
  const region = decodeURIComponent(regionRaw);
  const rel = [region, ...pathRaw.map(decodeURIComponent)].join('/');
  const file = findByRelPath(rel);
  if (!file) notFound();

  const backlinks = getBacklinks(file);

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Link
            href={`/r/${encodeURIComponent(region)}`}
            className="font-mono uppercase tracking-wider text-muted hover:text-orange"
          >
            {region}
          </Link>
          {file.regionPath.slice(0, -1).map((seg, i) => (
            <span key={i} className="font-mono text-muted">
              / {seg}
            </span>
          ))}
          <span className="font-mono text-muted">/ {file.fileName}</span>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="font-heading text-3xl text-paper">{file.title}</h1>
          <FilePathBadge absPath={file.absPath} />
        </div>

        <FrontmatterChips frontmatter={file.frontmatter} />

        {(file.frontmatter.created || file.frontmatter.updated) && (
          <div className="font-mono text-[11px] text-muted">
            {file.frontmatter.created && <>created {String(file.frontmatter.created)} · </>}
            {file.frontmatter.updated && <>updated {String(file.frontmatter.updated)}</>}
          </div>
        )}
      </header>

      <div className="rounded-card border border-white/10 bg-white/[0.02] p-6">
        {file.body.trim() ? (
          <MarkdownView markdown={file.body} />
        ) : (
          <div className="text-sm text-muted">This file has no body content.</div>
        )}
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg text-paper">Backlinks</h2>
        <Backlinks files={backlinks} />
      </section>
    </article>
  );
}
