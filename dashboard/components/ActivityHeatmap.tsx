import { getGitActivity } from '@/lib/git-activity';

const REGION_COLORS: Record<string, string> = {
  HIPPOCAMPUS: '#6a9bcc',
  CEREBELLUM: '#d97757',
  'SENSORY-CORTEX': '#788c5d',
  'MOTOR-CORTEX': '#d1b16a',
  'META-COGNITION': '#b08fcf',
  BROCA: '#e0b98a',
  'BASAL-GANGLIA': '#7fb0a8'
};

const DEFAULT_COLOR = '#b0aea5';
const MAX_BAR_HEIGHT = 48; // px
const BAR_WIDTH = 8;
const BAR_GAP = 3;

function colorFor(region: string): string {
  return REGION_COLORS[region] ?? DEFAULT_COLOR;
}

export default function ActivityHeatmap() {
  const { days, totalCommits, regionsSeen, available, error } = getGitActivity({ days: 30 });
  const maxPerDay = Math.max(1, ...days.map((d) => d.total));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-[3px] overflow-hidden">
        {days.map((day) => {
          const parts = Object.entries(day.byRegion).sort(([a], [b]) =>
            a.localeCompare(b)
          );
          const heightRatio = day.total / maxPerDay;
          const barHeight = Math.max(2, Math.round(MAX_BAR_HEIGHT * heightRatio));
          return (
            <div
              key={day.date}
              title={`${day.date} — ${day.total} commit${day.total === 1 ? '' : 's'}`}
              className="flex flex-col justify-end"
              style={{ width: BAR_WIDTH, marginRight: BAR_GAP, height: MAX_BAR_HEIGHT }}
            >
              {parts.length === 0 ? (
                <div
                  className="rounded-sm bg-white/[0.04]"
                  style={{ height: 2 }}
                  aria-hidden="true"
                />
              ) : (
                <div
                  className="flex flex-col rounded-sm overflow-hidden"
                  style={{ height: barHeight }}
                >
                  {parts.map(([region, count]) => {
                    const ratio = count / day.total;
                    return (
                      <div
                        key={region}
                        style={{
                          height: `${ratio * 100}%`,
                          backgroundColor: colorFor(region)
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
        <span className="font-mono">
          {available
            ? `${totalCommits} commit${totalCommits === 1 ? '' : 's'} · last 30 days`
            : error ?? 'Git history unavailable'}
        </span>
        {regionsSeen.slice(0, 8).map((r) => (
          <span key={r} className="inline-flex items-center gap-1">
            <span
              className="inline-block h-2 w-2 rounded-sm"
              style={{ backgroundColor: colorFor(r) }}
              aria-hidden="true"
            />
            <span className="font-mono text-[11px]">{r}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
