"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  exiting?: boolean;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const COLORS: Record<ToastType, string> = {
  success: "#22C55E",
  error: "#EF4444",
  warning: "#EAB308",
  info: "#3B82F6",
};

const ICONS: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  warning: "⚠",
  info: "ℹ",
};

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = `toast-${++counter.current}`;
    setToasts(prev => [...prev, { id, message, type }]);
    // Start exit animation after 2.5s
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    }, 2500);
    // Remove after animation
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-20 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto px-4 py-3 rounded-xl flex items-center gap-3 max-w-sm w-full"
            style={{
              background: "rgba(20, 20, 25, 0.95)",
              backdropFilter: "blur(20px)",
              border: `1px solid ${COLORS[t.type]}40`,
              boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 10px ${COLORS[t.type]}20`,
              animation: t.exiting
                ? "toast-exit 0.3s ease-in forwards"
                : "toast-enter 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: `${COLORS[t.type]}25`, color: COLORS[t.type] }}
            >
              {ICONS[t.type]}
            </span>
            <span className="text-sm" style={{ color: "var(--color-text-primary)" }}>
              {t.message}
            </span>
          </div>
        ))}
      </div>
      <style jsx global>{`
        @keyframes toast-enter {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes toast-exit {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(20px); opacity: 0; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
