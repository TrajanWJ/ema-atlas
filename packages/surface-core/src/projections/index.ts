/**
 * Typed projection shapes (v0).
 *
 * These mirror the projections daemon emits over IPC. Surfaces import
 * these types instead of redefining them.
 */

import type { SelectorState } from "../selectors";

export type TopbarProjection = SelectorState & {
  user: { id: string; display_name: string };
  memberships?: Array<{ user_id: string; role: string; status: string }>;
  node_state: "home_current" | "replica_current" | "replica_provisional" | "replica_stale";
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

export type GitEmaUserConnectorsProjection = {
  connectors: Array<{
    id: string;
    provider: "google_drive" | "github";
    status: "connected" | "disconnected";
    display_label: string;
    connected_at: string | null;
  }>;
};

export type GitEmaAttachmentsProjection = {
  attachments: Array<{
    id: string;
    kind: string;
    source: string;
    display_name: string;
    mime?: string;
    size_bytes?: number;
  }>;
};

export type BlueprintSectionsProjection = {
  documents: Array<{
    id: string;
    title: string;
    sections: Array<BlueprintSectionNode>;
  }>;
};

export type BlueprintSectionNode = {
  id: string;
  title: string;
  children?: BlueprintSectionNode[];
};

export type CollabDocumentTarget = { kind: "blueprint_section"; id: string };

export type CollabDocumentProjection = {
  target: CollabDocumentTarget;
  title?: string;
  text: string;
  revision: number;
  status: "opening" | "live" | "saving" | "offline";
  authority: "beam";
  updated_at?: string;
  presence: Array<{
    session_id: string;
    user_id?: string;
    display_name?: string;
    color?: string;
    cursor?: number;
    selection_start?: number;
    selection_end?: number;
    last_seen_at?: string;
  }>;
};

export type SeeAgentWorkProjection = {
  project_id: string;
  mocked: boolean;
  swarms: Array<{
    id: string;
    name: string;
    status: "mocked" | "active" | "paused" | "stopped";
    purpose: string;
  }>;
  campaigns: Array<{ id: string; title: string; status: string }>;
  missions: Array<{ id: string; title: string; campaign_id?: string; status: string }>;
  lanes: Array<{
    id: string;
    title: string;
    mission_id?: string;
    owner_actor_id?: string;
    status: "idea" | "ready" | "active" | "review" | "blocked" | "done";
    cli: string;
  }>;
  handoffs: Array<{ id: string; from: string; to: string; needed: string; status: string }>;
  vcalendar: {
    weekly_phase: string;
    blocks: Array<{ id: string; label: string; kind: string; actor_id?: string }>;
    checkups_due: Array<{ id: string; label: string; cadence: string }>;
  };
  actors: Array<{ id: string; display_name: string; kind: string; role: string; current_lane?: string }>;
  recent_events: Array<{ id: string; kind: string; label: string; ts: string }>;
  cli_suggestions: string[];
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

export type ProjectFilesystemProjection = {
  projects: Array<{
    project_id: string;
    space_id: string;
    org_id: string;
    name: string;
    local_path: string;
    storage_driver?: "git_worktree" | string;
    versioning?: "git" | string;
    git_repo_path?: string;
    git_branch?: string;
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

export const PROJECTION_NAMES = {
  topbar: "topbar",
  accessSessionCurrent: "access_session.current",
  projectFilesystemStatus: "project.filesystem_status",
  spaceInstalledVApps: "space.installed_vapps",
  gitEmaUserConnectors: "git_ema.user_connectors",
  gitEmaUserAttachments: "git_ema.user_attachments",
  gitEmaProjectAttachments: "git_ema.project_attachments",
  blueprintSections: "blueprint.sections",
  collabDocument: "collab.document",
  desktopPresence: "desktop.presence",
  seeAgentWorkProjectPulse: "see_agent_work.project_pulse",
} as const;
