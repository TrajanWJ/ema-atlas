/**
 * Typed projection shapes (v0).
 *
 * These mirror the projections daemon emits over IPC. Surfaces import
 * these types instead of redefining them.
 */

import type { SelectorState } from "../selectors";

export type TopbarProjection = SelectorState & {
  user: { id: string; display_name: string };
  node_state: "home" | "replica_current" | "replica_provisional" | "replica_stale";
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

export const PROJECTION_NAMES = {
  topbar: "topbar",
  gitEmaUserConnectors: "git_ema.user_connectors",
  gitEmaUserAttachments: "git_ema.user_attachments",
  gitEmaProjectAttachments: "git_ema.project_attachments",
  blueprintSections: "blueprint.sections",
  seeAgentWorkProjectPulse: "see_agent_work.project_pulse",
} as const;
