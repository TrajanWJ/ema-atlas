"use client";

import { useEffect, type ReactNode } from "react";
import { useThemeStore } from "@/stores/theme-store";

/**
 * ThemeProvider — initializes theme on mount (applies data-theme + accent to DOM).
 * Also listens for system color-scheme changes when theme === "system".
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useThemeStore((s) => s.theme);
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const accentColor = useThemeStore((s) => s.accentColor);
  const setTheme = useThemeStore((s) => s.setTheme);

  // Apply theme to DOM on mount and when it changes
  useEffect(() => {
    const doc = document.documentElement;
    doc.setAttribute("data-theme", resolvedTheme);
    doc.classList.toggle("dark", resolvedTheme === "dark");
    doc.classList.toggle("light", resolvedTheme === "light");
  }, [resolvedTheme]);

  // Apply accent color on mount
  useEffect(() => {
    const doc = document.documentElement;
    doc.style.setProperty("--color-primary", accentColor);
  }, [accentColor]);

  // Listen for system color scheme changes
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme, setTheme]);

  return <>{children}</>;
}

/**
 * useTheme — backward-compatible hook.
 * Returns { theme, toggle } matching the old Context API.
 */
export function useTheme() {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  return { theme: resolvedTheme, toggle: toggleTheme };
}
