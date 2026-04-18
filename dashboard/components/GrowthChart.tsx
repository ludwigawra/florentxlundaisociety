import type { GrowthData } from '@/lib/growth-timeseries';

interface Props {
  data: GrowthData;
  height?: number;
}

/**
 * Pure SVG multi-line cumulative growth chart. No chart lib, no client JS —
 * renders at request time as part of the server component tree.
 *
 * Design choices:
 *  - Lines are drawn on a shared y-axis (shared max). This flattens smaller
 *    series visually but tells the right story: the bigger thing is bigger.
 *  - The last point of each series gets a filled dot + label so you can read
 *    the headline number without a legend hover.
 *  - X-axis shows first/middle/last day label only (minimalist; the story is
 *    the slope, not exact dates).
 */
export default function GrowthChart({ data, height = 200 }: Props) {
  const { labels, series } = data;
  const width = 1000; // SVG is viewBox-scaled; width fills container
  const pad = { top: 20, right: 110, bottom: 28, left: 12 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const max = Math.max(
    1,
    ...series.flatMap((s) => s.values),
  );

  const stepX = labels.length > 1 ? innerW / (labels.length - 1) : innerW;

  function y(v: number): number {
    return pad.top + innerH - (v / max) * innerH;
  }

  function x(i: number): number {
    return pad.left + i * stepX;
  }

  function buildPath(values: number[]): string {
    return values
      .map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(2)},${y(v).toFixed(2)}`)
      .join(' ');
  }

  if (labels.length === 0 || series.every((s) => s.values.every((v) => v === 0))) {
    return (
      <div className="flex h-[180px] items-center justify-center rounded border border-dashed border-white/10 text-sm text-muted">
        No measurable growth yet. Install, use, come back.
      </div>
    );
  }

  const xTickLabels = pickXTicks(labels, 4);

  return (
    <div className="relative">
      <svg
        role="img"
        aria-label="Brain growth over time"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
      >
        {/* gridline at zero */}
        <line
          x1={pad.left}
          x2={pad.left + innerW}
          y1={pad.top + innerH}
          y2={pad.top + innerH}
          stroke="rgba(176,174,165,0.15)"
          strokeWidth={1}
        />
        {/* midline — quarter, half, three-quarter ticks for reference */}
        {[0.25, 0.5, 0.75].map((frac) => (
          <line
            key={frac}
            x1={pad.left}
            x2={pad.left + innerW}
            y1={pad.top + innerH - frac * innerH}
            y2={pad.top + innerH - frac * innerH}
            stroke="rgba(176,174,165,0.05)"
            strokeWidth={1}
          />
        ))}

        {/* series */}
        {series.map((s) => {
          const last = s.values[s.values.length - 1] ?? 0;
          const lastX = x(s.values.length - 1);
          const lastY = y(last);
          return (
            <g key={s.name}>
              <path
                d={buildPath(s.values)}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={0.92}
              />
              <circle cx={lastX} cy={lastY} r={3.5} fill={s.color} />
              <text
                x={lastX + 6}
                y={lastY + 3.5}
                fontFamily="var(--font-mono), ui-monospace, monospace"
                fontSize={11}
                fill={s.color}
                opacity={0.95}
              >
                {last}{' '}
                <tspan fill="#b0aea5" opacity={0.85}>
                  {s.name}
                </tspan>
              </text>
            </g>
          );
        })}

        {/* x tick labels */}
        {xTickLabels.map(({ index, label }) => (
          <text
            key={label}
            x={x(index)}
            y={height - 8}
            fontFamily="var(--font-mono), ui-monospace, monospace"
            fontSize={10}
            fill="#b0aea5"
            opacity={0.7}
            textAnchor={index === 0 ? 'start' : index === labels.length - 1 ? 'end' : 'middle'}
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}

function pickXTicks(labels: string[], count: number): { index: number; label: string }[] {
  if (labels.length <= count) {
    return labels.map((label, index) => ({ index, label: shortLabel(label) }));
  }
  const step = (labels.length - 1) / (count - 1);
  const out: { index: number; label: string }[] = [];
  for (let i = 0; i < count; i++) {
    const index = Math.round(i * step);
    out.push({ index, label: shortLabel(labels[index]) });
  }
  return out;
}

function shortLabel(iso: string): string {
  // 2026-04-18 -> Apr 18
  const d = new Date(iso + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
