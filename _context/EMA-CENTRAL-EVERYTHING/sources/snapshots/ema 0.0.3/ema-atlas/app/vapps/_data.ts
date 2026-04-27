/**
 * Canonical vApp surface metadata.
 *
 * Source: 05-fresh-context-project-app-model.md (named app surfaces) +
 * GLOSSARY.md vApp / Launchpad / HQ / Virtual Desktop entries.
 *
 * Launchpad / HQ / Virtual Desktop are top-level *shells*, not vApps proper.
 * Both /vapps and /vapps/[slug] read from this array.
 */

export type VAppStatus = "planned" | "sketched" | "partial" | "shipped";
export type VAppGroup = "vapp" | "shell";

export type VAppEntry = {
  slug: string;
  name: string;
  group: VAppGroup;
  oneLiner: string;
  parts: string[];
  smallestSlice: string;
  status: VAppStatus;
};

export const vapps: VAppEntry[] = [
  {
    slug: "wiki",
    name: "Wiki",
    group: "vapp",
    oneLiner:
      "Semantic-layer surface — Google Docs + Discord + Wikipedia + Obsidian feel, with inline comment, edit, and prompt.",
    parts: ["Semantic Layer / Knowledge System", "Shared Workspace"],
    smallestSlice:
      "A read-only renderer over content/briefs/*.md and the GLOSSARY, with inline-prompt stubs that open Chat with the selection as context.",
    status: "planned",
  },
  {
    slug: "chat",
    name: "Chat",
    group: "vapp",
    oneLiner:
      "EMA-native interface to local and hosted models — what Claude.ai, Codex, and Hermes-CLI each are individually, combined and tenanted.",
    parts: ["Harness / Execution Fabric", "Authority / Control Plane"],
    smallestSlice:
      "Single-driver (hermes-native) chat with one tool, one provider, and a chronicle pane wired to the control-plane event log. Smallest end-to-end proof of the canonical rule.",
    status: "planned",
  },
  {
    slug: "threads-server",
    name: "Threads / Server",
    group: "vapp",
    oneLiner:
      "EMA-native replacement for Discord channels-and-threads, mirrored back to Discord by webhook during migration.",
    parts: ["Shared Workspace", "Identity / Org / Project / Space"],
    smallestSlice:
      "Single-channel, read-only mirror of one Discord channel rendered in the EMA shell with stable thread ids — wedge, not vApp.",
    status: "planned",
  },
  {
    slug: "agent-virtual-environment",
    name: "Agent Virtual Environment",
    group: "vapp",
    oneLiner:
      "The agent's life as a place: virtual calendar, weekly phases, queues, responsibilities, checkups, todos, notes.",
    parts: ["Coordination / Agent Environment", "Shared Workspace"],
    smallestSlice:
      "Read-only daily timeline view over the existing dispatch event log, scoped to one agent. Adds the calendar metaphor without owning state.",
    status: "planned",
  },
  {
    slug: "blueprint",
    name: "Blueprint",
    group: "vapp",
    oneLiner:
      "Karpathy-style knowledge structuring; integrates with Wiki and intent capture as a typed subgraph.",
    parts: ["Semantic Layer / Knowledge System"],
    smallestSlice:
      "Promote the existing /futures-board route into a typed three-futures-per-question blueprint canvas — degenerate today, real after the collab plane lands.",
    status: "planned",
  },
  {
    slug: "launchpad",
    name: "Launchpad",
    group: "shell",
    oneLiner:
      "Top-level shell — Windows-8 / Start-style launcher hosting vApps and useful info tiles.",
    parts: ["Shells / Surfaces"],
    smallestSlice:
      "Single-row tile grid with Chat, Threads-stub, Files-stub, plus a project switcher. Useful the moment two real vApps exist.",
    status: "planned",
  },
  {
    slug: "hq",
    name: "HQ",
    group: "shell",
    oneLiner:
      "Per-user, per-project dashboard. Personal HQ aggregates across all Projects/Orgs the user belongs to.",
    parts: ["Shells / Surfaces", "Identity / Org / Project / Space"],
    smallestSlice:
      "Personal HQ that shows running Hermes sessions across projects + GitHub PR status per project — two feeds, one user.",
    status: "planned",
  },
  {
    slug: "virtual-desktop",
    name: "Virtual Desktop",
    group: "shell",
    oneLiner:
      "Main interface metaphor inherited from place.org — accessible as native desktop app or website.",
    parts: ["Shells / Surfaces", "Mesh / Replication / Presence"],
    smallestSlice:
      "Single-window desktop that hosts Chat with a wallpaper and a dock. Costume around v0.0.3 Chat — but the right costume.",
    status: "planned",
  },
];

/**
 * Map a Part display name (as used on vApp cards) to its /parts/<slug> route.
 * Names match lib/ema-atlas.ts `parts[].title`.
 */
export const partSlugByName: Record<string, string> = {
  "Authority / Control Plane": "authority-control-plane",
  "Harness / Execution Fabric": "harness-execution",
  "Shared Workspace": "shared-workspace",
  "Coordination / Agent Environment": "coordination-environment",
  "Semantic Layer / Knowledge System": "semantic-layer",
  "Shells / Surfaces": "shells-surfaces",
  "Identity / Org / Project / Space": "identity-project-space",
  "Mesh / Replication / Presence": "mesh-replication",
};

export function statusLabel(s: VAppStatus): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
