import Link from 'next/link';
import type { ConsolidationReport } from '@/lib/consolidation';

interface Props {
  report: ConsolidationReport | null;
}

export default function ConsolidationPanel({ report }: Props) {
  if (!report) {
    return (
      <div className="flex flex-col gap-2 text-sm">
        <div className="text-muted">
          No consolidation report yet. Run <code className="font-mono">/nightly-brain-consolidation</code>{' '}
          to create the first one — it processes short-term memory, extracts patterns, and
          routes feedback to the skills.
        </div>
      </div>
    );
  }

  const stats: { label: string; value: number; color: string }[] = [
    { label: 'files processed', value: report.filesDeleted, color: '#b0aea5' },
    { label: 'decisions routed', value: report.decisionsRouted, color: '#6a9bcc' },
    { label: 'sensory updates', value: report.sensoryRouted, color: '#788c5d' },
    { label: 'skill feedback', value: report.skillFeedbackRouted, color: '#d97757' },
    { label: 'corrections', value: report.correctionsLogged, color: '#d97757' },
    { label: 'MEMORY.md writes', value: report.memoryPromoted, color: '#6a9bcc' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <div className="font-mono text-[11px] uppercase tracking-wider text-muted">
          last run · {report.date}
        </div>
        <Link
          href={`/r/${encodeURIComponent(report.path)}`}
          className="font-mono text-[11px] uppercase tracking-wider text-blue hover:text-orange"
          prefetch={false}
        >
          full report →
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col gap-0.5">
            <div
              className="font-heading text-2xl"
              style={{ color: s.value > 0 ? s.color : 'rgba(176,174,165,0.55)' }}
            >
              {s.value}
            </div>
            <div className="text-[11px] leading-tight text-muted">{s.label}</div>
          </div>
        ))}
      </div>

      {report.dreamFile && (
        <div className="rounded border border-white/10 bg-white/[0.02] p-3 text-xs text-muted">
          <span className="font-mono text-[10px] uppercase tracking-wider text-orange">
            dream
          </span>{' '}
          ·{' '}
          <Link
            href={`/r/HIPPOCAMPUS/short-term/${encodeURIComponent(report.dreamFile)}`}
            className="text-paper hover:text-orange"
            prefetch={false}
          >
            {report.dreamFile}
          </Link>
          <div className="mt-1 text-muted/80">
            goal-by-goal reflection from tonight&apos;s run
          </div>
        </div>
      )}
    </div>
  );
}
