"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  LayoutGrid,
  Bot,
  Monitor,
  Settings,
  Bell,
  Wifi,
  WifiOff,
  Menu,
  Columns2,
  Moon,
  Sun,
  BarChart3,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useSessionStore } from "@/stores/session-store";

const NAV_ITEMS = [
  { href: "/", label: "Sessions", icon: MessageSquare },
  { href: "/tasks", label: "Tasks", icon: LayoutGrid },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/system", label: "System", icon: Monitor },
];

export function TopNav({
  connected,
  onToggleSidebar,
  splitView,
  onToggleSplit,
}: {
  connected: boolean;
  onToggleSidebar: () => void;
  splitView?: boolean;
  onToggleSplit?: () => void;
}) {
  const pathname = usePathname();
  const { theme, toggle: toggleTheme } = useTheme();
  const activeSessions = useSessionStore(
    (s) => s.sessions.filter((sess) => sess.status === "active").length,
  );

  return (
    <header className="h-12 bg-surface border-b border-border flex items-center justify-between px-4 shrink-0">
      <nav aria-label="Main navigation" className="flex items-center gap-1">
        {/* Hamburger — mobile only */}
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="md:hidden text-text-secondary hover:text-text-primary transition-colors mr-2"
        >
          <Menu size={20} strokeWidth={1.5} />
        </button>

        {/* Branding */}
        <span className="text-primary font-semibold text-sm mr-3 hidden md:inline">
          ClaudeForge
        </span>

        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-text-secondary hover:text-text-primary hover:bg-primary/5"
              }`}
            >
              <item.icon size={18} strokeWidth={1.5} />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        {/* Active session count */}
        {activeSessions > 0 && (
          <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded-full">
            {activeSessions} active
          </span>
        )}

        <div
          role="status"
          aria-label={connected ? "Connected to server" : "Disconnected from server"}
          className={`flex items-center gap-1.5 text-xs ${
            connected ? "text-success" : "text-error"
          }`}
        >
          {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span className="hidden sm:inline">
            {connected ? "Connected" : "Disconnected"}
          </span>
        </div>
        {onToggleSplit && (
          <button
            onClick={onToggleSplit}
            aria-label={splitView ? "Disable split view" : "Enable split view"}
            aria-pressed={splitView}
            className={`p-1.5 rounded transition-colors ${
              splitView
                ? "text-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Columns2 size={18} strokeWidth={1.5} />
          </button>
        )}
        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          className="p-1.5 rounded text-text-secondary hover:text-text-primary transition-colors"
        >
          {theme === "dark" ? (
            <Sun size={18} strokeWidth={1.5} />
          ) : (
            <Moon size={18} strokeWidth={1.5} />
          )}
        </button>
        <button aria-label="Notifications" className="p-1.5 rounded text-text-secondary hover:text-text-primary transition-colors">
          <Bell size={18} strokeWidth={1.5} />
        </button>
        <Link
          href="/settings"
          aria-label="Settings"
          className="p-1.5 rounded text-text-secondary hover:text-text-primary transition-colors"
        >
          <Settings size={18} strokeWidth={1.5} />
        </Link>
      </div>
    </header>
  );
}
