"use client";

import { useEffect, useRef } from "react";
import { useSessionStore } from "@/stores/session-store";

const STORAGE_KEY = "claudeforge:ui-state";
const SAVE_INTERVAL = 30_000; // 30 seconds

interface SavedUIState {
  activeSessionId: string | null;
  inputDraft: string;
  scrollPosition: number;
  savedAt: number;
}

function getInputDraft(): string {
  const textarea = document.querySelector<HTMLTextAreaElement>("textarea[placeholder]");
  return textarea?.value ?? "";
}

function getScrollPosition(): number {
  const scrollEl = document.querySelector("[class*='overflow-y-auto']");
  return scrollEl?.scrollTop ?? 0;
}

function saveState(activeSessionId: string | null): void {
  const state: SavedUIState = {
    activeSessionId,
    inputDraft: getInputDraft(),
    scrollPosition: getScrollPosition(),
    savedAt: Date.now(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage full or unavailable — ignore
  }
}

export function restoreState(): SavedUIState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as SavedUIState;
    // Ignore state older than 24 hours
    if (Date.now() - state.savedAt > 86_400_000) return null;
    return state;
  } catch {
    return null;
  }
}

export function useAutoSave(): void {
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const setActiveSession = useSessionStore((s) => s.setActiveSession);
  const restoredRef = useRef(false);

  // Restore on mount (once)
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    const saved = restoreState();
    if (!saved) return;

    if (saved.activeSessionId) {
      setActiveSession(saved.activeSessionId);
    }

    // Restore input draft after a short delay (DOM needs to render)
    if (saved.inputDraft) {
      setTimeout(() => {
        const textarea = document.querySelector<HTMLTextAreaElement>("textarea[placeholder]");
        if (textarea) {
          textarea.value = saved.inputDraft;
          // Trigger React's onChange
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            HTMLTextAreaElement.prototype,
            "value",
          )?.set;
          nativeInputValueSetter?.call(textarea, saved.inputDraft);
          textarea.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }, 500);
    }
  }, [setActiveSession]);

  // Auto-save every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      saveState(activeSessionId);
    }, SAVE_INTERVAL);

    // Also save on page unload
    const handleUnload = () => saveState(activeSessionId);
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [activeSessionId]);
}
