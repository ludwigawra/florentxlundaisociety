import Link from 'next/link';
import type { IndexedFile } from '@/lib/fs-index';
import { fileRoute } from '@/lib/link-resolver';

interface Props {
  files: IndexedFile[];
}

export default function Backlinks({ files }: Props) {
  if (files.length === 0) {
    return (
      <div className="text-sm text-muted">
        No other file links here yet.
      </div>
    );
  }
  return (
    <ul className="divide-y divide-white/5 rounded border border-white/10 bg-white/[0.02]">
      {files.map((f) => (
        <li key={f.absPath} className="px-3 py-2">
          <Link
            href={fileRoute(f)}
            prefetch={false}
            className="block text-sm text-paper hover:text-orange"
          >
            <div className="truncate font-heading">{f.title}</div>
            <div className="truncate font-mono text-[11px] text-muted">{f.relPath}</div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
