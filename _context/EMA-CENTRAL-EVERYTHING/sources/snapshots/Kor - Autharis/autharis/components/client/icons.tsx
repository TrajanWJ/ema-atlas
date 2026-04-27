import * as React from 'react';

type IconProps = {
  size?: number;
  stroke?: number;
  className?: string;
};

function Icon({
  children,
  size = 16,
  stroke = 1.5,
  className = '',
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={stroke}
      viewBox="0 0 24 24"
      width={size}
    >
      {children}
    </svg>
  );
}

export const ClientIcons = {
  Arrow: (props: IconProps) => (
    <Icon {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Icon>
  ),
  ArrowDownload: (props: IconProps) => (
    <Icon {...props}>
      <path d="M17 7 7 17M16 17H7V8" />
    </Icon>
  ),
  Brief: (props: IconProps) => (
    <Icon {...props}>
      <rect height="13" rx="1" width="18" x="3" y="7" />
      <path d="M9 7V4h6v3" />
    </Icon>
  ),
  Cash: (props: IconProps) => (
    <Icon {...props}>
      <rect height="12" rx="1" width="20" x="2" y="6" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  ),
  Check: (props: IconProps) => (
    <Icon {...props}>
      <path d="M4 12l5 5L20 6" />
    </Icon>
  ),
  ChevronDown: (props: IconProps) => (
    <Icon {...props}>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  ),
  ChevronRight: (props: IconProps) => (
    <Icon {...props}>
      <path d="m9 6 6 6-6 6" />
    </Icon>
  ),
  Clock: (props: IconProps) => (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Icon>
  ),
  Filter: (props: IconProps) => (
    <Icon {...props}>
      <path d="M3 5h18M6 12h12M10 19h4" />
    </Icon>
  ),
  Grid: (props: IconProps) => (
    <Icon {...props}>
      <rect height="7" width="7" x="3" y="3" />
      <rect height="7" width="7" x="14" y="3" />
      <rect height="7" width="7" x="3" y="14" />
      <rect height="7" width="7" x="14" y="14" />
    </Icon>
  ),
  Plus: (props: IconProps) => (
    <Icon {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  ),
  Send: (props: IconProps) => (
    <Icon {...props}>
      <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
    </Icon>
  ),
  Settings: (props: IconProps) => (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a7.6 7.6 0 0 0 0-6l2-1.2-2-3.4-2.2 1a7.6 7.6 0 0 0-5.2-3L11.6 0h-4L7.2 2.4a7.6 7.6 0 0 0-5.2 3L0 4.4l-2 3.4 2 1.2a7.6 7.6 0 0 0 0 6L-2 16.2l2 3.4 2.2-1a7.6 7.6 0 0 0 5.2 3L8 24h4l.4-2.4a7.6 7.6 0 0 0 5.2-3l2.2 1 2-3.4z" />
    </Icon>
  ),
  Sparkles: (props: IconProps) => (
    <Icon {...props}>
      <path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3" />
    </Icon>
  ),
  Users: (props: IconProps) => (
    <Icon {...props}>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21a7 7 0 0 1 14 0" />
      <path d="M16 3a4 4 0 0 1 0 8" />
      <path d="M22 21a7 7 0 0 0-6-6.9" />
    </Icon>
  ),
};
