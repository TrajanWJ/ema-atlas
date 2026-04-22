"use client";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ open, title, message, confirmLabel = "Confirm", confirmColor = "#EF4444", onConfirm, onCancel }: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-6"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)" }}
    >
      <div className="w-full max-w-sm rounded-2xl p-5 space-y-4"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          animation: "modal-pop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <h3 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>{title}</h3>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: "var(--color-surface-elevated)", color: "var(--color-text-secondary)" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: `${confirmColor}20`, color: confirmColor, border: `1px solid ${confirmColor}40` }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes modal-pop {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
