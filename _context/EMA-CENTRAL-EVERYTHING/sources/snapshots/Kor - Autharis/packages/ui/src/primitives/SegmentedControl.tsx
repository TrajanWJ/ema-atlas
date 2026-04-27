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
  const buttonsRef = React.useRef<Array<HTMLButtonElement | null>>([]);

  const enabledIndexes = React.useMemo(
    () => options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0),
    [options],
  );

  const focusByIndex = (idx: number) => {
    const btn = buttonsRef.current[idx];
    if (btn) btn.focus();
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    const pos = enabledIndexes.indexOf(currentIndex);
    if (pos === -1) return;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown': {
        event.preventDefault();
        const next = enabledIndexes[(pos + 1) % enabledIndexes.length]!;
        const opt = options[next]!;
        focusByIndex(next);
        onValueChange(opt.value);
        break;
      }
      case 'ArrowLeft':
      case 'ArrowUp': {
        event.preventDefault();
        const prev =
          enabledIndexes[(pos - 1 + enabledIndexes.length) % enabledIndexes.length]!;
        const opt = options[prev]!;
        focusByIndex(prev);
        onValueChange(opt.value);
        break;
      }
      case 'Home': {
        event.preventDefault();
        const first = enabledIndexes[0]!;
        const opt = options[first]!;
        focusByIndex(first);
        onValueChange(opt.value);
        break;
      }
      case 'End': {
        event.preventDefault();
        const last = enabledIndexes[enabledIndexes.length - 1]!;
        const opt = options[last]!;
        focusByIndex(last);
        onValueChange(opt.value);
        break;
      }
      default:
        break;
    }
  };

  const listStyle: React.CSSProperties | undefined = fullWidth
    ? {
        display: 'grid',
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
        width: '100%',
      }
    : undefined;

  return (
    <div
      className={['ui-segmented', className].filter(Boolean).join(' ')}
      role="tablist"
      aria-label={ariaLabel}
      style={listStyle}
    >
      {options.map((option, index) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              buttonsRef.current[index] = el;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            data-active={selected}
            tabIndex={selected ? 0 : -1}
            disabled={option.disabled}
            onClick={() => onValueChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className="ui-segmented__item"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
