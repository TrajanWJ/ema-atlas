"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  MessageSquare,
  LayoutGrid,
  Bot,
  Monitor,
  Settings,
  Bell,
  Wifi,
  WifiOff,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Sessions", icon: MessageSquare },
  { href: "/tasks", label: "Tasks", icon: LayoutGrid },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/system", label: "System", icon: Monitor },
];

export function TopNav({ connected }: { connected: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="h-12 bg-surface border-b border-border flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-text-secondary hover:text-text-primary hover:bg-primary/5"
              }`}
            >
              <item.icon size={18} strokeWidth={1.5} />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-1.5 text-xs ${
            connected ? "text-success" : "text-error"
          }`}
        >
          {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
          {connected ? "Connected" : "Disconnected"}
        </div>
        <button className="text-text-secondary hover:text-text-primary transition-colors">
          <Bell size={18} strokeWidth={1.5} />
        </button>
        <button className="text-text-secondary hover:text-text-primary transition-colors">
          <Settings size={18} strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
}
