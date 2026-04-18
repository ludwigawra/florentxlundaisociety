import { getVitalSigns, type Severity, type VitalSign } from '@/lib/vital-signs';

const toneFor: Record<Severity, { dot: string; text: string; ring: string }> = {
  green: { dot: 'bg-green', text: 'text-green', ring: 'ring-green/30' },
  yellow: { dot: 'bg-orange', text: 'text-orange', ring: 'ring-orange/30' },
  red: { dot: 'bg-[#d7583a]', text: 'text-[#d7583a]', ring: 'ring-[#d7583a]/40' },
  unknown: { dot: 'bg-muted', text: 'text-muted', ring: 'ring-muted/30' }
};

function Chip({ sign }: { sign: VitalSign }) {
  const tone = toneFor[sign.severity];
  return (
    <div
      className={`flex flex-col gap-1 rounded border border-white/10 bg-white/[0.02] p-3 ring-1 ${tone.ring}`}
    >
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${tone.dot}`} aria-hidden="true" />
        <span className="font-heading text-sm text-paper">{sign.label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`font-heading text-2xl ${tone.text}`}>
          {sign.value ?? '—'}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
          {sign.unit}
        </span>
      </div>
      <div className="text-xs text-muted">{sign.note}</div>
    </div>
  );
}

export default function VitalSignsPanel() {
  const signs = getVitalSigns();
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {signs.map((s) => (
        <Chip key={s.id} sign={s} />
      ))}
    </div>
  );
}
