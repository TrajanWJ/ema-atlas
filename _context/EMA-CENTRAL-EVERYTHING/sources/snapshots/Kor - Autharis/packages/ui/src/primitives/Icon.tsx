import * as React from 'react';

export const ICON_NAMES = [
  'arrow',
  'check',
  'x',
  'plus',
  'search',
  'filter',
  'user',
  'users',
  'bell',
  'settings',
  'chevR',
  'chevD',
] as const;

export type IconName = (typeof ICON_NAMES)[number];

export type IconProps = Omit<React.SVGAttributes<SVGSVGElement>, 'name'> & {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  title?: string;
};

/** Feather-style paths — stroke-based, 24x24 viewBox. */
const PATHS: Record<IconName, React.ReactNode> = {
  arrow: (
    <>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="13 6 19 12 13 18" />
    </>
  ),
  check: <polyline points="5 12 10 17 19 7" />,
  x: (
    <>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </>
  ),
  plus: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <line x1="16.2" y1="16.2" x2="21" y2="21" />
    </>
  ),
  filter: (
    <polygon points="4 5 20 5 14 12.5 14 19 10 20.5 10 12.5" />
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c1-3.3 3.8-5 6.5-5s5.5 1.7 6.5 5" />
      <circle cx="17" cy="9" r="2.8" />
      <path d="M15 15c2.2 0 5 1.4 6 5" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2H4.5z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 14a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V20a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H4a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 5.6 8a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H10a1.7 1.7 0 0 0 1-1.5V2a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V8a1.7 1.7 0 0 0 1.5 1H22a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </>
  ),
  chevR: <polyline points="9 5 16 12 9 19" />,
  chevD: <polyline points="5 9 12 16 19 9" />,
};

export function Icon({
  name,
  size = 16,
  strokeWidth = 1.75,
  title,
  style,
  ...rest
}: IconProps) {
  const labelled = Boolean(title);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={labelled ? 'img' : 'presentation'}
      aria-hidden={labelled ? undefined : true}
      aria-label={labelled ? title : undefined}
      style={{ display: 'inline-block', flexShrink: 0, ...style }}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {PATHS[name]}
    </svg>
  );
}
