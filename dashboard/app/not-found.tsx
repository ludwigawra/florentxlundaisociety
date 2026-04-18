import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col gap-3 rounded-card border border-white/10 bg-white/[0.02] p-6">
      <h1 className="font-heading text-2xl text-paper">Not found</h1>
      <p className="text-sm text-muted">
        That page doesn't exist in this brain. Try the home view or search.
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="rounded border border-white/15 bg-white/[0.03] px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-paper hover:border-orange/60 hover:text-orange"
        >
          Home
        </Link>
        <Link
          href="/search"
          className="rounded border border-white/15 bg-white/[0.03] px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-paper hover:border-orange/60 hover:text-orange"
        >
          Search
        </Link>
      </div>
    </div>
  );
}
