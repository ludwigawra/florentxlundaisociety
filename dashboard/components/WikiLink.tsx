import Link from 'next/link';
import { resolveWikiLink } from '@/lib/link-resolver';

interface Props {
  target: string;
  children?: React.ReactNode;
}

/**
 * Renders `[[target]]` as an internal link when the slug resolves to an
 * indexed file. Unresolved links fall through to `/search?q=…` and are
 * styled with an orange dotted underline so missing connections stand out.
 */
export default function WikiLink({ target, children }: Props) {
  const resolved = resolveWikiLink(target);
  const label = children ?? resolved.label;
  const base =
    'transition font-medium underline-offset-2';
  const className = resolved.resolved
    ? `${base} text-blue hover:text-orange decoration-blue/40 hover:decoration-orange underline`
    : `${base} text-orange/90 underline decoration-dotted decoration-orange/70`;
  return (
    <Link href={resolved.href} className={className} prefetch={false}>
      {label}
    </Link>
  );
}
