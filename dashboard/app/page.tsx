import fs from 'node:fs';
import Link from 'next/link';
import Panel from '@/components/Panel';
import VitalSignsPanel from '@/components/VitalSignsPanel';
import ActivityHeatmap from '@/components/ActivityHeatmap';
import MarkdownView from '@/components/MarkdownView';
import { aiosPath, aiosRootExists, AIOS_ROOT } from '@/lib/paths';
import { getMemorySection } from '@/lib/memory-parser';

export const dynamic = 'force-dynamic';

function countPatterns(): { count: number; source: string; available: boolean } {
  const source = 'CEREBELLUM/patterns.md';
  try {
    const raw = fs.readFileSync(aiosPath(source), 'utf8');
    const count = (raw.match(/^###\s+/gm) ?? []).length;
    return { count, source, available: true };
  } catch {
    return { count: 0, source, available: false };
  }
}

function countDecisionsByWeek(): {
  total: number;
  weeks: { week: string; count: number }[];
  source: string;
} {
  const source = 'HIPPOCAMPUS/decisions/';
  const weeks = new Map<string, number>();
  let total = 0;
  try {
    const dir = aiosPath(source);
    const names = fs.readdirSync(dir);
    for (const name of names) {
      if (!name.endsWith('.md')) continue;
      const st = fs.statSync(`${dir}/${name}`);
      const d = new Date(st.mtimeMs);
      // ISO week key (yyyy-Www) — good enough for a trend line
      const weekKey = isoWeek(d);
      weeks.set(weekKey, (weeks.get(weekKey) ?? 0) + 1);
      total++;
    }
  } catch {
    return { total: 0, weeks: [], source };
  }
  const sorted = Array.from(weeks.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([week, count]) => ({ week, count }));
  return { total, weeks: sorted, source };
}

function countShortTermByDay(): {
  total: number;
  days: { date: string; count: number }[];
  source: string;
} {
  const source = 'HIPPOCAMPUS/short-term/';
  try {
    const dir = aiosPath(source);
    const names = fs.readdirSync(dir).filter((n) => {
      if (!n.endsWith('.md')) return false;
      if (n === 'README.md') return false;
      if (n.startsWith('consolidation-report-')) return false;
      if (n.startsWith('dream-')) return false;
      return true;
    });
    const now = Date.now();
    const windowMs = 30 * 24 * 60 * 60 * 1000;
    const buckets = new Map<string, number>();
    let total = 0;
    for (const n of names) {
      total++;
      const st = fs.statSync(`${dir}/${n}`);
      if (now - st.mtimeMs > windowMs) continue;
      const d = new Date(st.mtimeMs).toISOString().slice(0, 10);
      buckets.set(d, (buckets.get(d) ?? 0) + 1);
    }
    const days: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0);
      d.setUTCDate(d.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, count: buckets.get(key) ?? 0 });
    }
    return { total, days, source };
  } catch {
    return { total: 0, days: [], source };
  }
}

function isoWeek(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function MiniBars({ values, max, color }: { values: number[]; max: number; color: string }) {
  const upper = Math.max(1, max);
  return (
    <div className="flex items-end gap-[3px]" style={{ height: 40 }}>
      {values.map((v, i) => {
        const h = Math.max(2, Math.round((v / upper) * 40));
        return (
          <div
            key={i}
            title={String(v)}
            style={{ width: 8, height: h, backgroundColor: color }}
            className="rounded-sm opacity-80"
          />
        );
      })}
    </div>
  );
}

export default function Home() {
  const rootOk = aiosRootExists();
  const patterns = countPatterns();
  const decisions = countDecisionsByWeek();
  const shortTerm = countShortTermByDay();
  const active = getMemorySection('Active Context');

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl text-paper">System Progress</h1>
        <p className="max-w-2xl text-sm text-muted">
          {rootOk
            ? 'Snapshot of the brain folder as of this page load. Everything on this page reads directly from the filesystem.'
            : 'AIOS_ROOT is not set to a readable folder. Set it in .env.local and restart the server.'}
        </p>
        {!rootOk && (
          <div className="rounded border border-orange/30 bg-orange/10 p-3 text-sm text-paper">
            <div className="mb-1 font-heading text-orange">Empty state</div>
            Expected to find a brain folder at
            <span className="mx-1 rounded bg-white/[0.06] px-1 py-0.5 font-mono">
              {AIOS_ROOT}
            </span>
            but nothing is there. Point the <code className="font-mono">AIOS_ROOT</code> env
            variable at your AI-OS brain (see <code className="font-mono">.env.example</code>).
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Panel title="Vital Signs" source="META-COGNITION/vital-signs.md">
          <VitalSignsPanel />
        </Panel>

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
              No `## Active Context` section found in MEMORY.md.
            </div>
          )}
        </Panel>

        <Panel title="Brain Activity" source="git log --since=30.days">
          <ActivityHeatmap />
        </Panel>

        <Panel title="Patterns Recognised" source={patterns.source}>
          <div className="flex flex-col gap-1">
            <div className="font-heading text-3xl text-paper">
              {patterns.available ? patterns.count : '—'}
            </div>
            <div className="text-xs text-muted">
              {patterns.available
                ? `### entries in patterns.md`
                : 'patterns.md not found'}
            </div>
            <Link
              href="/r/CEREBELLUM/patterns.md"
              className="mt-2 font-mono text-[11px] uppercase tracking-wider text-blue hover:text-orange"
              prefetch={false}
            >
              open file →
            </Link>
          </div>
        </Panel>

        <Panel title="Decisions Made" source={decisions.source}>
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <div className="font-heading text-3xl text-paper">{decisions.total}</div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-muted">
                by week · last 8
              </div>
            </div>
            <MiniBars
              values={decisions.weeks.map((w) => w.count)}
              max={Math.max(1, ...decisions.weeks.map((w) => w.count))}
              color="#6a9bcc"
            />
            <Link
              href="/r/HIPPOCAMPUS"
              className="mt-1 font-mono text-[11px] uppercase tracking-wider text-blue hover:text-orange"
              prefetch={false}
            >
              browse decisions →
            </Link>
          </div>
        </Panel>

        <Panel title="Memory Load" source={shortTerm.source}>
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <div className="font-heading text-3xl text-paper">{shortTerm.total}</div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-muted">
                short-term files
              </div>
            </div>
            <MiniBars
              values={shortTerm.days.map((d) => d.count)}
              max={Math.max(1, ...shortTerm.days.map((d) => d.count))}
              color="#788c5d"
            />
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted/80">
              new files per day, last 30
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
