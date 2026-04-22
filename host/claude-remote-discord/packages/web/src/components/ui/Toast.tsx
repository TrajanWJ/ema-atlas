"use client";

import { useEffect, useState, useCallback } from "react";
import { create } from "zustand";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  exiting?: boolean;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (type: ToastType, message: string) => void;
  removeToast: (id: string) => void;
  markExiting: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (type, message) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    set((state) => ({
      toasts: [...state.toasts, { id, type, message }],
    }));
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  markExiting: (id) =>
    set((state) => ({
      toasts: state.toasts.map((t) =>
        t.id === id ? { ...t, exiting: true } : t
      ),
    })),
}));

const TOAST_ICONS: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const TOAST_COLORS: Record<ToastType, string> = {
  success: "border-l-success text-success",
  error: "border-l-error text-error",
  info: "border-l-info text-info",
};

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast, markExiting } = useToastStore();
  const Icon = TOAST_ICONS[toast.type];
  const color = TOAST_COLORS[toast.type];

  useEffect(() => {
    const exitTimer = setTimeout(() => markExiting(toast.id), 4700);
    const removeTimer = setTimeout(() => removeToast(toast.id), 5000);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [toast.id]);

  return (
    <div
      className={`flex items-center gap-3 bg-surface-elevated border border-border border-l-[3px] ${color} rounded-lg px-4 py-3 shadow-lg min-w-[280px] max-w-[400px] ${
        toast.exiting ? "toast-exit" : "toast-enter"
      }`}
    >
      <Icon size={16} className="shrink-0" />
      <span className="text-sm text-text-primary flex-1">{toast.message}</span>
      <button
        onClick={() => removeToast(toast.id)}
        aria-label="Dismiss notification"
        className="text-text-muted hover:text-text-primary transition-colors shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div role="region" aria-label="Notifications" aria-live="polite" className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
