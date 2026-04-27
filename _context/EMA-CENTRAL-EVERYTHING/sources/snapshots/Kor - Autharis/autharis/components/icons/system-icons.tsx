import * as React from 'react';

export type IconProps = Omit<React.SVGProps<SVGSVGElement>, 'children' | 'stroke'> & {
  size?: number;
  stroke?: number;
  title?: string;
};

function IconBase({
  children,
  size = 16,
  stroke = 1.7,
  title,
  ...props
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : 'presentation'}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function AutharisMark({
  size = 28,
  title,
  ...props
}: Omit<IconProps, 'stroke'>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : 'presentation'}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <rect x="0" y="0" width="32" height="32" rx="4" fill="var(--brand-ink)" />
      <circle
        cx="16"
        cy="16"
        r="11"
        stroke="var(--brand-paper)"
        strokeWidth="1.2"
      />
      <path
        d="M16 16V7"
        stroke="var(--brand-terra)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16 16L22 19"
        stroke="var(--brand-paper)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="1.6" fill="var(--brand-paper)" />
    </svg>
  );
}

export const ArrowRightIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </IconBase>
);

export const ArrowUpRightIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M7 17 17 7" />
    <path d="M9 7h8v8" />
  </IconBase>
);

export const CheckIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="m4 12 5 5L20 6" />
  </IconBase>
);

export const CloseIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="m6 6 12 12" />
    <path d="M18 6 6 18" />
  </IconBase>
);

export const SearchIcon = (props: IconProps) => (
  <IconBase {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </IconBase>
);

export const FilterIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M3 5h18" />
    <path d="M6 12h12" />
    <path d="M10 19h4" />
  </IconBase>
);

export const SortIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M7 4v16" />
    <path d="m4 7 3-3 3 3" />
    <path d="M17 20V4" />
    <path d="m14 17 3 3 3-3" />
  </IconBase>
);

export const UserIcon = (props: IconProps) => (
  <IconBase {...props}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </IconBase>
);

export const UsersIcon = (props: IconProps) => (
  <IconBase {...props}>
    <circle cx="9" cy="8" r="4" />
    <path d="M2 21a7 7 0 0 1 14 0" />
    <path d="M16 4a4 4 0 0 1 0 8" />
    <path d="M22 21a7 7 0 0 0-6-6.9" />
  </IconBase>
);

export const BriefcaseIcon = (props: IconProps) => (
  <IconBase {...props}>
    <rect x="3" y="7" width="18" height="13" rx="1.5" />
    <path d="M9 7V4h6v3" />
    <path d="M3 12h18" />
  </IconBase>
);

export const DocumentIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M6 3h9l4 4v14H6z" />
    <path d="M14 3v5h5" />
  </IconBase>
);

export const ClockIcon = (props: IconProps) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </IconBase>
);

export const CurrencyIcon = (props: IconProps) => (
  <IconBase {...props}>
    <rect x="2.5" y="6" width="19" height="12" rx="1.5" />
    <circle cx="12" cy="12" r="3" />
    <path d="M5.5 9.5a2 2 0 0 0 0 5" />
    <path d="M18.5 9.5a2 2 0 0 1 0 5" />
  </IconBase>
);

export const BellIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M6 15v-4a6 6 0 0 1 12 0v4l2 3H4z" />
    <path d="M10 21a2 2 0 0 0 4 0" />
  </IconBase>
);

export const SettingsIcon = (props: IconProps) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="3.25" />
    <path d="M12 2.75v2.5" />
    <path d="M12 18.75v2.5" />
    <path d="M21.25 12h-2.5" />
    <path d="M5.25 12h-2.5" />
    <path d="m18.54 5.46-1.77 1.77" />
    <path d="m7.23 16.77-1.77 1.77" />
    <path d="m18.54 18.54-1.77-1.77" />
    <path d="M7.23 7.23 5.46 5.46" />
  </IconBase>
);

export const ShieldIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="m12 2 8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" />
  </IconBase>
);

export const SparklesIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M12 3v5" />
    <path d="M12 16v5" />
    <path d="M3 12h5" />
    <path d="M16 12h5" />
    <path d="m6 6 3 3" />
    <path d="m15 15 3 3" />
    <path d="m18 6-3 3" />
    <path d="m9 15-3 3" />
  </IconBase>
);

export const GridIcon = (props: IconProps) => (
  <IconBase {...props}>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </IconBase>
);

export const ListIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
  </IconBase>
);

export const ChevronRightIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="m9 6 6 6-6 6" />
  </IconBase>
);

export const ChevronDownIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="m6 9 6 6 6-6" />
  </IconBase>
);

export const DotIcon = ({ stroke, ...props }: IconProps) => (
  <IconBase stroke={stroke ?? 0} {...props}>
    <circle cx="12" cy="12" r="2.5" fill="currentColor" />
  </IconBase>
);

export const MenuIcon = ({ stroke, ...props }: IconProps) => (
  <IconBase stroke={stroke ?? 0} {...props}>
    <circle cx="5" cy="12" r="1.3" fill="currentColor" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" />
    <circle cx="19" cy="12" r="1.3" fill="currentColor" />
  </IconBase>
);

export const CalendarIcon = (props: IconProps) => (
  <IconBase {...props}>
    <rect x="3" y="5" width="18" height="16" rx="1.5" />
    <path d="M8 3v4" />
    <path d="M16 3v4" />
    <path d="M3 10h18" />
  </IconBase>
);

export const SendIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M22 2 11 13" />
    <path d="m22 2-7 20-4-9-9-4z" />
  </IconBase>
);

export const PauseIcon = (props: IconProps) => (
  <IconBase {...props}>
    <rect x="6" y="5" width="4" height="14" />
    <rect x="14" y="5" width="4" height="14" />
  </IconBase>
);

export const SystemIcons = {
  ArrowRight: ArrowRightIcon,
  ArrowUpRight: ArrowUpRightIcon,
  Check: CheckIcon,
  Close: CloseIcon,
  Search: SearchIcon,
  Filter: FilterIcon,
  Sort: SortIcon,
  User: UserIcon,
  Users: UsersIcon,
  Briefcase: BriefcaseIcon,
  Document: DocumentIcon,
  Clock: ClockIcon,
  Currency: CurrencyIcon,
  Bell: BellIcon,
  Settings: SettingsIcon,
  Shield: ShieldIcon,
  Sparkles: SparklesIcon,
  Grid: GridIcon,
  List: ListIcon,
  ChevronRight: ChevronRightIcon,
  ChevronDown: ChevronDownIcon,
  Dot: DotIcon,
  Menu: MenuIcon,
  Calendar: CalendarIcon,
  Send: SendIcon,
  Pause: PauseIcon,
} as const;
