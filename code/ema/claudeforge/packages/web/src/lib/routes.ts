import type { LucideIcon } from "lucide-react";
import {
  MessageSquare,
  LayoutGrid,
  Bot,
  GitBranch,
  Rocket,
  Boxes,
  Search,
  Monitor,
} from "lucide-react";

export interface AppRouteItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description?: string;
}

export const PRIMARY_ROUTES: AppRouteItem[] = [
  { href: "/", label: "Sessions", icon: MessageSquare, description: "Live session console" },
  { href: "/tasks", label: "Tasks", icon: LayoutGrid, description: "My Work / Triage seed" },
  { href: "/agents", label: "Agents", icon: Bot, description: "Agent catalog seed" },
  { href: "/workstreams", label: "Workstreams", icon: GitBranch, description: "Authoritative work lanes" },
  { href: "/changes", label: "Changes", icon: Rocket, description: "Proposal and change control" },
  { href: "/executions", label: "Executions", icon: Boxes, description: "Runs, evidence, and verification" },
  { href: "/catalog", label: "Catalog", icon: Search, description: "Entity inventory and ownership" },
  { href: "/system", label: "System", icon: Monitor, description: "Host and platform health" },
];

export const SIDEBAR_SECONDARY_ROUTES: AppRouteItem[] = [
  { href: "/workstreams", label: "Workstreams", icon: GitBranch },
  { href: "/changes", label: "Changes", icon: Rocket },
  { href: "/executions", label: "Executions", icon: Boxes },
  { href: "/catalog", label: "Catalog", icon: Search },
  { href: "/tasks", label: "Tasks", icon: LayoutGrid },
  { href: "/system", label: "Command Center", icon: Monitor },
];
