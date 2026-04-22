'use client';

import { cn } from '@/src/lib/utils';

const TOKEN_STYLES: Record<string, string> = {
  '>': 'token-narrative',
  '@': 'token-delegation',
  '#': 'token-status',
  '!': 'token-hint',
};

const TOKEN_LABELS: Record<string, string> = {
  '>': '>',
  '@': '@',
  '#': '#',
  '!': '!',
};

interface GrammarTokenProps {
  token: string;
}

export function GrammarToken({ token }: GrammarTokenProps) {
  return (
    <span
      className={cn(
        'inline-block w-4 shrink-0 font-mono font-bold text-sm select-none',
        TOKEN_STYLES[token] ?? 'text-muted-foreground'
      )}
    >
      {TOKEN_LABELS[token] ?? token}
    </span>
  );
}
