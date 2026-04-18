import Link from 'next/link';
import type { Frontmatter } from '@/lib/fs-index';

interface Props {
  frontmatter: Frontmatter;
}

function Chip({
  children,
  tone
}: {
  children: React.ReactNode;
  tone: 'type' | 'tag' | 'status';
}) {
  const palette: Record<typeof tone, string> = {
    type: 'border-blue/40 bg-blue/10 text-blue',
    tag: 'border-white/15 bg-white/[0.03] text-muted',
    status: 'border-green/40 bg-green/10 text-green'
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider ${palette[tone]}`}
    >
      {children}
    </span>
  );
}

export default function FrontmatterChips({ frontmatter }: Props) {
  const type = typeof frontmatter.type === 'string' ? frontmatter.type : undefined;
  const status = typeof frontmatter.status === 'string' ? frontmatter.status : undefined;
  const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];

  if (!type && !status && tags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {type && (
        <Link href={`/search?type=${encodeURIComponent(type)}`} prefetch={false}>
          <Chip tone="type">{type}</Chip>
        </Link>
      )}
      {status && <Chip tone="status">{status}</Chip>}
      {tags.map((t) => (
        <Link
          key={String(t)}
          href={`/search?tag=${encodeURIComponent(String(t))}`}
          prefetch={false}
        >
          <Chip tone="tag">#{String(t)}</Chip>
        </Link>
      ))}
    </div>
  );
}
