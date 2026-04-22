"use client";

import { useState, useRef, useEffect } from "react";
import { X, FolderOpen, ChevronDown } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import type { ProviderName } from "@claudeforge/shared";
import { api } from "@/lib/api";

export function OpenLocationDialog({ onClose }: { onClose: () => void }) {
  const [directory, setDirectory] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [provider, setProvider] = useState<ProviderName>("claude");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const trapRef = useFocusTrap(true);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = directory.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setError("");
    try {
      await api.openProject(trimmed, sessionName.trim() || undefined, provider);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open location");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Open location"
      ref={trapRef}
    >
      <div className="bg-surface-elevated border border-border rounded-xl w-full max-w-md mx-4 shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2 text-text-primary font-semibold">
            <FolderOpen size={18} strokeWidth={1.5} />
            Open Location
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Directory */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Directory
            </label>
            <input
              ref={inputRef}
              type="text"
              value={directory}
              onChange={(e) => setDirectory(e.target.value)}
              placeholder="~/Desktop/Coding/my-project"
              className="w-full px-3 py-2 text-sm bg-input border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25 transition-colors"
            />
          </div>

          {/* Session name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Session Name
              <span className="ml-1 text-text-muted font-normal normal-case tracking-normal">
                (optional)
              </span>
            </label>
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="main"
              className="w-full px-3 py-2 text-sm bg-input border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25 transition-colors"
            />
          </div>

          {/* Provider */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Provider
            </label>
            <div className="relative">
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as ProviderName)}
                className="w-full px-3 py-2 text-sm bg-input border border-border rounded-lg text-text-primary appearance-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25 transition-colors"
              >
                <option value="claude">Claude</option>
                <option value="codex">Codex</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-error">{error}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary rounded-lg hover:bg-primary/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!directory.trim() || submitting}
              className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Opening..." : "Open"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
