'use client';

import type { z } from 'zod';
import type { OutputBlockSchema } from '@contracts/messages';
import { cn } from '@/src/lib/utils';

type OutputBlock = z.infer<typeof OutputBlockSchema>;

interface MessageBlockProps {
  block: OutputBlock;
}

export function MessageBlock({ block }: MessageBlockProps) {
  switch (block.type) {
    case 'narrative':
      return (
        <span className="token-narrative">{block.content}</span>
      );

    case 'delegation':
      return (
        <span className="token-delegation">
          @{block.targetAgentName}{' '}
          <span className="text-muted-foreground text-xs">({block.label})</span>
        </span>
      );

    case 'status':
      return (
        <span className="token-status">{block.content}</span>
      );

    case 'hint':
      return (
        <span className="token-hint">{block.content}</span>
      );

    case 'structured':
      return (
        <div className="rounded border border-border bg-muted/30 p-2 font-mono text-xs text-muted-foreground overflow-x-auto">
          <pre>{JSON.stringify(block.manifest, null, 2)}</pre>
        </div>
      );

    case 'reference':
      return (
        <button
          className={cn(
            'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium',
            'bg-accent/50 text-terminal-accent hover:bg-accent transition-colors'
          )}
        >
          [{block.kind.toUpperCase()}: {block.id}] {block.label}
        </button>
      );

    default:
      return null;
  }
}
