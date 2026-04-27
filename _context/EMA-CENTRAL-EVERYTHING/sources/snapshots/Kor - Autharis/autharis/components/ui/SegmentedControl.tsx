'use client';

import * as React from 'react';

export type SegmentedOption<Value extends string> = {
  value: Value;
  label: React.ReactNode;
  disabled?: boolean;
};

export type SegmentedControlProps<Value extends string> = {
  ariaLabel: string;
  value: Value;
  options: readonly SegmentedOption<Value>[];
  onValueChange: (value: Value) => void;
  fullWidth?: boolean;
  className?: string;
};

export function SegmentedControl<Value extends string>({
  ariaLabel,
  value,
  options,
  onValueChange,
  fullWidth = false,
  className = '',
}: SegmentedControlProps<Value>) {
  const listStyle = fullWidth
    ? {
        display: 'grid',
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
        width: '100%',
      }
    : undefined;

  return (
    <div
      className={['segmented', className].filter(Boolean).join(' ')}
      role="tablist"
      aria-label={ariaLabel}
      style={listStyle}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          data-active={value === option.value}
          disabled={option.disabled}
          onClick={() => onValueChange(option.value)}
          style={
            fullWidth
              ? {
                  justifyContent: 'center',
                }
              : undefined
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

