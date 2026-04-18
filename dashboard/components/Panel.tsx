import type { ReactNode } from 'react';

interface Props {
  title: string;
  source: string;
  children: ReactNode;
  actions?: ReactNode;
}

export default function Panel({ title, source, children, actions }: Props) {
  return (
    <section className="flex h-full flex-col gap-3 rounded-card border border-white/10 bg-white/[0.02] p-5">
      <header className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-base text-paper">{title}</h2>
        {actions}
      </header>
      <div className="flex-1">{children}</div>
      <footer className="pt-2 font-mono text-[11px] text-muted">
        <span className="text-muted/70">Source:</span> {source}
      </footer>
    </section>
  );
}
