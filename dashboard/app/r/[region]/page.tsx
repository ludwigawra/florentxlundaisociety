import { notFound } from 'next/navigation';
import FilePathBadge from '@/components/FilePathBadge';
import { aiosPath, aiosRootExists } from '@/lib/paths';
import { filesByRegion, topLevelRegions } from '@/lib/fs-index';
import { getRegion, getRegionManifest } from '@/lib/region-manifest';
import { getView } from '@/lib/view-registry';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ region: string }>;
}

export default async function RegionPage({ params }: Props) {
  const { region: regionRaw } = await params;
  const region = decodeURIComponent(regionRaw);

  if (!aiosRootExists()) {
    return (
      <div className="rounded border border-orange/30 bg-orange/10 p-4 text-sm text-paper">
        AIOS_ROOT is not configured, so region <code>{region}</code> cannot be loaded.
      </div>
    );
  }

  const manifest = getRegionManifest();
  const entry = getRegion(region);
  const existsOnDisk = topLevelRegions().includes(region);
  if (!entry && !existsOnDisk) notFound();

  const files = filesByRegion(region);
  const viewType = entry?.viewType ?? 'timeline';
  const ViewComponent = getView(viewType);
  const label = entry?.label ?? region;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-3xl text-paper">{label}</h1>
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
            {region}
          </span>
          {entry?.discovered && (
            <span className="rounded-full border border-orange/40 bg-orange/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-orange">
              discovered
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FilePathBadge absPath={aiosPath(region)} />
          <span className="font-mono text-xs text-muted">
            {files.length} file{files.length === 1 ? '' : 's'} · view: {viewType}
          </span>
        </div>
      </header>

      <ViewComponent files={files} region={region} />

      <footer className="pt-8 text-xs text-muted">
        <div className="font-mono">
          Other regions:{' '}
          {manifest
            .filter((r) => r.id !== region)
            .map((r) => r.id)
            .join(' · ')}
        </div>
      </footer>
    </div>
  );
}
