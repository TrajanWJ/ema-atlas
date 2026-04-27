import * as React from 'react';

export type PillProps = React.HTMLAttributes<HTMLSpanElement> & {
  removable?: boolean;
  onRemove?: () => void;
  leading?: React.ReactNode;
  removeLabel?: string;
};

export function Pill({
  removable = false,
  onRemove,
  leading,
  removeLabel = 'Remove',
  className = '',
  children,
  ...rest
}: PillProps) {
  const classes = ['ui-pill', removable ? 'ui-pill--removable' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} {...rest}>
      {leading ? (
        <span className="ui-pill__leading" aria-hidden="true">
          {leading}
        </span>
      ) : null}
      <span className="ui-pill__label">{children}</span>
      {removable ? (
        <button
          type="button"
          className="ui-pill__remove"
          aria-label={removeLabel}
          onClick={(event) => {
            event.stopPropagation();
            onRemove?.();
          }}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>
      ) : null}
    </span>
  );
}
