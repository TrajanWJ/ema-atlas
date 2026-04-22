"use client";

import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useToastStore } from "@/components/ui/Toast";
import {
  Settings,
  Save,
  Server,
  Palette,
  Bell,
  Clock,
  Check,
} from "lucide-react";
import { useThemeStore, ACCENT_PRESETS, type AccentPreset, type Theme } from "@/stores/theme-store";

const STORAGE_KEY = "claudeforge-settings";

interface SettingsData {
  serverUrl: string;
  defaultProvider: "claude" | "codex";

  notifications: {
    sessionEvents: boolean;
    taskEvents: boolean;
    errorEvents: boolean;
    systemHealth: boolean;
  };
  sessionDefaults: {
    idleTimeoutMinutes: number;
    autoResume: boolean;
  };
}

const DEFAULT_SETTINGS: SettingsData = {
  serverUrl: "http://localhost:3001",
  defaultProvider: "claude",

  notifications: {
    sessionEvents: true,
    taskEvents: true,
    errorEvents: true,
    systemHealth: false,
  },
  sessionDefaults: {
    idleTimeoutMinutes: 30,
    autoResume: true,
  },
};

function loadSettings(): SettingsData {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

const inputClasses =
  "w-full px-3 py-2 text-sm bg-input border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25 transition-colors";

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-sm font-medium text-text-primary">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

const PRESET_LABELS: Record<AccentPreset, string> = {
  iris: "Iris Purple",
  gold: "Warm Gold",
  blue: "Ocean Blue",
  green: "Emerald",
  rose: "Rose",
  teal: "Teal",
};

function ThemeSection() {
  const theme = useThemeStore((s) => s.theme);
  const accentPreset = useThemeStore((s) => s.accentPreset);
  const accentColor = useThemeStore((s) => s.accentColor);
  const setTheme = useThemeStore((s) => s.setTheme);
  const setAccentPreset = useThemeStore((s) => s.setAccentPreset);
  const setAccentColor = useThemeStore((s) => s.setAccentColor);
  const [customHex, setCustomHex] = useState(accentColor);

  return (
    <SectionCard
      icon={<Palette size={16} strokeWidth={1.5} className="text-text-secondary" />}
      title="Theme"
    >
      {/* Appearance */}
      <div>
        <label className="block text-xs text-text-muted mb-1.5">Appearance</label>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as Theme)}
          className={inputClasses}
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="system">System</option>
        </select>
      </div>

      {/* Accent Color */}
      <div>
        <label className="block text-xs text-text-muted mb-2">Accent Color</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {(Object.keys(ACCENT_PRESETS) as AccentPreset[]).map((preset) => (
            <button
              key={preset}
              onClick={() => {
                setAccentPreset(preset);
                setCustomHex(ACCENT_PRESETS[preset]);
              }}
              title={PRESET_LABELS[preset]}
              className={`relative w-8 h-8 rounded-full border-2 transition-all ${
                accentPreset === preset
                  ? "border-text-primary scale-110"
                  : "border-transparent hover:border-border"
              }`}
              style={{ backgroundColor: ACCENT_PRESETS[preset] }}
            >
              {accentPreset === preset && (
                <Check
                  size={14}
                  strokeWidth={2.5}
                  className="absolute inset-0 m-auto text-white drop-shadow-sm"
                />
              )}
            </button>
          ))}
        </div>

        {/* Custom hex input */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg border border-border shrink-0"
            style={{ backgroundColor: accentColor }}
          />
          <input
            type="text"
            value={customHex}
            onChange={(e) => {
              setCustomHex(e.target.value);
              if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                setAccentColor(e.target.value);
              }
            }}
            placeholder="#7B61FF"
            maxLength={7}
            className={`${inputClasses} font-mono max-w-[120px]`}
          />
          <span className="text-xs text-text-muted">Custom hex</span>
        </div>
      </div>
    </SectionCard>
  );
}

function SettingsContent() {
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const updateSettings = useCallback(
    (updater: (prev: SettingsData) => SettingsData) => {
      setSettings((prev) => updater(prev));
    },
    [],
  );

  const handleSave = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      addToast("success", "Settings saved successfully");
    } catch {
      addToast("error", "Failed to save settings");
    }
  }, [settings, addToast]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings size={20} strokeWidth={1.5} className="text-primary" />
          <h1 className="text-lg font-semibold text-text-primary">Settings</h1>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
        >
          <Save size={16} strokeWidth={1.5} />
          Save Changes
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Server URL */}
          <SectionCard
            icon={
              <Server
                size={16}
                strokeWidth={1.5}
                className="text-text-secondary"
              />
            }
            title="Server Connection"
          >
            <div>
              <label className="block text-xs text-text-muted mb-1.5">
                Server URL
              </label>
              <input
                type="text"
                value={settings.serverUrl}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    serverUrl: e.target.value,
                  }))
                }
                placeholder="http://localhost:3001"
                className={inputClasses}
              />
              <p className="text-xs text-text-muted mt-1.5">
                The URL of the ClaudeForge server instance
              </p>
            </div>
          </SectionCard>

          {/* Default Provider */}
          <SectionCard
            icon={
              <Server
                size={16}
                strokeWidth={1.5}
                className="text-text-secondary"
              />
            }
            title="Default Provider"
          >
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="provider"
                  value="claude"
                  checked={settings.defaultProvider === "claude"}
                  onChange={() =>
                    updateSettings((prev) => ({
                      ...prev,
                      defaultProvider: "claude",
                    }))
                  }
                  className="accent-primary"
                />
                <span className="text-sm text-text-primary">Claude</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="provider"
                  value="codex"
                  checked={settings.defaultProvider === "codex"}
                  onChange={() =>
                    updateSettings((prev) => ({
                      ...prev,
                      defaultProvider: "codex",
                    }))
                  }
                  className="accent-primary"
                />
                <span className="text-sm text-text-primary">Codex</span>
              </label>
            </div>
          </SectionCard>

          {/* Theme */}
          <ThemeSection />

          {/* Notifications */}
          <SectionCard
            icon={
              <Bell
                size={16}
                strokeWidth={1.5}
                className="text-text-secondary"
              />
            }
            title="Notifications"
          >
            <div className="space-y-3">
              {(
                [
                  ["sessionEvents", "Session Events"],
                  ["taskEvents", "Task Events"],
                  ["errorEvents", "Error Events"],
                  ["systemHealth", "System Health"],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={settings.notifications[key]}
                    onChange={(e) =>
                      updateSettings((prev) => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          [key]: e.target.checked,
                        },
                      }))
                    }
                    className="accent-primary w-4 h-4"
                  />
                  <span className="text-sm text-text-primary">{label}</span>
                </label>
              ))}
            </div>
          </SectionCard>

          {/* Session Defaults */}
          <SectionCard
            icon={
              <Clock
                size={16}
                strokeWidth={1.5}
                className="text-text-secondary"
              />
            }
            title="Session Defaults"
          >
            <div>
              <label className="block text-xs text-text-muted mb-1.5">
                Idle Timeout (minutes)
              </label>
              <input
                type="number"
                min={1}
                max={480}
                value={settings.sessionDefaults.idleTimeoutMinutes}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    sessionDefaults: {
                      ...prev.sessionDefaults,
                      idleTimeoutMinutes:
                        Number(e.target.value) || 30,
                    },
                  }))
                }
                className={inputClasses}
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.sessionDefaults.autoResume}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    sessionDefaults: {
                      ...prev.sessionDefaults,
                      autoResume: e.target.checked,
                    },
                  }))
                }
                className="accent-primary w-4 h-4"
              />
              <div>
                <span className="text-sm text-text-primary">Auto-Resume</span>
                <p className="text-xs text-text-muted">
                  Automatically resume sessions after reconnection
                </p>
              </div>
            </label>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Layout>
      <ErrorBoundary>
        <SettingsContent />
      </ErrorBoundary>
    </Layout>
  );
}
