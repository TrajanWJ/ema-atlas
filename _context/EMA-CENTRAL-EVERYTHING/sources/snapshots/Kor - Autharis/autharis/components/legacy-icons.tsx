import * as React from 'react';

type IconProps = { size?: number; stroke?: number; className?: string };

export const Icon = ({
  children,
  size = 16,
  stroke = 1.5,
  className = '',
}: IconProps & { children: React.ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    {children}
  </svg>
);

export const Icons = {
  Arrow: (p: IconProps) => <Icon {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Icon>,
  ArrowDL: (p: IconProps) => <Icon {...p}><path d="M17 7 7 17M16 17H7V8" /></Icon>,
  Check: (p: IconProps) => <Icon {...p}><path d="M4 12l5 5L20 6" /></Icon>,
  X: (p: IconProps) => <Icon {...p}><path d="M6 6l12 12M18 6l-12 12" /></Icon>,
  Plus: (p: IconProps) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>,
  Search: (p: IconProps) => <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icon>,
  Filter: (p: IconProps) => <Icon {...p}><path d="M3 5h18M6 12h12M10 19h4" /></Icon>,
  Sort: (p: IconProps) => <Icon {...p}><path d="M7 4v16M4 7l3-3 3 3M17 20V4M14 17l3 3 3-3" /></Icon>,
  User: (p: IconProps) => <Icon {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Icon>,
  Users: (p: IconProps) => <Icon {...p}><circle cx="9" cy="8" r="4" /><path d="M2 21a7 7 0 0 1 14 0" /><path d="M16 3a4 4 0 0 1 0 8" /><path d="M22 21a7 7 0 0 0-6-6.9" /></Icon>,
  Brief: (p: IconProps) => <Icon {...p}><rect x="3" y="7" width="18" height="13" rx="1" /><path d="M9 7V4h6v3" /></Icon>,
  Doc: (p: IconProps) => <Icon {...p}><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5" /></Icon>,
  Clock: (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>,
  Cash: (p: IconProps) => <Icon {...p}><rect x="2" y="6" width="20" height="12" rx="1" /><circle cx="12" cy="12" r="3" /></Icon>,
  Bell: (p: IconProps) => <Icon {...p}><path d="M6 15V10a6 6 0 0 1 12 0v5l2 3H4z" /><path d="M10 21a2 2 0 0 0 4 0" /></Icon>,
  Settings: (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a7.6 7.6 0 0 0 0-6l2-1.2-2-3.4-2.2 1a7.6 7.6 0 0 0-5.2-3L11.6 0h-4L7.2 2.4a7.6 7.6 0 0 0-5.2 3L0 4.4l-2 3.4 2 1.2a7.6 7.6 0 0 0 0 6L-2 16.2l2 3.4 2.2-1a7.6 7.6 0 0 0 5.2 3L8 24h4l.4-2.4a7.6 7.6 0 0 0 5.2-3l2.2 1 2-3.4z" /></Icon>,
  Shield: (p: IconProps) => <Icon {...p}><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" /></Icon>,
  Sparkles: (p: IconProps) => <Icon {...p}><path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3" /></Icon>,
  Grid: (p: IconProps) => <Icon {...p}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></Icon>,
  List: (p: IconProps) => <Icon {...p}><path d="M4 6h16M4 12h16M4 18h16" /></Icon>,
  ChevR: (p: IconProps) => <Icon {...p}><path d="m9 6 6 6-6 6" /></Icon>,
  ChevD: (p: IconProps) => <Icon {...p}><path d="m6 9 6 6 6-6" /></Icon>,
  Dot: (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" /></Icon>,
  Menu: (p: IconProps) => <Icon {...p}><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></Icon>,
  Calendar: (p: IconProps) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="1" /><path d="M8 3v4M16 3v4M3 10h18" /></Icon>,
  Send: (p: IconProps) => <Icon {...p}><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" /></Icon>,
  Pause: (p: IconProps) => <Icon {...p}><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></Icon>,
  Pin: (p: IconProps) => <Icon {...p}><path d="M12 17v5M7 3h10l-2 6 3 3H6l3-3z" /></Icon>,
  Close: (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6M15 9l-6 6" /></Icon>,
};
