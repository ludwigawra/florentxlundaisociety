import Link from 'next/link';
import type { SkillCalibration } from '@/lib/skill-calibration';

interface Props {
  skills: SkillCalibration[];
}

const STATUS_COLOR: Record<SkillCalibration['status'], string> = {
  learning: '#d97757', // orange — actively adjusting
  calibrated: '#6a9bcc', // blue — reliable
  graduated: '#788c5d', // green — autonomous
  unknown: '#b0aea5', // muted
};

const STATUS_DESC: Record<SkillCalibration['status'], string> = {
  learning: 'Adjusting from recent feedback',
  calibrated: 'Stable — feedback loop quiet',
  graduated: 'Autonomous — edits its own SKILL.md',
  unknown: 'No calibration data yet',
};

export default function SkillCalibrationGrid({ skills }: Props) {
  if (skills.length === 0) {
    return (
      <div className="text-sm text-muted">
        No skill feedback yet. Use a skill, give Claude feedback on its output
        (&ldquo;good&rdquo;, &ldquo;not like that&rdquo;, redirect it) — the system logs it and
        starts calibrating. After three pending entries, the skill rewrites itself.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {skills.map((s) => {
        const color = STATUS_COLOR[s.status];
        return (
          <Link
            key={s.skill}
            href={`/r/${encodeURIComponent(s.file)}`}
            prefetch={false}
            className="group flex flex-col gap-2 rounded border border-white/10 bg-white/[0.02] p-3 transition-colors hover:border-white/25"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="truncate font-heading text-sm text-paper group-hover:text-orange">
                {s.skill}
              </div>
              <span
                title={STATUS_DESC[s.status]}
                className="shrink-0 font-mono text-[10px] uppercase tracking-wider"
                style={{ color }}
              >
                {s.status}
              </span>
            </div>
            <div className="flex items-baseline justify-between font-mono text-[11px] text-muted">
              <span>
                uses · {s.usageCount ?? '—'}
              </span>
              <span>approval · {s.approvalRate ?? '—'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: color,
                    width: `${Math.min(100, s.feedbackEntries * 20)}%`,
                  }}
                />
              </div>
              <span className="font-mono text-[10px] text-muted/80">
                {s.feedbackEntries} fb
              </span>
            </div>
            {s.lastImproved && (
              <div className="font-mono text-[10px] text-muted/70">
                improved · {s.lastImproved}
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
