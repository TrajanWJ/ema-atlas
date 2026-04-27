import * as React from 'react';

type SharedProps = {
  label: React.ReactNode;
  icon?: React.ReactNode;
  count?: React.ReactNode;
  active?: boolean;
  className?: string;
};

type ShellNavButtonProps = SharedProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never;
  };

type ShellNavLinkProps = SharedProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

export type ShellNavItemProps = ShellNavButtonProps | ShellNavLinkProps;

function ShellNavInner({
  icon,
  label,
  count,
}: Pick<SharedProps, 'icon' | 'label' | 'count'>) {
  return (
    <>
      {icon ? (
        <span aria-hidden style={{ display: 'inline-flex', alignItems: 'center' }}>
          {icon}
        </span>
      ) : null}
      <span>{label}</span>
      {count ? (
        <span
          className="mono"
          style={{
            marginLeft: 8,
            opacity: 0.68,
            fontSize: 10,
            letterSpacing: '0.06em',
          }}
        >
          {count}
        </span>
      ) : null}
    </>
  );
}

export function ShellNavItem(props: ShellNavItemProps) {
  if (typeof props.href === 'string') {
    const { label, icon, count, active = false, className, href, ...rest } = props;
    const classes = ['appbar-nav-item', className].filter(Boolean).join(' ');

    return (
      <a
        href={href}
        className={classes}
        data-active={active}
        aria-current={active ? 'page' : undefined}
        {...rest}
      >
        <ShellNavInner icon={icon} label={label} count={count} />
      </a>
    );
  }

  const { label, icon, count, active = false, className, type = 'button', ...rest } = props;
  const classes = ['appbar-nav-item', className].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      data-active={active}
      aria-pressed={active}
      {...rest}
    >
      <ShellNavInner icon={icon} label={label} count={count} />
    </button>
  );
}
