import Link from 'next/link';
import type { BehavioralPattern } from '@/lib/behavioral-patterns';

interface Props {
  patterns: BehavioralPattern[];
  limit?: number;
}

const CATEGORY_COLOR: Record<BehavioralPattern['category'], string> = {
  voice: '#d97757',
  'skill-usage': '#6a9bcc',
  timing: '#788c5d',
  relationships: '#b0aea5',
  'tool-preferences': '#6a9bcc',
  goals: '#d97757',
  unknown: '#b0aea5',
};

const CONFIDENCE_INDICATOR: Record<BehavioralPattern['confidence'], string> = {
  high: '●●●',
  medium: '●●○',
  low: '●○○',
  unknown: '○○○',
};

export default function BehavioralPatternsPanel({ patterns, limit = 5 }: Props) {
  if (patterns.length === 0) {
    return (
      <div className="flex flex-col gap-2 text-sm text-muted">
        <div>
          No behavioral inferences yet. Run{' '}
          <code className="font-mono">/behavioral-learning</code> after you&apos;ve used
          the brain for a few sessions — it reads transcripts + autonomous-run outcomes
          and infers patterns like <em>&ldquo;removes exclamation marks from drafts&rdquo;</em>
          , <em>&ldquo;abandons /foresight under deadline pressure&rdquo;</em>,{' '}
          <em>&ldquo;reflects on Sundays, not Mondays&rdquo;</em>.
        </div>
        <div className="text-xs text-muted/80">
          You don&apos;t write these. The brain infers them. That&apos;s the moat.
        </div>
      </div>
    );
  }

  const shown = patterns.slice(0, limit);

  return (
    <div className="flex flex-col gap-3">
      {shown.map((p) => {
        const color = CATEGORY_COLOR[p.category];
        return (
          <div
            key={p.id}
            className="flex flex-col gap-1.5 rounded border border-white/10 bg-white/[0.02] p-3"
          >
            <div className="flex items-center gap-2">
              <span
                className="font-mono text-[10px] uppercase tracking-wider"
                style={{ color }}
              >
                {p.category}
              </span>
              <span
                className="font-mono text-[10px] text-muted"
                title={`${p.confidence} confidence · ${p.observations} observations`}
              >
                {CONFIDENCE_INDICATOR[p.confidence]}
              </span>
              <span className="ml-auto font-mono text-[10px] text-muted/70">
                {p.observations} obs
              </span>
            </div>
            <div className="text-sm text-paper">{p.patternText || p.id}</div>
            {p.inferenceText && (
              <div className="border-l-2 border-orange/40 pl-2 text-xs text-muted">
                → {p.inferenceText}
              </div>
            )}
          </div>
        );
      })}
      {patterns.length > limit && (
        <Link
          href="/r/CEREBELLUM/behavioral-patterns.md"
          className="mt-1 font-mono text-[11px] uppercase tracking-wider text-blue hover:text-orange"
          prefetch={false}
        >
          {patterns.length - limit} more →
        </Link>
      )}
    </div>
  );
}
