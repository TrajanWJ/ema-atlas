/**
 * Bridge — zustand widget-store façade.
 *
 * HONEST-MOCK (pending daemon writer): no `widget.*` event family exists
 * in packages/contracts/events/catalog.v0.md. This bridge stores widget
 * positions locally and presents the donor's expected surface, but the
 * data has no canonical source. Entry is in
 * place-reflection/honest-mock/registry.ts under the
 * `widget-store-bridge.ts` component path.
 */

import { create } from "zustand";
import { userKey } from "../lib/user-storage";

export type WidgetType = "clock" | "tasks" | "habits" | "weather";

export interface DesktopWidget {
  readonly id: string;
  readonly type: WidgetType;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

interface WidgetState {
  readonly widgets: readonly DesktopWidget[];
}

interface WidgetActions {
  add(widget: DesktopWidget): void;
  remove(id: string): void;
  move(id: string, x: number, y: number): void;
  resize(id: string, width: number, height: number): void;
  rehydrate(): void;
}

type WidgetStore = WidgetState & WidgetActions;

const STORAGE_KEY = "desktop-widgets-v1";

function loadWidgets(): readonly DesktopWidget[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(userKey(STORAGE_KEY));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as DesktopWidget[];
  } catch {
    return [];
  }
}

function persistWidgets(widgets: readonly DesktopWidget[]): void {
  try {
    localStorage.setItem(userKey(STORAGE_KEY), JSON.stringify(widgets));
  } catch {
    // silent drop
  }
}

export const useWidgetStore = create<WidgetStore>((set, get) => ({
  widgets: loadWidgets(),

  add(widget) {
    const next = [...get().widgets, widget];
    set({ widgets: next });
    persistWidgets(next);
  },

  remove(id) {
    const next = get().widgets.filter((w) => w.id !== id);
    set({ widgets: next });
    persistWidgets(next);
  },

  move(id, x, y) {
    const next = get().widgets.map((w) => (w.id === id ? { ...w, x, y } : w));
    set({ widgets: next });
    persistWidgets(next);
  },

  resize(id, width, height) {
    const next = get().widgets.map((w) =>
      w.id === id ? { ...w, width, height } : w,
    );
    set({ widgets: next });
    persistWidgets(next);
  },

  rehydrate() {
    set({ widgets: loadWidgets() });
  },
}));
