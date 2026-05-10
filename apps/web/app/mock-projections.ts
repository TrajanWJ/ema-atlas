export const MOCK_PROJECTION_LABEL = "staged projection";

export const EMA_SCOPE = {
  orgId: "org:01J00000000000000000000001",
  orgName: "Trajan Workspace",
  spaceId: "space:01J00000000000000000000005",
  spaceName: "EMA Studio",
  projectId: "project:01J00000000000000000000006",
  projectName: "EMA 0.0.6",
  blueprintDocId: "blueprint_doc:01J00000000000000000000007",
  blueprintRootSectionId: "blueprint_sec:01J00000000000000000000008",
  blueprintSourceSectionId: "blueprint_sec:01J00000000000000000000009",
  runtimeAttachmentId: "attachment:01J00000000000000000000010",
};

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
  node_state: "home_current",
};

export const hqProjection = {
  pulse: [
    { label: "workspace", value: "EMA", detail: "active build 0.0.6 mounted from Desktop" },
    { label: "surfaces", value: "8", detail: "HQ, Blueprint, git-ema, agent work, wiki, threads, launchpad, settings" },
    { label: "donor base", value: "place", detail: "tokens, glass, dock, window grammar, and companion bridge recovered" },
    { label: "daemon", value: "local", detail: "BEAM control plane remains source of truth" },
  ],
  controls: [
    {
      label: "Promote projection",
      state: "staged",
      detail: "Would request daemon review before becoming canon.",
    },
    {
      label: "Freeze event trail",
      state: "local only",
      detail: "Pins the current event trail for a demo pass.",
    },
    {
      label: "Invite surface owner",
      state: "staged",
      detail: "Future scoped handoff into org / space / project permissions.",
    },
    {
      label: "Run doctrine check",
      state: "staged",
      detail: "Checks page copy against the visible doctrine cards.",
    },
  ],
  hubLinks: [
    "control-room/readme",
    "org/Trajan-Workspace/space/EMA-Studio/project/EMA-0.0.6",
    "blueprint/operational-surfaces",
    "git-ema/connectors",
    "agent-work/web-lane",
    "wiki/doctrine/no-hidden-canon",
    "threads/demo-room",
    "events/local-projection",
    "settings/shell-preferences",
    "surface/desktop-embed",
    "surface/browser",
    "local-command-log",
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
    action: "Connector panel exposed staged OAuth affordances",
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
    action: "Trajan's Organization -> EMA Development -> EMA 0.0.6 initialized",
    surface: "Localhost",
  },
];

// Bounded buffer for the chronicle strip. Donor: lineage-original-elixir-ema
// (@max_events 200). Surface lane caps at the same value.
// RIP: lineage-original-elixir-ema @max_events → CHRONICLE_MAX (adapt)
export const CHRONICLE_MAX = 200;

// TODO(event-family: lane.*, handoff.*, proposal.*) replace with the live
// See Agent Work projection sourced from daemon events. Until then this is
// staged surface state. Worker status lives in docs/orchestration/STATUS.md, never
// here. Kept as a pointer-row so HQ can fall back if the richer
// `seeAgentWorkProjection.lanes` is unavailable.
export const agentWork = [
  {
    lane: "see docs/orchestration/STATUS.md",
    owner: "coordinator ledger",
    status: "staged",
    output: "Lane state is tracked in the ledger, not in surface data.",
  },
];

export const seeAgentWorkProjection = {
  project_id: EMA_SCOPE.projectId,
  staged: true,
  swarms: [
    {
      id: "swarm:01J00000000000000000000001",
      name: "EMA 0.0.6 Proslync-first readiness swarm",
      status: "staged",
      purpose: "Coordinate Codex, Claude, and human founder work around the vanilla workspace.",
    },
  ],
  campaigns: [
    {
      id: "campaign:01J000000000000000000001",
      title: "0.0.6 Proslync-Ready Workspace",
      status: "active staged",
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
      title: "Seed EMA 0.0.6 workspace",
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
      needed: "Keep seed IDs aligned with first-boot daemon contracts.",
      status: "accepted",
    },
  ],
  queue_items: [
    {
      id: "queue_item:01J000000000000000000001",
      title: "Promote agent workspace projection writer",
      status: "blocked",
      source: "current build session",
      why: "The vApp can render the workspace now, but daemon must own canonical state.",
      depends_on: ["problem:daemon-projection-writer"],
      done_when: "see_agent_work.project_pulse includes campaigns, missions, lanes, queue, problems, vCalendar, and CLI suggestions.",
      cli: "ema queue add --title \"Promote agent workspace projection writer\" --depends-on problem:daemon-projection-writer",
    },
    {
      id: "queue_item:01J000000000000000000002",
      title: "Use EMA CLI orientation at agent start",
      status: "ready",
      source: "AGENTS.md / CLAUDE.md operating contract",
      why: "Agents need project management and executive-function context before editing.",
      depends_on: ["docs/cli/agent-workspace.md"],
      done_when: "Every new agent session can run ema agent orient --json and understand current campaigns, missions, lanes, queue, and vCalendar.",
      cli: "ema agent orient --json",
    },
    {
      id: "queue_item:01J000000000000000000003",
      title: "Wire vCalendar blocks to scheduling commands",
      status: "ready",
      source: "agent-workspace-vapp blueprint",
      why: "Time blocks and checkups should be visible to humans and usable by agents.",
      depends_on: ["queue_item:01J000000000000000000001"],
      done_when: "ema vcalendar week --json and the vApp show the same blocks/checkups.",
      cli: "ema vcalendar week --json",
    },
  ],
  problems: [
    {
      id: "problem:daemon-projection-writer",
      title: "Daemon projection writer is not emitting agent workspace truth yet",
      status: "open",
      solution: "Add a daemon-owned workspace projection reducer fed by campaign, mission, lane, queue, problem, vCalendar, and handoff events.",
      depends_on: ["packages/contracts/ipc/shell-protocol.md", "apps/daemon/src"],
      cli: "ema problem log --title \"Daemon projection writer is not emitting agent workspace truth yet\" --depends-on packages/contracts/ipc/shell-protocol.md",
    },
    {
      id: "problem:cli-writers-pending",
      title: "CLI nouns are visible but mutating writers are pending",
      status: "open",
      solution: "Keep commands discoverable and honest, then route writes through daemon commands when command IPC lands.",
      depends_on: ["problem:daemon-projection-writer"],
      cli: "ema problem show --problem problem:cli-writers-pending --json",
    },
  ],
  dependencies: [
    {
      id: "dep:queue-writer",
      from: "queue_item:01J000000000000000000001",
      to: "problem:daemon-projection-writer",
      relation: "blocked_by",
    },
    {
      id: "dep:vcalendar-cli",
      from: "queue_item:01J000000000000000000003",
      to: "queue_item:01J000000000000000000001",
      relation: "depends_on",
    },
    {
      id: "dep:cli-writers",
      from: "problem:cli-writers-pending",
      to: "problem:daemon-projection-writer",
      relation: "depends_on",
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
    "Daemon writer still needs the See Agent Work event family.",
    "Lane replay needs promotion from staged projection to daemon projection.",
    "Start/pause/stop controls are staged until supervision commands land.",
  ],
  controls: [
    { label: "Agent Orientation", state: "staged", command: "ema agent orient --json" },
    { label: "Workspace Status", state: "staged", command: "ema status --json" },
    { label: "Open Queue", state: "staged", command: "ema queue list --json" },
    { label: "Open Mission", state: "draft", command: "ema mission create --title \"Build vanilla workspace\"" },
    { label: "Request Handoff", state: "draft", command: "ema handoff request --from lane:<id> --to actor:<id> --needed \"<dependency>\"" },
    { label: "Log Problem", state: "draft", command: "ema problem log --title \"<problem>\" --depends-on \"<dependency>\"" },
  ],
  cli_suggestions: [
    `ema swarm status --swarm buildout --project "${EMA_SCOPE.projectName}"`,
    `ema campaign show --campaign campaign:01J000000000000000000001`,
    `ema lane list --mission mission:01J000000000000000000003`,
    `ema agent prompt --actor actor:01J00000000000000000000003 --mission mission:01J000000000000000000002`,
  ],
  agent_instruction:
    "Work inside Trajan's Organization / EMA Development / EMA 0.0.6. Keep the lane scoped, report changed files, preserve intent vs canon, and do not imply staged controls executed real work.",
  // Chronicle strip feed. Bounded by CHRONICLE_MAX. Wave 1: seeded from
  // eventTrail + synthesized lane/handoff entries. Wave 2+: daemon-sourced.
  recent_events: [
    { ts: "13:56", actor: "web surface", kind: "event", summary: "Mounted HQ shell projection" },
    { ts: "13:54", actor: "daemon projection", kind: "projection", summary: "topbar snapshot delivered on subscribe" },
    { ts: "13:49", actor: "daemon bus", kind: "event", summary: "Topbar subscription attempted on ws://127.0.0.1:49555" },
    { ts: "13:47", actor: "contracts", kind: "command_result", summary: "check:contracts OK — every referenced event kind is in catalog v0" },
    { ts: "13:42", actor: "git-ema", kind: "event", summary: "Connector panel exposed staged OAuth affordances" },
    { ts: "13:39", actor: "agent-work", kind: "event", summary: "Lane lane:01J00000000000000000000002 entered review" },
    { ts: "13:31", actor: "blueprint", kind: "event", summary: "Section attachment targets prepared" },
    { ts: "13:28", actor: "coordinator ledger", kind: "event", summary: "Handoff accepted: contracts → UI lane" },
    { ts: "13:20", actor: "daemon seed", kind: "event", summary: "Trajan's Organization -> EMA Development -> EMA 0.0.6 initialized" },
    { ts: "13:18", actor: "daemon supervisor", kind: "event", summary: "ema_daemon_supervisor boot complete" },
  ],
};

// HQ's Lane status panel reads this derived summary instead of the one-line
// `agentWork` staged pointer. Lane ownership is resolved through
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
    body: "Every datum on this localhost shell is either daemon projection or clearly labeled staged projection.",
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
    title: "EMA coordination",
    meta: "staged thread",
    body: "A future chat stream for walkthrough questions, decisions, and surface handoffs.",
  },
  {
    title: "Agent Dispatch",
    meta: "staged thread",
    body: "A future coordination lane for reviewing agent outputs before promotion.",
  },
  {
    title: "Project Pulse",
    meta: "staged thread",
    body: "A future low-noise digest of project events, alerts, and review requests.",
  },
];

export const blueprintProjection = {
  documents: [
    {
      id: EMA_SCOPE.blueprintDocId,
      title: "EMA 0.0.6 Blueprint",
      sections: [
        {
          id: EMA_SCOPE.blueprintRootSectionId,
          title: "Executive Management Assistant",
          children: [
            { id: "bp-hq", title: "HQ pulse and staged controls" },
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
          title: "Doctrine and staged surfaces",
          children: [
            { id: "bp-wiki", title: "Wiki / Doctrine foundation" },
            { id: "bp-threads", title: "Chat / Threads foundation" },
          ],
        },
      ],
    },
  ],
};

export const gitEmaUserConnectorsProjection = {
  connectors: [
    {
      id: "seed-github",
      provider: "github",
      status: "connected",
      display_label: "seed: ema-central-runtime",
    },
    {
      id: "seed-drive",
      provider: "google_drive",
      status: "disconnected",
      display_label: "seed: drive unavailable",
    },
  ],
};

export const gitEmaAttachmentsProjection = {
  attachments: [
    {
      id: EMA_SCOPE.runtimeAttachmentId,
      kind: "folder",
      source: "staged projection",
      display_name: "runtime/EMA-0.0.6",
    },
    {
      id: "seed-web-src",
      kind: "git_path",
      source: "staged projection",
      display_name: "apps/web/src",
    },
    {
      id: "seed-blueprint-doc",
      kind: "drive_file",
      source: "staged projection",
      display_name: "EMA 0.0.6 Control Room Blueprint",
    },
  ],
};
