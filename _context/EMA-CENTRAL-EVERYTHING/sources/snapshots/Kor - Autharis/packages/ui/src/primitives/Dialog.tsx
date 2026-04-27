'use client';

import * as React from 'react';

export type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labelledBy?: string;
  describedBy?: string;
  ariaLabel?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  children?: React.ReactNode;
};

const FOCUSABLE =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

export function Dialog({
  open,
  onOpenChange,
  labelledBy,
  describedBy,
  ariaLabel,
  closeOnBackdrop = true,
  closeOnEscape = true,
  className = '',
  children,
}: DialogProps) {
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const previouslyFocused = React.useRef<HTMLElement | null>(null);

  // Focus trap + Esc
  React.useEffect(() => {
    if (!open) return;

    previouslyFocused.current =
      (typeof document !== 'undefined'
        ? (document.activeElement as HTMLElement | null)
        : null) ?? null;

    const panel = panelRef.current;
    if (panel) {
      const firstFocusable = panel.querySelector<HTMLElement>(FOCUSABLE);
      (firstFocusable ?? panel).focus();
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        event.stopPropagation();
        onOpenChange(false);
        return;
      }
      if (event.key !== 'Tab' || !panel) return;

      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => !el.hasAttribute('disabled'));
      if (focusables.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first || !panel.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      const prev = previouslyFocused.current;
      if (prev && typeof prev.focus === 'function') {
        prev.focus();
      }
    };
  }, [open, closeOnEscape, onOpenChange]);

  if (!open) return null;

  const handleBackdropMouseDown = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (!closeOnBackdrop) return;
    if (event.target === event.currentTarget) {
      onOpenChange(false);
    }
  };

  return (
    <div
      className="ui-dialog__backdrop"
      onMouseDown={handleBackdropMouseDown}
      data-open={open}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        aria-label={ariaLabel}
        tabIndex={-1}
        className={['ui-dialog__panel', className].filter(Boolean).join(' ')}
      >
        {children}
      </div>
    </div>
  );
}
