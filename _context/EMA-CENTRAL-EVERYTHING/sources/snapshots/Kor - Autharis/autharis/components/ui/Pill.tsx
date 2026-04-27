import * as React from 'react';

type PillTone = 'default' | 'accent' | 'selected' | 'quiet';

type BasePillProps = {
  tone?: PillTone;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
};

export type PillProps = React.HTMLAttributes<HTMLSpanElement> & BasePillProps;

export type PillButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  BasePillProps & {
    active?: boolean;
  };

function getPillClassName(tone: PillTone): string {
  switch (tone) {
    case 'accent':
      return 'chip chip-accent';
    case 'selected':
      return 'chip chip-selected';
    default:
      return 'chip';
  }
}

function getQuietStyle(tone: PillTone): React.CSSProperties | undefined {
  if (tone !== 'quiet') return undefined;

  return {
    background: 'transparent',
    borderColor: 'var(--line-soft)',
    color: 'var(--ink-3)',
  };
}

function PillInner({
  leading,
  trailing,
  children,
}: Pick<BasePillProps, 'leading' | 'trailing'> & { children: React.ReactNode }) {
  return (
    <>
      {leading ? <span aria-hidden>{leading}</span> : null}
      <span>{children}</span>
      {trailing ? <span aria-hidden>{trailing}</span> : null}
    </>
  );
}

export function Pill({
  tone = 'default',
  leading,
  trailing,
  className = '',
  children,
  style,
  ...props
}: PillProps) {
  const classes = [getPillClassName(tone), className].filter(Boolean).join(' ');

  return (
    <span className={classes} style={{ ...getQuietStyle(tone), ...style }} {...props}>
      <PillInner leading={leading} trailing={trailing}>
        {children}
      </PillInner>
    </span>
  );
}

export function PillButton({
  tone = 'default',
  active = false,
  leading,
  trailing,
  className = '',
  children,
  style,
  type = 'button',
  ...props
}: PillButtonProps) {
  const resolvedTone = active ? 'selected' : tone;
  const classes = [
    getPillClassName(resolvedTone),
    'chip-interactive',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      style={{ ...getQuietStyle(resolvedTone), ...style }}
      aria-pressed={active}
      {...props}
    >
      <PillInner leading={leading} trailing={trailing}>
        {children}
      </PillInner>
    </button>
  );
}

