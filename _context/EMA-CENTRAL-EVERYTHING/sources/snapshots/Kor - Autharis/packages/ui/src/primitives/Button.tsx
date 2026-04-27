import * as React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

type OwnProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children?: React.ReactNode;
};

type PolymorphicProps<E extends React.ElementType> = OwnProps & {
  as?: E;
} & Omit<React.ComponentPropsWithoutRef<E>, keyof OwnProps | 'as'>;

export type ButtonProps<E extends React.ElementType = 'button'> =
  PolymorphicProps<E>;

export function Button<E extends React.ElementType = 'button'>({
  as,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: ButtonProps<E>) {
  const Component = (as ?? 'button') as React.ElementType;
  const classes = [
    'ui-btn',
    `ui-btn--${variant}`,
    `ui-btn--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const extra: Record<string, unknown> = {};
  if (Component === 'button' && (rest as { type?: string }).type === undefined) {
    extra.type = 'button';
  }

  return (
    <Component className={classes} {...extra} {...rest}>
      {children}
    </Component>
  );
}
