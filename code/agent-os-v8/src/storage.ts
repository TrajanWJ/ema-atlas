// ═══════════════════════════════════════════════════════════
// Agent OS v8 — Local Storage
// ═══════════════════════════════════════════════════════════
import type { Page } from "./types.ts";

export interface AppSettings {
  bridgeUrl: string;
  bridgeToken: string;
  lastPage: Page;
  sidebarOpen: boolean;
  theme: "mocha" | "latte";
}

const STORAGE_KEY = "agentOS_settings";

const defaults: AppSettings = {
  bridgeUrl: location.hostname === "localhost" ? "" : `http://${location.hostname}:18790`,
  bridgeToken: "",
  lastPage: "feed",
  sidebarOpen: true,
  theme: "mocha",
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  // Check for legacy bridge settings
  const legacyUrl = localStorage.getItem("bridge_url");
  const legacyToken = localStorage.getItem("bridge_token");
  if (legacyUrl || legacyToken) {
    return { ...defaults, bridgeUrl: legacyUrl || defaults.bridgeUrl, bridgeToken: legacyToken || "" };
  }
  return { ...defaults };
}

export function saveSettings(settings: Partial<AppSettings>): void {
  const current = loadSettings();
  const merged = { ...current, ...settings };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}
