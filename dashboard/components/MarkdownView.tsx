import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import WikiLink from './WikiLink';

interface Props {
  markdown: string;
}

const WIKI_LINK_RE = /\[\[([^\]]+?)\]\]/g;

/**
 * Walk plain text inside a React tree and replace every `[[target|label]]`
 * token with a <WikiLink/>. We only touch strings, so Markdown-rendered
 * elements keep their structure.
 */
function injectWikiLinks(node: React.ReactNode, keyPrefix: string): React.ReactNode {
  if (typeof node === 'string') {
    if (!node.includes('[[')) return node;
    const out: React.ReactNode[] = [];
    let last = 0;
    let match: RegExpExecArray | null;
    const re = new RegExp(WIKI_LINK_RE.source, 'g');
    let i = 0;
    while ((match = re.exec(node)) !== null) {
      if (match.index > last) out.push(node.slice(last, match.index));
      const parts = match[1].split('|').map((s) => s.trim());
      const target = parts[0] ?? '';
      const label = parts[1];
      out.push(
        <WikiLink key={`${keyPrefix}-wl-${i}`} target={target}>
          {label ?? target}
        </WikiLink>
      );
      last = match.index + match[0].length;
      i++;
    }
    if (last < node.length) out.push(node.slice(last));
    return out;
  }
  if (Array.isArray(node)) {
    return node.map((c, i) => injectWikiLinks(c, `${keyPrefix}-${i}`));
  }
  return node;
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="mt-6 mb-3 font-heading text-2xl text-paper">
      {injectWikiLinks(children, 'h1')}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-6 mb-2 font-heading text-xl text-paper">
      {injectWikiLinks(children, 'h2')}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-5 mb-2 font-heading text-lg text-paper">
      {injectWikiLinks(children, 'h3')}
    </h3>
  ),
  p: ({ children }) => (
    <p className="my-3 font-body leading-relaxed text-paper/90">
      {injectWikiLinks(children, 'p')}
    </p>
  ),
  li: ({ children }) => (
    <li className="my-1 font-body text-paper/90">{injectWikiLinks(children, 'li')}</li>
  ),
  ul: ({ children }) => <ul className="my-3 list-disc space-y-1 pl-6">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 list-decimal space-y-1 pl-6">{children}</ol>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="text-blue underline decoration-blue/40 underline-offset-2 hover:text-orange hover:decoration-orange"
    >
      {children}
    </a>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return (
        <code className="block whitespace-pre-wrap rounded border border-white/10 bg-white/[0.03] p-3 font-mono text-xs text-paper/90">
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-[0.85em] text-paper">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded border border-white/10 bg-white/[0.03] p-3 font-mono text-xs text-paper/90">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-orange/60 pl-4 italic text-paper/80">
      {injectWikiLinks(children, 'bq')}
    </blockquote>
  ),
  hr: () => <hr className="my-6 border-white/10" />,
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-white/15 px-2 py-1 text-left font-heading text-paper">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-white/5 px-2 py-1 font-body text-paper/90">
      {injectWikiLinks(children, 'td')}
    </td>
  )
};

export default function MarkdownView({ markdown }: Props) {
  return (
    <div className="markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
