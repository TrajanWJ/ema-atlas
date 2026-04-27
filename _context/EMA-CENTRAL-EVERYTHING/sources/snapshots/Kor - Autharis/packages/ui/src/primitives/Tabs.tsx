'use client';

import * as React from 'react';

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
  baseId: string;
  registerTrigger: (value: string, el: HTMLButtonElement | null) => void;
  triggerOrder: React.MutableRefObject<string[]>;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext(component: string): TabsContextValue {
  const ctx = React.useContext(TabsContext);
  if (!ctx) {
    throw new Error(`<${component}> must be rendered inside <Tabs>.`);
  }
  return ctx;
}

export type TabsProps = {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  children?: React.ReactNode;
};

export type TabsListProps = React.HTMLAttributes<HTMLDivElement> & {
  ariaLabel: string;
};

export type TabsTriggerProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'value'
> & {
  value: string;
};

export type TabsPanelProps = React.HTMLAttributes<HTMLDivElement> & {
  value: string;
};

function TabsRoot({ value, onValueChange, className = '', children }: TabsProps) {
  const baseId = React.useId();
  const triggerRefs = React.useRef<Map<string, HTMLButtonElement | null>>(
    new Map(),
  );
  const triggerOrder = React.useRef<string[]>([]);

  const registerTrigger = React.useCallback(
    (val: string, el: HTMLButtonElement | null) => {
      if (el === null) {
        triggerRefs.current.delete(val);
        triggerOrder.current = triggerOrder.current.filter((v) => v !== val);
        return;
      }
      triggerRefs.current.set(val, el);
      if (!triggerOrder.current.includes(val)) {
        triggerOrder.current.push(val);
      }
    },
    [],
  );

  const ctx = React.useMemo<TabsContextValue>(
    () => ({
      value,
      setValue: onValueChange,
      baseId,
      registerTrigger,
      triggerOrder,
    }),
    [value, onValueChange, baseId, registerTrigger],
  );

  return (
    <TabsContext.Provider value={ctx}>
      <div className={['ui-tabs', className].filter(Boolean).join(' ')}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

function TabsList({ ariaLabel, className = '', children, ...rest }: TabsListProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={['ui-tabs__list', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}

function TabsTrigger({
  value,
  className = '',
  children,
  onKeyDown,
  onClick,
  disabled,
  ...rest
}: TabsTriggerProps) {
  const ctx = useTabsContext('Tabs.Trigger');
  const selected = ctx.value === value;
  const ref = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    ctx.registerTrigger(value, ref.current);
    return () => ctx.registerTrigger(value, null);
  }, [ctx, value]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    const order = ctx.triggerOrder.current;
    const idx = order.indexOf(value);
    if (idx === -1) return;

    let nextValue: string | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      nextValue = order[(idx + 1) % order.length] ?? null;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      nextValue = order[(idx - 1 + order.length) % order.length] ?? null;
    } else if (event.key === 'Home') {
      event.preventDefault();
      nextValue = order[0] ?? null;
    } else if (event.key === 'End') {
      event.preventDefault();
      nextValue = order[order.length - 1] ?? null;
    }

    if (nextValue) {
      ctx.setValue(nextValue);
    }
  };

  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      id={`${ctx.baseId}-trigger-${value}`}
      aria-controls={`${ctx.baseId}-panel-${value}`}
      aria-selected={selected}
      data-active={selected}
      tabIndex={selected ? 0 : -1}
      disabled={disabled}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) ctx.setValue(value);
      }}
      onKeyDown={handleKeyDown}
      className={['ui-tabs__trigger', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}

function TabsPanel({
  value,
  className = '',
  children,
  ...rest
}: TabsPanelProps) {
  const ctx = useTabsContext('Tabs.Panel');
  const active = ctx.value === value;
  return (
    <div
      role="tabpanel"
      id={`${ctx.baseId}-panel-${value}`}
      aria-labelledby={`${ctx.baseId}-trigger-${value}`}
      hidden={!active}
      tabIndex={0}
      className={['ui-tabs__panel', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {active ? children : null}
    </div>
  );
}

type TabsComponent = React.FC<TabsProps> & {
  List: React.FC<TabsListProps>;
  Trigger: React.FC<TabsTriggerProps>;
  Panel: React.FC<TabsPanelProps>;
};

export const Tabs = TabsRoot as TabsComponent;
Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Panel = TabsPanel;
