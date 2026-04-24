export const MOCK_PROJECTION_LABEL = "mock local projection";

export const EMA_SCOPE = {
  orgId: "org:01J00000000000000000000001",
  orgName: "Founding-Fathers-EMA",
  spaceId: "space:01J00000000000000000000005",
  spaceName: "Founding-Fathers-EMA",
  projectId: "project:01J00000000000000000000006",
  projectName: "EMA 0.0.5",
  blueprintDocId: "blueprint_doc:01J00000000000000000000007",
  blueprintRootSectionId: "blueprint_sec:01J00000000000000000000008",
  blueprintSourceSectionId: "blueprint_sec:01J00000000000000000000009",
  runtimeAttachmentId: "attachment:01J00000000000000000000010",
};

export const PROJECT_ROOT_PATH = `/orgs/${EMA_SCOPE.orgId}/spaces/${EMA_SCOPE.spaceId}/projects/${EMA_SCOPE.projectId}`;

export type SurfaceId =
  | "hq"
  | "blueprint"
  | "git-ema"
  | "agent-work"
  | "wiki"
  | "threads";

export const mockTopbar = {
  user: { id: "user:01J00000000000000000000001", display_name: "Trajan" },
  orgs: [{ id: EMA_SCOPE.orgId, name: EMA_SCOPE.orgName }],
  spaces: [
    { id: EMA_SCOPE.spaceId, org_id: EMA_SCOPE.orgId, name: EMA_SCOPE.spaceName },
  ],
  projects: [
    { id: EMA_SCOPE.projectId, space_id: EMA_SCOPE.spaceId, name: EMA_SCOPE.projectName },
  ],
  current_org: { id: EMA_SCOPE.orgId, name: EMA_SCOPE.orgName },
  current_space: { id: EMA_SCOPE.spaceId, org_id: EMA_SCOPE.orgId, name: EMA_SCOPE.spaceName },
  current_project: {
    id: EMA_SCOPE.projectId,
    space_id: EMA_SCOPE.spaceId,
    name: EMA_SCOPE.projectName,
  },
  node_state: "home",
};

export const surfaceLinks: Array<{
  id: SurfaceId;
  label: string;
  path: string;
  eyebrow: string;
  status: "live" | "projection" | "placeholder";
}> = [
  {
    id: "hq",
    label: "HQ",
    path: "/",
    eyebrow: "command",
    status: "projection",
  },
  {
    id: "blueprint",
    label: "Blueprint",
    path: PROJECT_ROOT_PATH,
    eyebrow: "project map",
    status: "projection",
  },
  {
    id: "git-ema",
    label: "git-ema",
    path: `${PROJECT_ROOT_PATH}/git-ema`,
    eyebrow: "files + repos",
    status: "live",
  },
  {
    id: "agent-work",
    label: "See Agent Work",
    path: "/agent-work",
    eyebrow: "lanes",
    status: "projection",
  },
  {
    id: "wiki",
    label: "Wiki / Doctrine",
    path: "/wiki",
    eyebrow: "memory",
    status: "placeholder",
  },
  {
    id: "threads",
    label: "Chat / Threads",
    path: "/threads",
    eyebrow: "coordination",
    status: "placeholder",
  },
];

export const hqProjection = {
  pulse: [
    { label: "org", value: "1", detail: "Founding-Fathers-EMA seeded" },
    { label: "surfaces", value: "6", detail: "HQ, Blueprint, git-ema, agent work, wiki, threads" },
    { label: "mock controls", value: "12", detail: "visible affordances, no canonical writes" },
    { label: "daemon", value: "stub", detail: "BEAM seed and contracts are source of truth" },
  ],
  controls: [
    {
      label: "Promote projection",
      state: "armed mock",
      detail: "Would request daemon review before becoming canon.",
    },
    {
      label: "Freeze event trail",
      state: "local only",
      detail: "Pins the visible mock timeline for a demo pass.",
    },
    {
      label: "Invite surface owner",
      state: "placeholder",
      detail: "Future scoped handoff into org / space / project permissions.",
    },
    {
      label: "Run doctrine check",
      state: "mock",
      detail: "Checks page copy against the visible doctrine cards.",
    },
  ],
  hubLinks: [
    "control-room/readme",
    "org/Founding-Fathers-EMA/space/Founding-Fathers-EMA/project/EMA-0.0.5",
    "blueprint/operational-surfaces",
    "git-ema/connectors",
    "agent-work/web-lane",
    "wiki/doctrine/no-hidden-canon",
    "threads/demo-room",
    "events/local-projection",
    "settings/scaffold",
    "surface/desktop-embed",
    "surface/browser",
    "mock-command-log",
  ],
};

export const eventTrail = [
  {
    time: "13:56",
    actor: "web surface",
    action: "Mounted HQ shell projection",
    surface: "HQ",
  },
  {
    time: "13:49",
    actor: "daemon projection",
    action: "Topbar subscription attempted on ws://127.0.0.1:49555",
    surface: "Shell",
  },
  {
    time: "13:42",
    actor: "git-ema",
    action: "Connector panel exposed fake OAuth affordances",
    surface: "git-ema",
  },
  {
    time: "13:31",
    actor: "blueprint",
    action: "Section attachment targets prepared",
    surface: "Blueprint",
  },
  {
    time: "13:20",
    actor: "daemon seed",
    action: "Founding-Fathers-EMA -> Founding-Fathers-EMA -> EMA 0.0.5 initialized",
    surface: "Localhost",
  },
];

// Bounded buffer for the chronicle strip. Donor: lineage-original-elixir-ema
// (@max_events 200). Surface lane caps at the same value.
// RIP: lineage-original-elixir-ema @max_events → CHRONICLE_MAX (adapt)
export const CHRONICLE_MAX = 200;

// TODO(event-family: lane.*, handoff.*, proposal.*) replace with the live
// See Agent Work projection sourced from daemon events. Until then this is
// a placeholder. Worker status lives in docs/orchestration/STATUS.md, never
// here. Kept as a pointer-row so HQ can fall back if the richer
// `seeAgentWorkProjection.lanes` is unavailable.
export const agentWork = [
  {
    lane: "see docs/orchestration/STATUS.md",
    owner: "coordinator ledger",
    status: "mock",
    output: "Lane state is tracked in the ledger, not in surface data.",
  },
];

export const seeAgentWorkProjection = {
  project_id: EMA_SCOPE.projectId,
  mocked: true,
  swarms: [
    {
      id: "swarm:01J00000000000000000000001",
      name: "EMA 0.0.5 buildout swarm",
      status: "mocked",
      purpose: "Coordinate Codex, Claude, and human founder work around the vanilla workspace.",
    },
  ],
  campaigns: [
    {
      id: "campaign:01J000000000000000000001",
      title: "0.0.5 Vanilla Workspace",
      status: "active mock",
      signal: "Make the whole operating environment visible before real autonomy.",
    },
    {
      id: "campaign:01J000000000000000000002",
      title: "Swarm Environment",
      status: "projection",
      signal: "Prepare missions, lanes, handoffs, vCalendar, and role cards.",
    },
  ],
  missions: [
    {
      id: "mission:01J000000000000000000001",
      title: "Seed Founding-Fathers-EMA",
      campaign_id: "campaign:01J000000000000000000001",
      status: "active",
    },
    {
      id: "mission:01J000000000000000000002",
      title: "Build multi-surface localhost shell",
      campaign_id: "campaign:01J000000000000000000001",
      status: "review",
    },
    {
      id: "mission:01J000000000000000000003",
      title: "Shape See Agent Work control room",
      campaign_id: "campaign:01J000000000000000000002",
      status: "active",
    },
  ],
  lanes: [
    {
      id: "lane:01J00000000000000000000001",
      title: "Contracts and event validation",
      mission_id: "mission:01J000000000000000000001",
      owner_actor_id: "actor:01J00000000000000000000002",
      status: "review",
      cli: `ema lane show --lane lane:01J00000000000000000000001 --project "${EMA_SCOPE.projectName}"`,
    },
    {
      id: "lane:01J00000000000000000000002",
      title: "Topbar / shell projection",
      mission_id: "mission:01J000000000000000000002",
      owner_actor_id: "actor:01J00000000000000000000003",
      status: "active",
      cli: `ema agent prompt --actor actor:01J00000000000000000000003 --mission mission:01J000000000000000000002`,
    },
    {
      id: "lane:01J00000000000000000000003",
      title: "See Agent Work vCalendar",
      mission_id: "mission:01J000000000000000000003",
      owner_actor_id: "actor:01J00000000000000000000003",
      status: "active",
      cli: `ema vcalendar week --project "${EMA_SCOPE.projectName}"`,
    },
    {
      id: "lane:01J00000000000000000000004",
      title: "Real WebSocket IPC",
      mission_id: "mission:01J000000000000000000001",
      status: "blocked",
      cli: "ema handoff request --from lane:01J00000000000000000000004 --to actor:daemon-owner --needed \"Wire WS actor\"",
    },
  ],
  handoffs: [
    {
      id: "handoff:01J000000000000000000001",
      from: "web surface",
      to: "daemon lane",
      needed: "Replace local projections with topbar + See Agent Work projection snapshots.",
      status: "open",
    },
    {
      id: "handoff:01J000000000000000000002",
      from: "contracts",
      to: "UI lane",
      needed: "Keep mock IDs aligned with first-boot daemon seed.",
      status: "accepted",
    },
  ],
  vcalendar: {
    weekly_phase: "Vanilla workspace ignition",
    blocks: [
      { id: "calendar_block:01J000000000000000001", label: "Agent Work surface polish", kind: "focus", actor_id: "actor:01J00000000000000000000003" },
      { id: "calendar_block:01J000000000000000002", label: "Contract check + build verification", kind: "review", actor_id: "actor:01J00000000000000000000002" },
      { id: "calendar_block:01J000000000000000003", label: "Daemon IPC planning window", kind: "blocked" },
    ],
    checkups_due: [
      { id: "checkup:01J000000000000000000001", label: "Verify localhost shell", cadence: "every lane close" },
      { id: "checkup:01J000000000000000000002", label: "Confirm no hidden canon", cadence: "daily agent week" },
    ],
  },
  actors: [
    {
      id: "actor:01J00000000000000000000002",
      display_name: "Trajan",
      kind: "human",
      role: "founder-developer",
      current_lane: "approval + canon",
    },
    {
      id: "actor:01J00000000000000000000003",
      display_name: "Codex",
      kind: "agent",
      role: "implementation-orchestrator",
      current_lane: "web/backend integration",
    },
    {
      id: "actor:01J00000000000000000000004",
      display_name: "Claude",
      kind: "agent",
      role: "concept-and-docs-orchestrator",
      current_lane: "doctrine handoff",
    },
  ],
  blocked_work: [
    "Real BEAM WebSocket server is not wired yet.",
    "SQLite append/replay is not implemented yet.",
    "Start/pause/stop controls are explicitly mocked.",
  ],
  controls: [
    { label: "Start Swarm", state: "mocked", command: "ema swarm start --swarm buildout" },
    { label: "Pause Swarm", state: "mocked", command: "ema swarm pause --swarm buildout" },
    { label: "Stop Swarm", state: "mocked", command: "ema swarm stop --swarm buildout" },
    { label: "Open Mission", state: "draft", command: "ema mission create --title \"Build vanilla workspace\"" },
    { label: "Request Handoff", state: "draft", command: "ema handoff request --from lane:<id> --to actor:<id>" },
    { label: "Schedule Checkup", state: "draft", command: "ema checkup schedule --lane lane:<id> --cadence daily" },
  ],
  cli_suggestions: [
    `ema swarm status --swarm buildout --project "${EMA_SCOPE.projectName}"`,
    `ema campaign show --campaign campaign:01J000000000000000000001`,
    `ema lane list --mission mission:01J000000000000000000003`,
    `ema agent prompt --actor actor:01J00000000000000000000003 --mission mission:01J000000000000000000002`,
  ],
  agent_instruction:
    "Work inside Founding-Fathers-EMA / Founding-Fathers-EMA / EMA 0.0.5. Keep the lane scoped, report changed files, preserve intent vs canon, and do not imply mocked controls executed real work.",
  // Chronicle strip feed. Bounded by CHRONICLE_MAX. Wave 1: seeded from
  // eventTrail + synthesized lane/handoff entries. Wave 2+: daemon-sourced.
  recent_events: [
    { ts: "13:56", actor: "web surface", kind: "event", summary: "Mounted HQ shell projection" },
    { ts: "13:54", actor: "daemon projection", kind: "projection", summary: "topbar snapshot delivered on subscribe" },
    { ts: "13:49", actor: "daemon bus", kind: "event", summary: "Topbar subscription attempted on ws://127.0.0.1:49555" },
    { ts: "13:47", actor: "contracts", kind: "command_result", summary: "check:contracts OK — every referenced event kind is in catalog v0" },
    { ts: "13:42", actor: "git-ema", kind: "event", summary: "Connector panel exposed fake OAuth affordances" },
    { ts: "13:39", actor: "agent-work", kind: "event", summary: "Lane lane:01J00000000000000000000002 entered review" },
    { ts: "13:31", actor: "blueprint", kind: "event", summary: "Section attachment targets prepared" },
    { ts: "13:28", actor: "coordinator ledger", kind: "event", summary: "Handoff accepted: contracts → UI lane" },
    { ts: "13:20", actor: "daemon seed", kind: "event", summary: "Founding-Fathers-EMA -> Founding-Fathers-EMA -> EMA 0.0.5 initialized" },
    { ts: "13:18", actor: "daemon supervisor", kind: "event", summary: "ema_daemon_supervisor boot complete" },
  ],
};

// HQ's Lane status panel reads this derived summary instead of the one-line
// `agentWork` placeholder. Lane ownership is resolved through
// `seeAgentWorkProjection.actors` so the panel speaks EMA object language.
// Per SURFACE-SLICE-A.md §"Files touched" and `docs/vapps/see-agent-work.md`.
export const agentWorkLaneSummary = seeAgentWorkProjection.lanes.map((lane) => {
  const actor = seeAgentWorkProjection.actors.find(
    (a) => a.id === lane.owner_actor_id,
  );
  return {
    id: lane.id,
    title: lane.title,
    status: lane.status,
    owner_label: actor ? actor.display_name : "unassigned",
    owner_kind: actor ? actor.kind : ("unknown" as const),
    cli: lane.cli,
  };
});

export const doctrineCards = [
  {
    title: "No Hidden Canon",
    body: "Every datum on this localhost shell is either daemon projection or clearly labeled mock local projection.",
  },
  {
    title: "Surfaces Coordinate, Daemon Decides",
    body: "Buttons in this shell demonstrate intent; canonical mutation must flow through daemon commands.",
  },
  {
    title: "Org / Space / Project First",
    body: "Navigation keeps the operator oriented inside a sovereign org, its space, and the selected project.",
  },
];

export const threadCards = [
  {
    title: "Demo Room",
    meta: "placeholder thread",
    body: "A future chat stream for walkthrough questions, decisions, and surface handoffs.",
  },
  {
    title: "Agent Dispatch",
    meta: "placeholder thread",
    body: "A future coordination lane for reviewing agent outputs before promotion.",
  },
  {
    title: "Project Pulse",
    meta: "placeholder thread",
    body: "A future low-noise digest of project events, alerts, and review requests.",
  },
];

export const blueprintProjection = {
  documents: [
    {
      id: EMA_SCOPE.blueprintDocId,
      title: "EMA 0.0.5 Blueprint",
      sections: [
        {
          id: EMA_SCOPE.blueprintRootSectionId,
          title: "Executive Management Assistant",
          children: [
            { id: "bp-hq", title: "HQ pulse and mocked controls" },
            { id: "bp-agent-work", title: "See Agent Work lane visibility" },
          ],
        },
        {
          id: EMA_SCOPE.blueprintSourceSectionId,
          title: "Runtime source and git-ema evidence",
          children: [
            { id: "bp-org-space-project", title: "Org / space / project spine" },
            { id: "bp-event-trail", title: "Event trail projection" },
          ],
        },
        {
          id: "bp-doctrine",
          title: "Doctrine and placeholders",
          children: [
            { id: "bp-wiki", title: "Wiki / Doctrine scaffold" },
            { id: "bp-threads", title: "Chat / Threads scaffold" },
          ],
        },
      ],
    },
  ],
};

export const gitEmaUserConnectorsProjection = {
  connectors: [
    {
      id: "mock-github",
      provider: "github",
      status: "connected",
      display_label: "mock: ema-central-runtime",
    },
    {
      id: "mock-drive",
      provider: "google_drive",
      status: "disconnected",
      display_label: "mock: drive unavailable",
    },
  ],
};

export const gitEmaAttachmentsProjection = {
  attachments: [
    {
      id: EMA_SCOPE.runtimeAttachmentId,
      kind: "folder",
      source: "mock local projection",
      display_name: "runtime/EMA-0.0.5--4-24",
    },
    {
      id: "mock-web-src",
      kind: "git_path",
      source: "mock local projection",
      display_name: "apps/web/src",
    },
    {
      id: "mock-blueprint-doc",
      kind: "drive_file",
      source: "mock local projection",
      display_name: "EMA 0.0.5 Control Room Blueprint",
    },
  ],
};
