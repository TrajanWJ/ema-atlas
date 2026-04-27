import * as React from 'react';

type BadgeTone = 'default' | 'accent' | 'ink' | 'outline';

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  dot?: boolean;
};

const TONE_CLASS: Record<BadgeTone, string> = {
  default: 'badge',
  accent: 'badge badge-accent',
  ink: 'badge badge-ink',
  outline: 'badge badge-outline',
};

const DOT_COLOR: Record<BadgeTone, string> = {
  default: 'var(--ink-3)',
  accent: 'currentColor',
  ink: 'currentColor',
  outline: 'var(--accent)',
};

export function Badge({
  tone = 'default',
  dot = false,
  className = '',
  children,
  ...props
}: BadgeProps) {
  const classes = [TONE_CLASS[tone], className].filter(Boolean).join(' ');

  return (
    <span className={classes} {...props}>
      {dot ? (
        <span
          aria-hidden
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: DOT_COLOR[tone],
            display: 'inline-block',
            marginRight: 6,
          }}
        />
      ) : null}
      {children}
    </span>
  );
}

