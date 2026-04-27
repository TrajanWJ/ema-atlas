/**
 * Bridge — zustand notification-store façade.
 *
 * HONEST-MOCK (pending daemon writer): notifications should stream from
 * the `project.<id>.all` event channel (Wave 6 handoff). Today the store
 * just collects locally-emitted events. Entry is in
 * place-reflection/honest-mock/registry.ts under the
 * `notification-store-bridge.ts` component path.
 */

import { create } from "zustand";
import { createId } from "../lib/id";

export type NotificationKind = "info" | "warn" | "error" | "success";

export interface Notification {
  readonly id: string;
  readonly kind: NotificationKind;
  readonly title: string;
  readonly body?: string;
  readonly at: number;
  readonly seen: boolean;
}

interface NotificationState {
  readonly notifications: readonly Notification[];
}

interface NotificationActions {
  push(kind: NotificationKind, title: string, body?: string): string;
  markSeen(id: string): void;
  markAllSeen(): void;
  clear(id: string): void;
  clearAll(): void;
}

type NotificationStore = NotificationState & NotificationActions;

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],

  push(kind, title, body) {
    const id = createId();
    const notification: Notification = {
      id,
      kind,
      title,
      body,
      at: Date.now(),
      seen: false,
    };
    set({ notifications: [notification, ...get().notifications] });
    return id;
  },

  markSeen(id) {
    set({
      notifications: get().notifications.map((n) =>
        n.id === id ? { ...n, seen: true } : n,
      ),
    });
  },

  markAllSeen() {
    set({
      notifications: get().notifications.map((n) => ({ ...n, seen: true })),
    });
  },

  clear(id) {
    set({ notifications: get().notifications.filter((n) => n.id !== id) });
  },

  clearAll() {
    set({ notifications: [] });
  },
}));
