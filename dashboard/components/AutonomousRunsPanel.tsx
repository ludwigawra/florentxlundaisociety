import Link from 'next/link';
import type { AutonomousRun } from '@/lib/autonomous-runs';
import { groupByDay } from '@/lib/autonomous-runs';

interface Props {
  runs: AutonomousRun[];
  maxDays?: number;
}

const STATUS_COLOR: Record<AutonomousRun['status'], string> = {
  completed: '#788c5d', // green
  'pending-review': '#d97757', // orange — needs you
  failed: '#d04a3b', // red
  partial: '#b0aea5', // muted
};

export default function AutonomousRunsPanel({ runs, maxDays = 7 }: Props) {
  if (runs.length === 0) {
    return (
      <div className="text-sm text-muted">
        No autonomous runs logged yet. Install the scheduler (
        <code className="font-mono">plugin/scripts/schedule.sh</code>) to let skills fire
        on cron. Every run appends to{' '}
        <code className="font-mono">BASAL-GANGLIA/autonomous-runs.jsonl</code>.
      </div>
    );
  }

  const days = groupByDay(runs).slice(0, maxDays);

  return (
    <div className="flex flex-col gap-3">
      {days.map(({ day, runs }) => (
        <div key={day} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-wider text-muted/70">
            <span>{formatDay(day)}</span>
            <span>
              {runs.length} run{runs.length === 1 ? '' : 's'}
            </span>
          </div>
          <ul className="flex flex-col gap-1">
            {runs.map((r, i) => {
              const color = STATUS_COLOR[r.status];
              const time = formatTime(r.ts);
              return (
                <li
                  key={`${r.ts}-${i}`}
                  className="flex items-center gap-2 rounded border border-white/5 bg-white/[0.02] px-2.5 py-1.5 text-xs"
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                    title={r.status}
                  />
                  <span className="shrink-0 font-mono text-[10px] text-muted">
                    {time}
                  </span>
                  <span className="truncate font-mono text-[11px] text-paper">
                    {r.skill}
                  </span>
                  <span className="hidden shrink-0 font-mono text-[10px] text-muted/70 sm:inline">
                    {r.mode}
                  </span>
                  <span className="ml-auto shrink-0 font-mono text-[10px] text-muted">
                    {r.outputs} out
                  </span>
                  {r.artifact && (
                    <Link
                      href={`/r/${encodeURIComponent(r.artifact.split(',')[0])}`}
                      prefetch={false}
                      className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-blue hover:text-orange"
                    >
                      open
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function formatDay(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) return iso;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
