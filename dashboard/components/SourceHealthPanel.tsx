import type { SourceHealth } from '@/lib/source-health';

interface Props {
  sources: SourceHealth[];
}

const STATUS_COLOR: Record<SourceHealth['status'], string> = {
  connected: '#788c5d',
  configured: '#6a9bcc',
  'recently-failed': '#d97757',
  unknown: 'rgba(176,174,165,0.5)',
};

const STATUS_LABEL: Record<SourceHealth['status'], string> = {
  connected: 'live',
  configured: 'set up',
  'recently-failed': 'error',
  unknown: 'idle',
};

export default function SourceHealthPanel({ sources }: Props) {
  const active = sources.filter(
    (s) => s.status === 'connected' || s.status === 'configured',
  ).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <div className="font-mono text-[11px] uppercase tracking-wider text-muted">
          {active} of {sources.length} sources wired
        </div>
        <div className="font-mono text-[10px] text-muted/70">
          every connection widens context
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {sources.map((s) => {
          const color = STATUS_COLOR[s.status];
          return (
            <li
              key={s.id}
              className="flex flex-col gap-0.5 rounded border border-white/10 bg-white/[0.02] px-2.5 py-2"
              title={s.note ? `${STATUS_LABEL[s.status]} · ${s.note}` : STATUS_LABEL[s.status]}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="truncate font-mono text-[11px] text-paper">
                  {s.label}
                </span>
              </div>
              <div className="font-mono text-[10px] text-muted/80">{s.lastSignalText}</div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
