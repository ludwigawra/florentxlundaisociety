import Link from 'next/link';
import type { AutonomousRun } from '@/lib/autonomous-runs';

interface Props {
  runs: AutonomousRun[];
}

export default function PendingReviewPanel({ runs }: Props) {
  if (runs.length === 0) {
    return (
      <div className="text-sm text-muted">
        Nothing pending your review. The brain will queue drafts and outputs here the next
        time an autonomous skill fires. Install the scheduler to fire them nightly.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <div className="font-mono text-[11px] uppercase tracking-wider text-orange">
          {runs.length} item{runs.length === 1 ? '' : 's'} waiting
        </div>
        <div className="font-mono text-[10px] text-muted/70">the brain worked — you decide</div>
      </div>

      <ul className="flex flex-col gap-2">
        {runs.map((r, i) => {
          const artifact = r.artifact?.split(',')[0];
          return (
            <li
              key={`${r.ts}-${i}`}
              className="flex flex-col gap-1 rounded border border-orange/30 bg-orange/[0.06] p-3"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-orange">
                  {r.skill}
                </span>
                <span className="font-mono text-[10px] text-muted">· {r.mode}</span>
                <span className="ml-auto font-mono text-[10px] text-muted/80">
                  {formatWhen(r.ts)}
                </span>
              </div>
              <div className="text-sm text-paper">
                {r.outputs} output{r.outputs === 1 ? '' : 's'}
                {r.goal && <span className="text-muted"> · {r.goal}</span>}
                {r.note && <span className="text-muted"> · {r.note}</span>}
              </div>
              {artifact && (
                <Link
                  href={`/r/${encodeURIComponent(artifact)}`}
                  prefetch={false}
                  className="font-mono text-[11px] uppercase tracking-wider text-blue hover:text-orange"
                >
                  review →
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
