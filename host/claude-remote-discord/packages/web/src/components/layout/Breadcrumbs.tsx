"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { useSessionStore } from "@/stores/session-store";

export function Breadcrumbs() {
  const pathname = usePathname();
  const { activeSessionId, sessions, projects } = useSessionStore();

  const crumbs: Array<{ label: string; href?: string }> = [
    { label: "Home", href: "/" },
  ];

  if (pathname === "/tasks") {
    crumbs.push({ label: "Tasks" });
  } else if (pathname === "/agents") {
    crumbs.push({ label: "Agents" });
  } else if (pathname === "/system") {
    crumbs.push({ label: "System" });
  } else if (pathname === "/analytics") {
    crumbs.push({ label: "Analytics" });
  } else if (pathname === "/settings") {
    crumbs.push({ label: "Settings" });
  } else if (pathname === "/" && activeSessionId) {
    const session = sessions.find((s) => s.id === activeSessionId);
    if (session) {
      const project = projects.find((p) => p.id === session.projectId);
      if (project) {
        crumbs.push({ label: project.name, href: "/" });
      }
      crumbs.push({ label: session.name });
    }
  }

  // Don't show breadcrumbs if just "Home"
  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="h-8 bg-surface/50 border-b border-border/50 px-4 flex items-center gap-1 text-xs text-text-muted shrink-0">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={12} className="text-text-muted/50" />}
          {i === 0 && <Home size={12} className="mr-0.5" />}
          {crumb.href && i < crumbs.length - 1 ? (
            <Link
              href={crumb.href}
              className="hover:text-text-primary transition-colors"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className={i === crumbs.length - 1 ? "text-text-secondary" : ""}>
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
