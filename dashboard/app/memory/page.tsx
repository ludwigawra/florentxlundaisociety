import Link from 'next/link';
import MarkdownView from '@/components/MarkdownView';
import FilePathBadge from '@/components/FilePathBadge';
import { aiosPath, aiosRootExists } from '@/lib/paths';
import { readMemoryMd } from '@/lib/memory-parser';

export const dynamic = 'force-dynamic';

export default function MemoryPage() {
  const rootOk = aiosRootExists();
  const { sections, raw } = readMemoryMd();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-heading text-3xl text-paper">Memory</h1>
          {rootOk && <FilePathBadge absPath={aiosPath('MEMORY.md')} />}
        </div>
        <p className="max-w-2xl text-sm text-muted">
          Consolidated long-term memory. Split by <code className="font-mono">##</code>{' '}
          headers straight from <code className="font-mono">MEMORY.md</code>.
        </p>
      </header>

      {!rootOk || raw === '' ? (
        <div className="rounded border border-orange/30 bg-orange/10 p-4 text-sm text-paper">
          <div className="mb-1 font-heading text-orange">No MEMORY.md found</div>
          Expected <code className="font-mono">MEMORY.md</code> at the root of your AI-OS
          folder.
        </div>
      ) : (
        <>
          <nav className="flex flex-wrap gap-2">
            {sections.map((s) => (
              <a
                key={s.slug}
                href={`#${s.slug}`}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-muted hover:border-orange/60 hover:text-orange"
              >
                {s.section}
              </a>
            ))}
          </nav>

          <div className="flex flex-col gap-6">
            {sections.map((s) => (
              <section
                key={s.slug}
                id={s.slug}
                className="rounded-card border border-white/10 bg-white/[0.02] p-5"
              >
                <header className="mb-2 flex items-center justify-between">
                  <h2 className="font-heading text-xl text-paper">{s.section}</h2>
                  <Link
                    href={`#${s.slug}`}
                    className="font-mono text-[11px] uppercase tracking-wider text-muted hover:text-orange"
                  >
                    #
                  </Link>
                </header>
                <div className="text-sm">
                  <MarkdownView markdown={s.body || '_Empty section._'} />
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
