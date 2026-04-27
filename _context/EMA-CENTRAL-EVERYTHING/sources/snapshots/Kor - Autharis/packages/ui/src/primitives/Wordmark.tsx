import * as React from 'react';

export type WordmarkScale = 'sm' | 'md' | 'lg';

type SharedProps = {
  scale?: WordmarkScale;
  kicker?: React.ReactNode;
  className?: string;
};

type WordmarkLinkProps = SharedProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

type WordmarkStaticProps = SharedProps &
  React.HTMLAttributes<HTMLDivElement> & { href?: never };

export type WordmarkProps = WordmarkLinkProps | WordmarkStaticProps;

const SCALE: Record<
  WordmarkScale,
  { fontSize: number; markSize: number; kickerSize: number }
> = {
  sm: { fontSize: 18, markSize: 20, kickerSize: 9 },
  md: { fontSize: 22, markSize: 26, kickerSize: 10 },
  lg: { fontSize: 28, markSize: 32, kickerSize: 11 },
};

/**
 * Autharis mark — simple geometric logotype: a filled disc with an offset
 * negative-space stroke forming an "A" aperture.
 */
function AutharisMark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label="Autharis mark"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="16" cy="16" r="15" fill="var(--accent, #E8552B)" />
      <path
        d="M10 23 L16 8 L22 23 M12.2 18 L19.8 18"
        fill="none"
        stroke="var(--accent-ink, #ffffff)"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Content({
  scale,
  kicker,
}: Pick<SharedProps, 'scale' | 'kicker'>) {
  const { fontSize, markSize, kickerSize } = SCALE[scale ?? 'md'];

  return (
    <>
      <span
        className="ui-wordmark"
        style={{
          fontSize,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          fontFamily: 'var(--font-display, system-ui)',
          fontWeight: 600,
          letterSpacing: '-0.025em',
          color: 'var(--ink)',
        }}
      >
        <AutharisMark size={markSize} />
        <span>Autharis</span>
      </span>
      {kicker ? (
        <span
          className="ui-wordmark-kicker"
          style={{
            fontFamily: 'var(--font-mono, ui-monospace, monospace)',
            fontSize: kickerSize,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--ink-3)',
            marginLeft: 8,
          }}
        >
          {kicker}
        </span>
      ) : null}
    </>
  );
}

export function Wordmark(props: WordmarkProps) {
  if ('href' in props && props.href !== undefined) {
    const { scale = 'md', kicker, className, href, style, ...rest } = props;
    return (
      <a
        href={href}
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 14,
          textDecoration: 'none',
          ...style,
        }}
        {...rest}
      >
        <Content scale={scale} kicker={kicker} />
      </a>
    );
  }

  const { scale = 'md', kicker, className, style, ...rest } =
    props as WordmarkStaticProps;
  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 14,
        ...style,
      }}
      {...rest}
    >
      <Content scale={scale} kicker={kicker} />
    </div>
  );
}
