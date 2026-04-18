import type { Metadata } from 'next';
import Link from 'next/link';
import { Poppins, Lora, Space_Mono } from 'next/font/google';
import { getRegionManifest } from '@/lib/region-manifest';
import { aiosRootExists, AIOS_ROOT } from '@/lib/paths';
import './globals.css';

const heading = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-heading',
  display: 'swap'
});

const body = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap'
});

const mono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'AI-OS Dashboard',
  description:
    'Local-first, no-account dashboard for an AI-OS brain folder. Visualises system health, memory, decisions, and patterns.'
};

function Nav() {
  const regions = getRegionManifest();
  const rootOk = aiosRootExists();
  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-ink/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-6 py-3">
        <Link
          href="/"
          className="font-heading text-base tracking-wide text-paper hover:text-orange"
        >
          AI-OS
        </Link>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <Link href="/" className="text-muted hover:text-paper">
            Home
          </Link>
          <Link href="/memory" className="text-muted hover:text-paper">
            Memory
          </Link>
          <Link href="/search" className="text-muted hover:text-paper">
            Search
          </Link>
          <span className="mx-1 h-4 w-px bg-white/10" aria-hidden="true" />
          {regions.map((r) => (
            <Link
              key={r.id}
              href={`/r/${encodeURIComponent(r.id)}`}
              className="font-mono text-[11px] uppercase tracking-wider text-muted hover:text-orange"
              title={r.id}
            >
              {r.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 font-mono text-[11px] text-muted">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              rootOk ? 'bg-green' : 'bg-[#d7583a]'
            }`}
            aria-hidden="true"
          />
          <span className="max-w-[36ch] truncate" title={AIOS_ROOT}>
            {rootOk ? AIOS_ROOT : 'AIOS_ROOT not found'}
          </span>
        </div>
      </div>
    </header>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${heading.variable} ${body.variable} ${mono.variable} dark`}
    >
      <body className="min-h-screen bg-ink text-paper antialiased">
        <Nav />
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-6 pb-12 pt-4 text-xs text-muted">
          Read-only view. Edit files from the terminal via
          <span className="mx-1 rounded bg-white/[0.04] px-1 py-0.5 font-mono">
            claude "&lt;path&gt;"
          </span>
          or your editor of choice.
        </footer>
      </body>
    </html>
  );
}
