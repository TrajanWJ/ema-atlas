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
export type TopbarInstall = {
  id: string;
  genesis_device_id: string;
  install_pubkey: string;
  display_name: string;
};
export type TopbarOrg = { id: string; name: string };
export type TopbarSpace = { id: string; org_id: string; name: string };
export type TopbarProject = { id: string; space_id: string; name: string };
export type TopbarMembership = {
  user_id: string;
  role: string;
  status: string;
};

export type TopbarProjection = {
  install?: TopbarInstall | null;
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

export type ChronicleEvent = {
  id: string;
  txid: number;
  kind: string;
  source: string;
  session_id: string;
  actor: string;
  org_id: string;
  space_id: string | null;
  project_id: string | null;
  ts: string;
  label: string;
};

export type ChronicleSession = {
  id: string;
  actor: string;
  org_id: string;
  space_id: string | null;
  project_id: string | null;
  started_at: string;
  last_event_at: string;
  event_count: number;
  latest_kind: string;
};

export type ChronicleSource = {
  source: string;
  event_count: number;
  latest_at: string;
};

export type ChronicleActivityProjection = {
  source: "daemon_events" | string;
  host_id: string;
  events: ChronicleEvent[];
  sessions: ChronicleSession[];
  sources: ChronicleSource[];
};

export type AccessSessionProjection = {
  challenges: Array<{
    challenge_id: string;
    org_id: string;
    access_point: string;
    user_code: string;
    scopes: string[];
    status: "open" | "approved" | "expired" | "revoked";
    expires_at: string;
  }>;
  sessions: Array<{
    session_id: string;
    challenge_id: string;
    org_id: string;
    user_id: string;
    approved_by_device: string;
    scopes: string[];
    status: "active" | "revoked" | "expired";
    expires_at: string;
  }>;
};

export type DeviceRegistryProjection = {
  devices: Array<{
    device_id: string;
    org_id: string;
    user_id: string;
    name: string;
    pubkey: string;
    bootstrap: "genesis" | "paired" | string;
    attested_by: string | null;
    capabilities: string[];
    status: "trusted" | "revoked" | string;
    updated_at: string;
  }>;
  machine_peer_ready: boolean;
  transport: "disabled" | "iroh" | "ssh" | string;
};

export type PeerTrustProjection = {
  peers: Array<{
    org_id: string;
    peer_device: string;
    peer_pubkey: string;
    local_pubkey: string;
    ceremony_kind: "qr_ble_hybrid" | "recovery_packet" | "genesis" | string;
    ceremony_id: string;
    status: "trusted" | "revoked" | string;
    established_at: string;
  }>;
  replication_enabled: boolean;
  transport: "disabled" | "iroh" | "ssh" | string;
};

export type InviteRegistryProjection = {
  invites: Array<{
    invite_id: string;
    org_id: string;
    target_kind: string;
    target_value: string;
    role: "owner" | "admin" | "member" | "guest" | string;
    status: "open" | "accepted" | "revoked" | "expired" | string;
    expires_at: string;
    updated_at: string;
  }>;
};

export type ProjectFilesystemProjection = {
  projects: Array<{
    project_id: string;
    space_id: string;
    org_id: string;
    name: string;
    local_path: string;
    status: "pending" | "materialized" | "materialization_failed" | string;
    reason: string;
  }>;
};

export type SpaceInstalledVAppsProjection = {
  org_id: string;
  space_id: string;
  source: string;
  apps: Array<{
    installation_id: string;
    vapp_id: string;
    slug: string;
    label: string;
    status: "live" | "projection" | "staged" | string;
    project_name: string;
    enabled: boolean;
    sort_order: number;
    config: Record<string, unknown>;
  }>;
};

export type LaneRegistryProjection = {
  source: "daemon_events" | string;
  lanes: Array<{
    id: string;
    lane_id: string;
    title: string;
    name: string;
    status: "idea" | "ready" | "active" | "review" | "blocked" | "done" | string;
    project_id: string | null;
    mission_id: string | null;
    scope: string | null;
    claim_scope: string | null;
    done_when: string | null;
    depends_on: string | null;
    opened_by: string | null;
    actor_id: string | null;
    goal: string | null;
    next: string | null;
    blocker: string | null;
    blocked_reason: string | null;
    opened_at: string | null;
    updated_at: string | null;
  }>;
};

export type QueueRegistryProjection = {
  source: "daemon_events" | string;
  queue_items: Array<{
    id: string;
    queue_item_id: string;
    title: string;
    why: string;
    status: "ready" | "blocked" | "closed" | string;
    project_id: string | null;
    mission_id: string | null;
    lane_id: string | null;
    done_when: string | null;
    depends_on: string | null;
    blocked_by: string | null;
    source: string | null;
    added_by: string | null;
    blocked_reason: string | null;
    result: string | null;
    added_at: string | null;
    updated_at: string | null;
  }>;
};

// ----------------------------------------------------------------------------
// cwt.shared_files — current-work-tracker-trajan integration bridge.
// This is file-backed today, not daemon-owned canonical state. The shape lets
// EMA surfaces inspect readiness and preview promotion without treating the
// local CWT SQLite store as EMA truth.
// ----------------------------------------------------------------------------

export type CwtSharedFilesProjection = {
  source: "cwt.shared_files" | string;
  status: "missing_projection" | "projection_found" | "stale" | "writer_pending" | string;
  root: string;
  generated_at: string | null;
  projection: "cwt-shared-files-v0" | string | null;
  counts: {
    projects?: number;
    lanes?: number;
    queue_items?: number;
    campaigns?: number;
    problems?: number;
    handoffs?: number;
    vcalendar_blocks?: number;
    executions?: number;
    responsibilities?: number;
    checkups?: number;
  };
  local_n_sync: {
    mode?: "file_projection" | string;
    namespace?: string;
    index?: string;
    current_state?: string;
  } | null;
  promotion_boundary: "preview_only" | "daemon_writer_ready" | string;
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

export type PresenceProjection = {
  source: "ema_presence" | string;
  authority: "daemon_ephemeral" | string;
  revision: number;
  mesh_ready: boolean;
  sessions: Array<{
    session_id: string;
    actor_id: string;
    display_name: string;
    color: string;
    org_id: string;
    space_id: string;
    room_id: string;
    status: "active" | "idle" | "disconnected" | string;
    last_seen_at: string;
  }>;
  actors: Array<{
    actor_id: string;
    display_name: string;
    color: string;
    kind: "human" | "agent" | string;
  }>;
  cursors: Array<{
    session_id: string;
    actor_id: string;
    display_name: string;
    color: string;
    org_id: string;
    space_id: string;
    room_id: string;
    x: number;
    y: number;
    surface: "desktop" | "window" | "app" | string;
    window_id: string | null;
    app_id: string | null;
    updated_at: string;
  }>;
  app_locations: Array<{
    session_id: string;
    actor_id: string;
    display_name: string;
    color: string;
    org_id: string;
    space_id: string;
    room_id: string;
    window_id: string | null;
    app_id: string;
    label: string;
    updated_at: string;
  }>;
  window_outlines: Array<{
    actor_id: string;
    display_name: string;
    window_id: string | null;
    app_id: string;
    color: string;
  }>;
};

// ----------------------------------------------------------------------------
// Typed name → shape lookup. A single source of truth for `useProjection`
// callers who want end-to-end types. New projections are added here first.
// ----------------------------------------------------------------------------

export type ProjectionMap = {
  topbar: TopbarProjection;
  "access_session.current": AccessSessionProjection;
  "device.registry": DeviceRegistryProjection;
  "peer.trust": PeerTrustProjection;
  "invite.registry": InviteRegistryProjection;
  "project.filesystem_status": ProjectFilesystemProjection;
  "space.installed_vapps": SpaceInstalledVAppsProjection;
  "lane.registry": LaneRegistryProjection;
  "queue.registry": QueueRegistryProjection;
  "cwt.shared_files": CwtSharedFilesProjection;
  "blueprint.sections": BlueprintSectionsProjection;
  "see_agent_work.project_pulse": SeeAgentWorkProjection;
  "git_ema.user_connectors": UserConnectorsProjection;
  "git_ema.user_attachments": AttachmentsProjection;
  "git_ema.project_attachments": AttachmentsProjection;
  "chronicle.activity": ChronicleActivityProjection;
  "hq.pulse": HqPulseProjection;
  "desktop.wallpaper": WallpaperProjection;
  "desktop.presence": PresenceProjection;
};

export type ProjectionName = keyof ProjectionMap;
