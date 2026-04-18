import fs from 'node:fs';
import Link from 'next/link';
import Panel from '@/components/Panel';
import VitalSignsPanel from '@/components/VitalSignsPanel';
import ActivityHeatmap from '@/components/ActivityHeatmap';
import MarkdownView from '@/components/MarkdownView';
import GrowthChart from '@/components/GrowthChart';
import ConsolidationPanel from '@/components/ConsolidationPanel';
import SkillCalibrationGrid from '@/components/SkillCalibrationGrid';
import AutonomousRunsPanel from '@/components/AutonomousRunsPanel';
import PendingReviewPanel from '@/components/PendingReviewPanel';
import SourceHealthPanel from '@/components/SourceHealthPanel';
import BehavioralPatternsPanel from '@/components/BehavioralPatternsPanel';
import { aiosPath, aiosRootExists, AIOS_ROOT } from '@/lib/paths';
import { getMemorySection } from '@/lib/memory-parser';
import { buildGrowthData } from '@/lib/growth-timeseries';
import { loadLatestConsolidation } from '@/lib/consolidation';
import { loadSkillCalibrations } from '@/lib/skill-calibration';
import {
  loadAutonomousRuns,
  pendingReviewRuns,
} from '@/lib/autonomous-runs';
import { loadSourceHealth } from '@/lib/source-health';
import { loadBehavioralPatterns } from '@/lib/behavioral-patterns';

export const dynamic = 'force-dynamic';

interface Headline {
  label: string;
  value: string;
  sub: string;
  href: string;
  color: string;
}

function computeHeadlines(): Headline[] {
  const decisions = countFiles('HIPPOCAMPUS/decisions');
  const patterns = countPatternEntries();
  const transcripts = countFiles('HIPPOCAMPUS/short-term/transcripts', { includeAll: true });
  const skillFeedback = countFiles('CEREBELLUM/skill-feedback', {
    excludeReadme: true,
  });
  const people = countFiles('SENSORY-CORTEX/people', { excludeReadme: true });
  const companies = countFiles('SENSORY-CORTEX/companies', { excludeReadme: true });

  return [
    {
      label: 'Decisions captured',
      value: String(decisions),
      sub: 'Episodic memory — what you chose, why, what you learned',
      href: '/r/HIPPOCAMPUS',
      color: '#6a9bcc',
    },
    {
      label: 'Patterns learned',
      value: String(patterns),
      sub: 'Extracted from corrections + behavior — not written by you',
      href: '/r/CEREBELLUM/patterns.md',
      color: '#d97757',
    },
    {
      label: 'Sessions in memory',
      value: String(transcripts),
      sub: 'Archived by the SessionEnd hook — raw behavior is inspectable',
      href: '/r/HIPPOCAMPUS/short-term',
      color: '#b0aea5',
    },
    {
      label: 'Skills calibrating',
      value: String(skillFeedback),
      sub: 'Each skill improves itself from your reactions',
      href: '/r/CEREBELLUM/skill-feedback',
      color: '#788c5d',
    },
    {
      label: 'World known',
      value: String(people + companies),
      sub: `${people} people · ${companies} companies — context every automation needs`,
      href: '/r/SENSORY-CORTEX',
      color: '#6a9bcc',
    },
  ];
}

interface CountOpts {
  excludeReadme?: boolean;
  includeAll?: boolean;
}

function countFiles(rel: string, opts: CountOpts = {}): number {
  try {
    const names = fs.readdirSync(aiosPath(rel));
    return names.filter((n) => {
      if (opts.excludeReadme && n === 'README.md') return false;
      if (!opts.includeAll && !n.endsWith('.md')) return false;
      return true;
    }).length;
  } catch {
    return 0;
  }
}

function countPatternEntries(): number {
  try {
    const raw = fs.readFileSync(aiosPath('CEREBELLUM/patterns.md'), 'utf8');
    return (raw.match(/^###\s+/gm) ?? []).length;
  } catch {
    return 0;
  }
}

export default function Home() {
  const rootOk = aiosRootExists();
  const headlines = rootOk ? computeHeadlines() : [];
  const growth = rootOk ? buildGrowthData(30) : null;
  const consolidation = rootOk ? loadLatestConsolidation() : null;
  const skills = rootOk ? loadSkillCalibrations() : [];
  const runs = rootOk ? loadAutonomousRuns(100) : [];
  const pending = pendingReviewRuns(runs);
  const sources = rootOk ? loadSourceHealth() : [];
  const patterns = rootOk ? loadBehavioralPatterns() : [];
  const active = rootOk ? getMemorySection('Active Context') : undefined;

  return (
    <div className="flex flex-col gap-8">
      {/* HERO HEADER */}
      <header className="flex flex-col gap-3 border-b border-white/10 pb-6">
        <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted">
          Your brain, compounding
        </div>
        <h1 className="font-heading text-4xl leading-tight text-paper md:text-5xl">
          One assistant.{' '}
          <span className="text-orange">Every workflow.</span>
          <br />
          Learns you by watching — acts like you by night.
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted md:text-base">
          Not a chatbot with memory bolted on. A file-system-native brain that
          Claude reads in every session, <span className="text-paper">learns from your behavior</span> in
          every interaction, and{' '}
          <span className="text-paper">ships drafts while you sleep</span> — so the next
          session starts smarter, and the next morning starts lighter, than the last.
        </p>
        {!rootOk && (
          <div className="mt-2 rounded border border-orange/30 bg-orange/10 p-3 text-sm text-paper">
            <div className="mb-1 font-heading text-orange">No brain found</div>
            Expected{' '}
            <span className="mx-1 rounded bg-white/[0.06] px-1 py-0.5 font-mono">
              {AIOS_ROOT}
            </span>{' '}
            — set <code className="font-mono">AIOS_ROOT</code> and restart.
          </div>
        )}
      </header>

      {/* HEADLINE STATS */}
      {rootOk && (
        <section className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {headlines.map((h) => (
            <Link
              key={h.label}
              href={h.href}
              prefetch={false}
              className="group flex flex-col gap-1 rounded-card border border-white/10 bg-white/[0.02] p-4 transition-colors hover:border-white/25"
            >
              <div
                className="font-heading text-3xl md:text-4xl"
                style={{ color: h.color }}
              >
                {h.value}
              </div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-paper group-hover:text-orange">
                {h.label}
              </div>
              <div className="text-[11px] leading-snug text-muted/80">{h.sub}</div>
            </Link>
          ))}
        </section>
      )}

      {/* PENDING REVIEW — the "it actually acts" moment */}
      {rootOk && pending.length > 0 && (
        <Panel
          title="Pending your review"
          source="BASAL-GANGLIA/autonomous-runs.jsonl"
        >
          <PendingReviewPanel runs={pending} />
        </Panel>
      )}

      {/* HERO CHART — THE COMPOUNDING SHOT */}
      {rootOk && growth && (
        <section className="rounded-card border border-white/10 bg-white/[0.02] p-5">
          <header className="mb-4 flex items-baseline justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <h2 className="font-heading text-lg text-paper">Brain growth · 30 days</h2>
              <div className="text-xs text-muted">
                Every line is your brain accumulating — decisions logged, world learned,
                sessions archived, patterns extracted. Slopes are the moat.
              </div>
            </div>
            <div className="hidden font-mono text-[10px] uppercase tracking-wider text-muted/70 md:block">
              file system snapshot
            </div>
          </header>
          <GrowthChart data={growth} height={220} />
        </section>
      )}

      {/* BEHAVIORAL LEARNING — the "it learns how you work" moment */}
      {rootOk && (
        <section className="rounded-card border border-white/10 bg-white/[0.02] p-5">
          <header className="mb-4 flex items-baseline justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <h2 className="font-heading text-lg text-paper">
                What the brain has inferred about how you work
              </h2>
              <div className="text-xs text-muted">
                You never wrote these. The brain watched your transcripts, your
                approvals, your timing — and figured it out.
              </div>
            </div>
            <Link
              href="/r/CEREBELLUM/behavioral-patterns.md"
              className="font-mono text-[11px] uppercase tracking-wider text-muted hover:text-orange"
            >
              all patterns →
            </Link>
          </header>
          <BehavioralPatternsPanel patterns={patterns} limit={5} />
        </section>
      )}

      {/* TWO-PANEL: LAST NIGHT + AUTONOMOUS RUNS */}
      {rootOk && (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel
            title="What the brain did last night"
            source={consolidation?.path ?? 'HIPPOCAMPUS/short-term/consolidation-report-*.md'}
          >
            <ConsolidationPanel report={consolidation} />
          </Panel>

          <Panel
            title="Autonomous runs · last 7 days"
            source="BASAL-GANGLIA/autonomous-runs.jsonl"
          >
            <AutonomousRunsPanel runs={runs} maxDays={7} />
          </Panel>
        </section>
      )}

      {/* CONNECTED SOURCES + VITAL SIGNS */}
      {rootOk && (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel
            title="Connected sources"
            source="cross-region activity signals"
          >
            <SourceHealthPanel sources={sources} />
          </Panel>
          <Panel title="Vital signs" source="META-COGNITION/vital-signs.md">
            <VitalSignsPanel />
          </Panel>
        </section>
      )}

      {/* SKILLS CALIBRATING */}
      {rootOk && (
        <section className="rounded-card border border-white/10 bg-white/[0.02] p-5">
          <header className="mb-4 flex items-baseline justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <h2 className="font-heading text-lg text-paper">Skills calibrating</h2>
              <div className="text-xs text-muted">
                Each skill logs your feedback. After three pending signals, the nightly
                consolidation edits the skill itself. No one else ships this loop.
              </div>
            </div>
            <Link
              href="/r/CEREBELLUM/skill-feedback"
              className="font-mono text-[11px] uppercase tracking-wider text-muted hover:text-orange"
            >
              all feedback →
            </Link>
          </header>
          <SkillCalibrationGrid skills={skills} />
        </section>
      )}

      {/* ACTIVE CONTEXT + ACTIVITY */}
      {rootOk && (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel
            title="Active Context"
            source="MEMORY.md · ## Active Context"
            actions={
              <Link
                href="/memory#active-context"
                className="font-mono text-[11px] uppercase tracking-wider text-muted hover:text-orange"
              >
                open
              </Link>
            }
          >
            {active?.body ? (
              <div className="max-h-[22rem] overflow-auto pr-1 text-sm">
                <MarkdownView markdown={active.body} />
              </div>
            ) : (
              <div className="text-sm text-muted">
                No <code className="font-mono">## Active Context</code> section in MEMORY.md yet.
              </div>
            )}
          </Panel>

          <Panel title="Brain activity" source="git log --since=30.days">
            <ActivityHeatmap />
          </Panel>
        </section>
      )}
    </div>
  );
}
