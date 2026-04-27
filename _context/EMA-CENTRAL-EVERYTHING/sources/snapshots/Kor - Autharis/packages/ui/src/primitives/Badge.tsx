import * as React from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  dot?: boolean;
};

export function Badge({
  variant = 'default',
  dot = false,
  className = '',
  children,
  ...rest
}: BadgeProps) {
  const classes = ['ui-badge', `ui-badge--${variant}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} {...rest}>
      {dot ? <span className="ui-badge__dot" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
