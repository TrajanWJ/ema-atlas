import * as React from 'react';

import { AutharisMark } from '@/components/icons';

type WordmarkScale = 'sm' | 'md' | 'lg';

type SharedProps = {
  scale?: WordmarkScale;
  kicker?: React.ReactNode;
  className?: string;
};

type WordmarkLinkProps = SharedProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

type WordmarkStaticProps = SharedProps &
  React.HTMLAttributes<HTMLDivElement> & {
    href?: never;
  };

export type WordmarkProps = WordmarkLinkProps | WordmarkStaticProps;

const SCALE_STYLES: Record<
  WordmarkScale,
  { fontSize: number; markSize: number; kickerSize: number }
> = {
  sm: { fontSize: 18, markSize: 20, kickerSize: 9 },
  md: { fontSize: 22, markSize: 26, kickerSize: 10 },
  lg: { fontSize: 28, markSize: 32, kickerSize: 11 },
};

function WordmarkContent({
  scale,
  kicker,
}: Pick<SharedProps, 'scale' | 'kicker'>) {
  const { fontSize, markSize, kickerSize } = SCALE_STYLES[scale ?? 'md'];

  return (
    <>
      <span
        className="wordmark"
        style={{
          fontSize,
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: 10,
        }}
      >
        <span
          className="wordmark-glyph"
          style={{
            width: markSize,
            height: markSize,
          }}
        >
          <AutharisMark size={markSize} />
        </span>
        <span>Autharis</span>
      </span>
      {kicker ? (
        <span
          className="mono"
          style={{
            fontSize: kickerSize,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--ink-3)',
          }}
        >
          {kicker}
        </span>
      ) : null}
    </>
  );
}

export function Wordmark(props: WordmarkProps) {
  if (typeof props.href === 'string') {
    const { scale = 'md', kicker, className, href, style, ...rest } = props;
    const classes = [className].filter(Boolean).join(' ');

    return (
      <a
        href={href}
        className={classes}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 14,
          textDecoration: 'none',
          ...style,
        }}
        {...rest}
      >
        <WordmarkContent scale={scale} kicker={kicker} />
      </a>
    );
  }

  const { scale = 'md', kicker, className, style, ...rest } = props;
  const classes = [className].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 14,
        ...style,
      }}
      {...rest}
    >
      <WordmarkContent scale={scale} kicker={kicker} />
    </div>
  );
}
