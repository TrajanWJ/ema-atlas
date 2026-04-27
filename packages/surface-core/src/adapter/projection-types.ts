/**
 * Adapter layer — projection shapes.
 *
 * These are the TypeScript surface of daemon projections defined in
 * `packages/contracts/ipc/shell-protocol.md`. Any surface (web, desktop,
 * future-terminal) imports from here rather than redefining shapes.
 *
 * When a projection is not yet implemented in the daemon, its shape lives
 * here with a `// pending daemon writer` marker so the adapter is the
 * single list of what Surface lane expects Runtime lane to deliver.
 */

// ----------------------------------------------------------------------------
// topbar — org/space/project scope + node state
// Mirrors `packages/contracts/ipc/shell-protocol.md` TopbarProjection
// verbatim. Arrays + nullable current_* fields are the daemon contract;
// components project a narrower view-shape via `use-topbar`.
// ----------------------------------------------------------------------------

export type NodeState =
  | "home_current"
  | "replica_current"
  | "replica_provisional"
  | "replica_stale";

export type TopbarUser = { id: string; display_name: string };
export type TopbarOrg = { id: string; name: string };
export type TopbarSpace = { id: string; org_id: string; name: string };
export type TopbarProject = { id: string; space_id: string; name: string };
export type TopbarMembership = {
  user_id: string;
  role: string;
  status: string;
};

export type TopbarProjection = {
  user: TopbarUser;
  orgs: TopbarOrg[];
  current_org?: TopbarOrg;
  spaces: TopbarSpace[];
  current_space?: TopbarSpace;
  projects: TopbarProject[];
  current_project?: TopbarProject;
  memberships: TopbarMembership[];
  node_state: NodeState;
};

// ----------------------------------------------------------------------------
// blueprint.sections
// ----------------------------------------------------------------------------

export type BlueprintSection = {
  id: string;
  title: string;
  kind: "intent" | "canon" | "draft";
  body_md: string;
  updated_at: string;
};

export type BlueprintSectionsProjection = {
  project_id: string;
  sections: BlueprintSection[];
};

// ----------------------------------------------------------------------------
// see_agent_work.project_pulse
// ----------------------------------------------------------------------------

export type LaneState = "running" | "paused" | "stopped" | "blocked";

export type AgentWorkLane = {
  id: string;
  name: string;
  state: LaneState;
  current_item_id: string | null;
};

export type AgentWorkHandoff = {
  id: string;
  from_lane: string;
  to_lane: string;
  title: string;
  state: "open" | "accepted" | "rejected";
  opened_at: string;
};

export type SeeAgentWorkProjection = {
  project_id: string;
  lanes: AgentWorkLane[];
  handoffs: AgentWorkHandoff[];
  recent_events: Array<{ id: string; type: string; at: string; actor: string | null }>;
  cli_suggestions: Array<{ label: string; cli: string }>;
};

// ----------------------------------------------------------------------------
// git_ema.* connector + attachment projections
// ----------------------------------------------------------------------------

export type Connector = {
  id: string;
  kind: "github" | "gitlab" | "linear" | "notion" | "slack" | string;
  label: string;
  status: "connected" | "error" | "disconnected";
  last_sync_at: string | null;
};

export type UserConnectorsProjection = {
  user_id: string;
  connectors: Connector[];
};

export type Attachment = {
  id: string;
  title: string;
  kind: string;
  source: string;
  created_at: string;
};

export type AttachmentsProjection = {
  scope: "user" | "project";
  scope_id: string;
  attachments: Attachment[];
};

// ----------------------------------------------------------------------------
// pending daemon writer — shapes referenced by the shell but not yet
// delivered by the daemon. Naming them here makes the Runtime handoff
// explicit.
// ----------------------------------------------------------------------------

// pending daemon writer: hq.pulse (Wave 4 handoff)
export type HqPulseProjection = {
  project_id: string;
  pulse: Array<{ label: string; value: string; detail?: string }>;
  controls: Array<{
    label: string;
    state: "ok" | "warn" | "blocked";
    detail?: string;
    command?: string;
  }>;
  hubLinks: Array<{ label: string; surface: string; route?: string }>;
};

// pending daemon writer: desktop.wallpaper (Wave 6 handoff)
export type WallpaperProjection = {
  project_id: string;
  wallpaper_key: string;
};

// pending daemon writer: desktop.presence (deferred collab-plane)
export type PresenceProjection = {
  project_id: string;
  cursors: Array<{ actor_id: string; x: number; y: number; color: string }>;
  window_outlines: Array<{ actor_id: string; window_id: string; color: string }>;
};

// ----------------------------------------------------------------------------
// Typed name → shape lookup. A single source of truth for `useProjection`
// callers who want end-to-end types. New projections are added here first.
// ----------------------------------------------------------------------------

export type ProjectionMap = {
  topbar: TopbarProjection;
  "blueprint.sections": BlueprintSectionsProjection;
  "see_agent_work.project_pulse": SeeAgentWorkProjection;
  "git_ema.user_connectors": UserConnectorsProjection;
  "git_ema.user_attachments": AttachmentsProjection;
  "git_ema.project_attachments": AttachmentsProjection;
  "hq.pulse": HqPulseProjection;
  "desktop.wallpaper": WallpaperProjection;
  "desktop.presence": PresenceProjection;
};

export type ProjectionName = keyof ProjectionMap;
