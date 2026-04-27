/**
 * Bridge for donor's `getApp(appId)` / `getAllApps()`.
 *
 * Donor code expects a registry keyed by AppId that returns `{ icon,
 * name, description, ... }`. Here we source the registry from EMA's
 * `surfaceLinks` plus a Settings entry.
 */

import type { ReactNode } from "react";
import { createElement } from "react";
import type { AppId } from "../types/window";
import { APP_LABELS } from "./constants";
import {
  HomeIcon,
  BrainIcon,
  JournalIcon,
  TargetIcon,
  ChartIcon,
  DocumentIcon,
  NotesIcon,
  SettingsIcon,
} from "../icons";

export type App = {
  readonly id: AppId;
  readonly icon: ReactNode;
  readonly name: string;
  readonly description: string;
  readonly keywords: readonly string[];
};

export type SearchResult = App & { readonly score: number };

const APP_TABLE: Record<AppId, Omit<App, "id">> = {
  launchpad: {
    icon: createElement(HomeIcon, { size: 20 }),
    name: APP_LABELS.launchpad,
    description: "Start surface — project selector + quick-open.",
    keywords: ["home", "start", "launch", "open"],
  },
  braindump: {
    icon: createElement(BrainIcon, { size: 20 }),
    name: APP_LABELS.braindump,
    description: "Intent capture — loose notes that seed later artifacts.",
    keywords: ["brain", "dump", "notes", "capture", "intent"],
  },
  hq: {
    icon: createElement(ChartIcon, { size: 20 }),
    name: APP_LABELS.hq,
    description: "Project pulse, controls, hub links.",
    keywords: ["headquarters", "dashboard", "pulse", "status"],
  },
  blueprint: {
    icon: createElement(DocumentIcon, { size: 20 }),
    name: APP_LABELS.blueprint,
    description: "Project blueprint — intent and canon sections.",
    keywords: ["spec", "plan", "doc", "intent", "canon"],
  },
  "git-ema": {
    icon: createElement(BrainIcon, { size: 20 }),
    name: APP_LABELS["git-ema"],
    description: "Connectors + attachments, user and project scope.",
    keywords: ["git", "connector", "attachment", "repo"],
  },
  "agent-work": {
    icon: createElement(TargetIcon, { size: 20 }),
    name: APP_LABELS["agent-work"],
    description: "Live view of lanes, handoffs, missions.",
    keywords: ["lanes", "handoffs", "missions", "swarm", "agents"],
  },
  wiki: {
    icon: createElement(NotesIcon, { size: 20 }),
    name: APP_LABELS.wiki,
    description: "Project wiki and doctrine staging surface.",
    keywords: ["wiki", "notes", "docs"],
  },
  threads: {
    icon: createElement(JournalIcon, { size: 20 }),
    name: APP_LABELS.threads,
    description: "Conversation threads and coordination staging surface.",
    keywords: ["chat", "threads", "conversation"],
  },
  settings: {
    icon: createElement(SettingsIcon, { size: 20 }),
    name: APP_LABELS.settings,
    description: "Local settings, accent, data management.",
    keywords: ["settings", "prefs", "preferences", "config"],
  },
};

export function getApp(appId: AppId): App | null {
  const entry = APP_TABLE[appId];
  if (!entry) return null;
  return { id: appId, ...entry };
}

export function getAllApps(): readonly App[] {
  return (Object.keys(APP_TABLE) as AppId[]).map((id) => ({ id, ...APP_TABLE[id] }));
}
