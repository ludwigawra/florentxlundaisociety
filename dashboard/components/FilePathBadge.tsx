'use client';

import { useState } from 'react';

interface Props {
  /** Absolute path on disk. */
  absPath: string;
  /** Optional shorter label to show (defaults to the path). */
  label?: string;
  /** Show `claude "<path>"` or just the path. Default: `claude`. */
  mode?: 'claude' | 'path';
}

/**
 * Monospace badge with a copy button. Copies `claude "<abs-path>"` by
 * default — handy for jumping straight into a Claude Code session on
 * that file from the terminal.
 */
export default function FilePathBadge({ absPath, label, mode = 'claude' }: Props) {
  const [copied, setCopied] = useState(false);
  const payload = mode === 'claude' ? `claude "${absPath}"` : absPath;

  async function copy() {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Swallow — clipboard might be unavailable in some contexts.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={`Copy: ${payload}`}
      className="group inline-flex items-center gap-2 rounded border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-xs text-muted transition hover:border-orange/60 hover:text-paper"
    >
      <span className="truncate max-w-[48ch]">{label ?? absPath}</span>
      <span
        aria-hidden="true"
        className={`text-[10px] uppercase tracking-wider transition ${
          copied ? 'text-green' : 'text-muted/70 group-hover:text-orange'
        }`}
      >
        {copied ? 'copied' : 'copy'}
      </span>
    </button>
  );
}
