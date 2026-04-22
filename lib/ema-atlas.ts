export type Vision = {
  id: string;
  title: string;
  stance: string;
  bet: string;
  tension: string;
  question: string;
};

export type Part = {
  slug: string;
  title: string;
  strapline: string;
  summary: string;
  branches: string[];
  docs: string[];
  hardQuestions: string[];
  deliverables: string[];
  visions: Vision[];
};

export type DocEntry = {
  title: string;
  path: string;
  note: string;
  kind: "doctrine" | "backlog" | "evidence" | "implementation";
  status: "active" | "foundational" | "growing";
  feeds: string[];
};

export const globalVisions: Vision[] = [
  {
    id: "operator-cathedral",
    title: "Operator Cathedral",
    stance: "EMA becomes a rigorous command-and-control operating layer with explicit gates, visible lineage, and hard truth boundaries.",
    bet: "Optimization favors authority, auditability, and intervention power.",
    tension: "Improvisation gets slower and social workflow can feel ceremonial.",
    question: "If EMA becomes the court of record, what is never allowed to happen outside it?"
  },
  {
    id: "living-workspace",
    title: "Living Workspace",
    stance: "EMA behaves like a cohabited environment where humans and agents share documents, threads, plans, desktops, and routines as one living place.",
    bet: "Optimization favors shared state, continuity, and rich collaboration artifacts.",
    tension: "Boundaries blur quickly unless identity and ownership are extremely explicit.",
    question: "When does a living workspace stop feeling coherent and start feeling haunted?"
  },
  {
    id: "mesh-commonwealth",
    title: "Mesh Commonwealth",
    stance: "EMA grows into a peer-aware fabric where organizations, projects, devices, and agents coordinate through replicas and negotiated authority.",
    bet: "Optimization favors resilience, portability, and distributed participation.",
    tension: "Truth, routing, and conflict resolution become dramatically harder to explain.",
    question: "How much sovereignty can peers have before EMA stops feeling like one system?"
  }
];

const visionFor = (
  id: string,
  overrides: Array<Pick<Vision, "stance" | "bet" | "tension" | "question">>
): Vision[] =>
  globalVisions.map((vision, index) => ({
    ...vision,
    id: `${id}-${vision.id}`,
    ...overrides[index]
  }));

export const parts: Part[] = [
  {
    slug: "authority-control-plane",
    title: "Authority / Control Plane",
    strapline: "Where EMA insists on truth and where it refuses to leak",
    summary:
      "This part presents EMA as the canonical project kernel: the place where IDs, lineage, approvals, outcomes, and binding rules stay coherent even when surfaces, agents, and runtimes keep moving.",
    branches: ["lineage-original-elixir-ema", "codebase-ema", "docs-ema-next-steps"],
    docs: ["ema-003-lineage-architecture-synthesis.md", "ema-003-gleam-beam-bounded-contexts.md"],
    hardQuestions: [
      "What becomes canonical first: workstream, task, execution, or artifact?",
      "Which actions must be impossible without an EMA-owned record?",
      "How much ceremony is acceptable before users route around the system?"
    ],
    deliverables: ["Atlas page", "Print brief", "Slide deck", "Graph", "Canvas board"],
    visions: visionFor("authority", [
      {
        stance: "EMA acts like a command citadel with explicit approvals, dispatch, and historical trace on every consequential move.",
        bet: "Users trade spontaneity for confidence that truth can be reconstructed after chaos.",
        tension: "Too much citadel energy and the system feels bureaucratic instead of alive.",
        question: "Which truths deserve ritual, and which truths should emerge almost invisibly?"
      },
      {
        stance: "Authority exists, but it feels woven into the workspace rather than imposed from above.",
        bet: "Users see truth through living objects like threads, wiki nodes, plans, and workstreams instead of separate admin ceremonies.",
        tension: "Embedded authority can become ambiguous authority if the seams are too soft.",
        question: "Can EMA feel humane without becoming fuzzy about what actually happened?"
      },
      {
        stance: "Authority is negotiated and lease-based across peers, spaces, and devices rather than permanently centralized.",
        bet: "Projects stay resilient when the primary machine, person, or daemon changes.",
        tension: "Once authority becomes mobile, trust explanations become part of the product itself.",
        question: "What is the minimum visible model users need before distributed truth becomes believable?"
      }
    ])
  },
  {
    slug: "harness-execution",
    title: "Harness / Execution Fabric",
    strapline: "How Hermes, CLIs, local models, and agents actually move",
    summary:
      "This part frames Hermes and the execution layer as the runtime fabric under EMA: where sessions are born, tools run, subagents delegate, and event streams return to the shared record.",
    branches: ["codebase-ema", "docs-clis-mcps-integrations", "codebase-claudeforge"],
    docs: ["ema-003-lineage-architecture-synthesis.md", "ema-003-recovery-and-implementation-plan.md"],
    hardQuestions: [
      "Should every run originate in EMA, or can EMA adopt pre-existing sessions?",
      "When does a provider adapter become a harness, and when does it stay just a provider?",
      "How visible should delegation trees be to humans?"
    ],
    deliverables: ["Atlas page", "Runtime deck", "Execution graph", "Canvas board", "Desktop runtime window"],
    visions: visionFor("harness", [
      {
        stance: "Hermes becomes a disciplined backstage engine under a strict EMA control plane.",
        bet: "The system emphasizes run handles, event normalization, and visible execution lineage over creative runtime freedom.",
        tension: "The more disciplined the runtime, the more adapter work you need up front.",
        question: "Is runtime flexibility a feature, or a source of permanent conceptual debt?"
      },
      {
        stance: "Execution feels like part of the workspace itself: threads, prompts, wiki context, and runs all cohere as one living surface.",
        bet: "Humans think in workstreams instead of separate run consoles and provider sessions.",
        tension: "It becomes dangerously easy to confuse visible surface continuity with actual execution truth.",
        question: "How do you keep execution legible without turning the interface into raw telemetry?"
      },
      {
        stance: "Execution becomes portable across peers, machines, and organizations with Hermes routing work based on capability and policy.",
        bet: "EMA can become a networked labor fabric instead of a single-host runtime.",
        tension: "Portable execution magnifies every unresolved problem in identity, secrets, and provenance.",
        question: "What should never be allowed to run on a remote peer, no matter how convenient it would be?"
      }
    ])
  },
  {
    slug: "shared-workspace",
    title: "Shared Workspace",
    strapline: "The place humans and agents co-inhabit instead of merely chatting through",
    summary:
      "This part treats plans, notes, tasks, handoffs, threads, files, and workspace exports as first-class shared objects. It asks what EMA must own so context stops scattering into random folders and chat scrollback.",
    branches: ["codebase-ema", "docs-ema-next-steps", "lineage-openclaw-agent-workspaces"],
    docs: ["ema-003-shared-agent-swarm-workspace.md", "ema-003-lineage-architecture-synthesis.md"],
    hardQuestions: [
      "What exact artifact types are first-class in v1?",
      "When is a thread enough, and when does something need to become a workspace object?",
      "Should workspace artifacts stay file-shaped, database-shaped, or both?"
    ],
    deliverables: ["Atlas page", "Workspace brief", "Canvas board", "Graph", "Desktop room"],
    visions: visionFor("workspace", [
      {
        stance: "The workspace is a curated command archive: every artifact is deliberate, referenced, and attached to control-plane reality.",
        bet: "Clarity beats abundance.",
        tension: "Minimal artifact vocabularies can choke off useful improvisation and note-taking.",
        question: "What kinds of mess should EMA deliberately preserve because they are part of real work?"
      },
      {
        stance: "The workspace feels lush and inhabited: documents, prompts, plans, files, and agents all leave visible traces in one environment.",
        bet: "The product becomes memorable because it feels alive, social, and legible over time.",
        tension: "A living workspace can turn into sediment unless pruning is part of the model.",
        question: "Who is responsible for composting the workspace when everyone can keep adding to it?"
      },
      {
        stance: "The workspace is replica-friendly and portable, designed to converge across peers without losing provenance.",
        bet: "EMA becomes durable beyond one machine or one host process.",
        tension: "Replica-friendly design forces hard choices about conflict, merge semantics, and authority leases.",
        question: "Which workspace artifacts deserve convergence logic and which should require explicit arbitration?"
      }
    ])
  },
  {
    slug: "coordination-environment",
    title: "Coordination / Agent Environment",
    strapline: "Planner, swarm, tasks, queues, responsibilities, and the self-paced virtual calendar",
    summary:
      "This part turns the agent environment into a real product family: planner board, queue, handoff inbox, weekly phases, checkups, responsibilities, and focus blocks rendered through EMA instead of side rituals.",
    branches: ["lineage-openclaw-agent-workspaces", "design-review-fresh-context", "codebase-executive"],
    docs: ["ema-003-shared-agent-swarm-workspace.md", "ema-003-shared-swarm-source-pack.md"],
    hardQuestions: [
      "What is the difference between a lane and a task?",
      "Should checkups feel like rituals, notifications, or ambient maintenance?",
      "How much autonomy should personal AI have inside planner surfaces?"
    ],
    deliverables: ["Atlas page", "Planner deck", "Miro board", "Mock HQ widgets", "Calendar canvas"],
    visions: visionFor("coordination", [
      {
        stance: "Coordination behaves like an air-traffic control room with explicit lane claims, handoffs, and drift audits.",
        bet: "Swarm work stays visible and recoverable when many agents and humans are moving at once.",
        tension: "Too much dispatch formality and small tasks become annoyingly expensive.",
        question: "Where is the line between accountability and over-management?"
      },
      {
        stance: "Coordination feels like a living studio where the planner, queue, and calendar are collaborative companions rather than command consoles.",
        bet: "The product becomes sticky because planning feels generative instead of administrative.",
        tension: "A softer studio feel can hide load, ownership, and blocked work until it is too late.",
        question: "Can an environment be emotionally supportive and still be brutally honest about slippage?"
      },
      {
        stance: "Coordination becomes a mesh negotiation layer where responsibilities, cadence, and workloads route across peers and agents dynamically.",
        bet: "EMA could become a distributed labor allocator rather than just a project board.",
        tension: "As routing gets smarter, intentional human control can feel like friction.",
        question: "When should EMA ask for permission instead of silently optimizing the schedule?"
      }
    ])
  },
  {
    slug: "semantic-layer",
    title: "Semantic Layer / Knowledge System",
    strapline: "Wiki, blueprint, graph, references, inline prompting, and project memory",
    summary:
      "This part treats EMA knowledge as more than docs. It folds wiki nodes, reference edges, blueprint structures, graph views, and embedded questions into a semantic layer that should accompany the build itself.",
    branches: ["docs-vault-wiki", "docs-clis-mcps-integrations", "docs-host-system-launchpad-hq"],
    docs: ["ema-003-knowledge-graph-hub.md", "ema-003-github-cross-pollination-map.md"],
    hardQuestions: [
      "What makes a wiki node different from a brief, a thread, or a task?",
      "Should the semantic layer index execution reality, or author it?",
      "How much graph complexity can users absorb before it becomes ornamental?"
    ],
    deliverables: ["Atlas page", "Knowledge brief", "Graph route", "Canvas board", "Semantic desktop window"],
    visions: visionFor("semantic", [
      {
        stance: "The semantic layer becomes a rigorous reference system: dense, linked, and highly structured around canonical concepts.",
        bet: "EMA can think clearly about itself because the map is disciplined.",
        tension: "Strong structure can make exploration feel over-determined.",
        question: "How much ambiguity should a knowledge system permit before it stops being useful?"
      },
      {
        stance: "The semantic layer behaves like a living notebook-city where humans and agents annotate, prompt, and compose inside the same graph.",
        bet: "Knowledge work becomes participatory and alive, not archival.",
        tension: "Living graphs can become mood boards instead of decision engines if nothing gets promoted.",
        question: "What is the promotion path from insight to commitment inside EMA?"
      },
      {
        stance: "The semantic layer becomes a federated memory substrate that spans orgs, spaces, peers, and long-running agent work.",
        bet: "EMA gains deep continuity across devices and contexts.",
        tension: "Federated memory is where privacy, permissions, and mistaken inference become existential product questions.",
        question: "What must remain deliberately unremembered even in a powerful semantic system?"
      }
    ])
  },
  {
    slug: "shells-surfaces",
    title: "Shells / Surfaces",
    strapline: "Launchpad, HQ, Threads, Chat, Virtual Desktop, and the shape of the visible product",
    summary:
      "This part shows the surfaces that humans actually live in: HQ as command shell, Launchpad as launch surface, Threads and Chat as conversational work surfaces, and the Virtual Desktop as the spatial metaphor that ties them together.",
    branches: ["docs-host-system-launchpad-hq", "codebase-place-org", "codebase-place-companion"],
    docs: ["ema-003-lineage-architecture-synthesis.md", "ema-003-knowledge-graph-hub.md"],
    hardQuestions: [
      "Is HQ the home, or is the desktop the home?",
      "Should Chat and Threads feel distinct or merely tuned views of one underlying model?",
      "How much place.org DNA should survive into EMA before the metaphor becomes nostalgia?"
    ],
    deliverables: ["Atlas page", "Surface deck", "Desktop route", "Animated demo", "Canvas board"],
    visions: visionFor("shells", [
      {
        stance: "Surfaces become a disciplined operator shell hierarchy: HQ first, Launchpad second, desktop as advanced mode.",
        bet: "The product stays legible for serious work instead of drowning in novelty.",
        tension: "A hierarchy can undersell the emotional power of the place metaphor.",
        question: "Which shell gets to define the user's first mental model of EMA?"
      },
      {
        stance: "The Virtual Desktop becomes the iconic center, with HQ and Launchpad acting like instruments inside a bigger place-based experience.",
        bet: "The product becomes unforgettable because it feels like a world rather than a dashboard.",
        tension: "Worlds are expensive to maintain and easy to turn into theater.",
        question: "What part of the desktop metaphor is essential, and what part is just costume?"
      },
      {
        stance: "Surfaces become adaptive and role-aware, shifting presentation across browser, native shell, mobile, and peer contexts.",
        bet: "EMA can stay coherent while appearing in very different environments.",
        tension: "Adaptive surfaces often hide assumptions that only reveal themselves in failure cases.",
        question: "How much can the surface adapt before users lose their sense of home?"
      }
    ])
  },
  {
    slug: "identity-project-space",
    title: "Identity / Org / Project / Space",
    strapline: "How personal AI, organizations, projects, and spaces actually compose",
    summary:
      "This part presents the tenancy and identity problem directly: personal vs org projects, actor and membership models, cross-project visibility, and whether spaces are fixed children or future spanning collaboration realms.",
    branches: ["design-review-fresh-context", "lineage-original-elixir-ema", "codebase-mission-control-claude"],
    docs: ["ema-003-lineage-architecture-synthesis.md", "ema-003-gleam-beam-bounded-contexts.md"],
    hardQuestions: [
      "Does personal AI read everything by default or only what is contextually targeted?",
      "Can spaces span projects without breaking the authority model?",
      "What identity model is simple enough to use but rich enough for real delegation?"
    ],
    deliverables: ["Atlas page", "Identity brief", "Graph route", "Canvas board", "Decision matrix"],
    visions: visionFor("identity", [
      {
        stance: "Identity stays strict: projects are hard boundaries and personal AI remains membership-scoped but deliberately constrained.",
        bet: "The system avoids accidental omniscience and privilege creep.",
        tension: "Strict scoping can make personal AI feel less magical than users expect.",
        question: "What level of magical reach is acceptable before it becomes invisible overreach?"
      },
      {
        stance: "Identity feels fluid in use, but hard boundaries still exist under the skin and are expressed through graceful targeting flows.",
        bet: "Users experience continuity across projects without forgetting where they are.",
        tension: "Graceful targeting can still hide high-stakes scope changes.",
        question: "How should EMA make scope visible without turning every action into a permission ceremony?"
      },
      {
        stance: "Identity becomes network-native: organizations, peers, spaces, and agents negotiate capability across a broader mesh.",
        bet: "EMA could support richer federated collaboration than traditional SaaS tenancy.",
        tension: "The more identity becomes negotiated, the more explanations become product-critical.",
        question: "What is the smallest trustworthy permission story for a future mesh EMA?"
      }
    ])
  },
  {
    slug: "mesh-replication",
    title: "Mesh / Replication / Presence",
    strapline: "How EMA grows beyond one machine without losing the thread",
    summary:
      "This part covers the strategic P2P direction: replication boundaries, authority leases, presence, peer placement, and what should converge versus what should remain explicitly arbitrated.",
    branches: ["docs-vault-wiki", "lineage-original-elixir-ema", "docs-host-vault-agent-modules-routing"],
    docs: ["ema-003-lineage-architecture-synthesis.md", "ema-003-github-cross-pollination-map.md"],
    hardQuestions: [
      "Which objects deserve CRDT-like convergence and which deserve explicit sequencing?",
      "What is the right first replication slice after single-node semantics are crisp?",
      "How much presence should EMA expose between humans and agents?"
    ],
    deliverables: ["Atlas page", "Replication deck", "Graph route", "Canvas board", "Presence demo"],
    visions: visionFor("mesh", [
      {
        stance: "Replication stays deliberately narrow at first: authority leases, append-only logs, and a tiny set of replica-friendly collaboration objects.",
        bet: "EMA earns trust before it earns complexity.",
        tension: "Narrow replication can make the future feel perpetually deferred.",
        question: "What is the smallest convincing mesh move that still feels strategic?"
      },
      {
        stance: "Replication is framed through collaboration and co-presence rather than infrastructure abstractions alone.",
        bet: "Users understand the mesh through lived experience: shared rooms, shared documents, shared activity.",
        tension: "Presence-heavy design can romanticize distributed state before authority is solved.",
        question: "Should users see the mesh, or only feel its effects?"
      },
      {
        stance: "EMA becomes a true peer commonwealth with portable work, portable memory, and relocatable authority.",
        bet: "The project fulfills its most ambitious distributed vision.",
        tension: "This path forces the hardest questions earliest: secrets, conflict, jurisdiction, governance.",
        question: "What governance model does EMA need before a mesh is a feature instead of a liability?"
      }
    ])
  }
];

export const docRegistry: DocEntry[] = [
  {
    title: "Deliverables Program",
    path: "/Users/tawj/Desktop/ema 0.0.3/ema-003-deliverables-program.md",
    note: "Cross-part program for routes, briefs, canvases, implementation tracks, and hard-question pressure.",
    kind: "backlog",
    status: "active",
    feeds: ["program", "showroom", "parts"]
  },
  {
    title: "Atlas Expansion Backlog",
    path: "/Users/tawj/Desktop/ema 0.0.3/ema-003-atlas-expansion-backlog.md",
    note: "Route backlog, artifact backlog, semantic-layer gaps, and surface-specific deliverable pressure.",
    kind: "backlog",
    status: "active",
    feeds: ["showroom", "docs", "graph", "desktop"]
  },
  {
    title: "Implementation Slices",
    path: "/Users/tawj/Desktop/ema 0.0.3/ema-003-implementation-slices.md",
    note: "Bounded-context priorities, first schema families, event streams, donors, and implementation guardrails.",
    kind: "implementation",
    status: "active",
    feeds: ["program", "parts", "docs"]
  },
  {
    title: "Surface Lineage Pack",
    path: "/Users/tawj/Desktop/ema 0.0.3/ema-003-surface-lineage-pack.md",
    note: "Preserve vs redesign guidance for HQ, Desktop, Wiki, Chat, Threads, and Files surfaces.",
    kind: "evidence",
    status: "growing",
    feeds: ["desktop", "showroom", "parts"]
  },
  {
    title: "Swarm Workspace Pack",
    path: "/Users/tawj/Desktop/ema 0.0.3/ema-atlas/content/swarm/README.md",
    note: "Repo-native support-lane coordination pack and entrypoint for the shared swarm workspace, its doctrine, object families, and alignment rules.",
    kind: "doctrine",
    status: "active",
    feeds: ["docs", "program", "showroom"]
  },
  {
    title: "Orchestration Kernel",
    path: "/Users/tawj/Desktop/ema 0.0.3/ema-atlas/content/swarm/orchestration-kernel.md",
    note: "The simplest control model for an active EMA swarm: one objective, one main lane, support lanes around it.",
    kind: "doctrine",
    status: "active",
    feeds: ["docs", "program"]
  },
  {
    title: "Active Wave",
    path: "/Users/tawj/Desktop/ema 0.0.3/ema-atlas/content/swarm/active-wave-current.md",
    note: "The live EMA swarm wave with one main deliverables lane, support lanes, risks, and stop rules.",
    kind: "backlog",
    status: "active",
    feeds: ["docs", "program", "showroom"]
  },
  {
    title: "Continuous Progress Protocol",
    path: "/Users/tawj/Desktop/ema 0.0.3/ema-atlas/content/swarm/continuous-progress-protocol.md",
    note: "Operational loop for lanes, claims, handoffs, drift handling, refresh cadence, and protected zones.",
    kind: "backlog",
    status: "active",
    feeds: ["docs", "program"]
  },
  {
    title: "Active Wave Template",
    path: "/Users/tawj/Desktop/ema 0.0.3/ema-atlas/content/swarm/active-wave-template.md",
    note: "A compact shared template for one live swarm wave with one main lane and a few support lanes.",
    kind: "backlog",
    status: "active",
    feeds: ["docs", "program"]
  },
  {
    title: "Orchestrator Alignment",
    path: "/Users/tawj/Desktop/ema 0.0.3/ema-atlas/content/swarm/orchestrator-alignment.md",
    note: "Contract for multiple orchestrators and supervisors sharing one swarm workspace without forking truth.",
    kind: "doctrine",
    status: "active",
    feeds: ["docs", "program"]
  },
  {
    title: "Swarm Object Model",
    path: "/Users/tawj/Desktop/ema 0.0.3/ema-atlas/content/swarm/object-model.md",
    note: "Canonical coordination vocabulary for lane, claim, handoff, queue, cadence, planner, and workstream objects.",
    kind: "implementation",
    status: "active",
    feeds: ["docs", "parts", "program"]
  },
  {
    title: "Swarm Repo Integration Map",
    path: "/Users/tawj/Desktop/ema 0.0.3/ema-atlas/content/swarm/repo-integration-map.md",
    note: "Backlink and routing contract tying the swarm pack into atlas routes, graph docs, questions, and playbooks.",
    kind: "evidence",
    status: "active",
    feeds: ["docs", "graph", "program"]
  },
  {
    title: "Fresh Orchestrator Read Order",
    path: "/Users/tawj/Desktop/ema 0.0.3/ema-atlas/content/swarm/fresh-orchestrator-read-order.md",
    note: "Lean read path for a new orchestrator joining active EMA work without drowning in the archive.",
    kind: "backlog",
    status: "active",
    feeds: ["docs", "program"]
  },
  {
    title: "Vision Guardrails",
    path: "/Users/tawj/Desktop/ema 0.0.3/ema-atlas/content/swarm/vision-guardrails.md",
    note: "Short anti-drift guardrails that pin the swarm to EMA's real product shape and surface semantics.",
    kind: "doctrine",
    status: "active",
    feeds: ["docs", "showroom", "program"]
  },
  {
    title: "No Drift Rules",
    path: "/Users/tawj/Desktop/ema 0.0.3/ema-atlas/content/swarm/no-drift-rules.md",
    note: "Practical stop, handoff, and anti-sprawl rules for active EMA swarms.",
    kind: "backlog",
    status: "active",
    feeds: ["docs", "program"]
  },
  {
    title: "Deliverables Support Lanes",
    path: "/Users/tawj/Desktop/ema 0.0.3/ema-atlas/content/swarm/deliverables-support-lanes.md",
    note: "Defines support lanes that strengthen alignment and repo hygiene while staying out of Claude's main deliverables write scope.",
    kind: "backlog",
    status: "active",
    feeds: ["docs", "program"]
  },
  {
    title: "Claude Deliverables Orchestrator Prompt",
    path: "/Users/tawj/Desktop/ema 0.0.3/ema-atlas/content/swarm/claude-deliverables-orchestrator-prompt.md",
    note: "Paste-ready prompt for a Claude orchestrator focused on EMA deliverables in drift-aware mode.",
    kind: "doctrine",
    status: "active",
    feeds: ["docs", "program"]
  },
  {
    title: "Claude Worker Prompt",
    path: "/Users/tawj/Desktop/ema 0.0.3/ema-atlas/content/swarm/claude-worker-prompt.md",
    note: "Smaller worker-only Claude prompt for one narrow lane inside the active EMA swarm.",
    kind: "backlog",
    status: "active",
    feeds: ["docs", "program"]
  },
  {
    title: "Lineage Architecture Synthesis",
    path: "/Users/tawj/Desktop/ema 0.0.3/ema-003-lineage-architecture-synthesis.md",
    note: "Doctrine, authority model, app topology, preserve vs redesign.",
    kind: "doctrine",
    status: "foundational",
    feeds: ["parts", "program", "graph"]
  },
  {
    title: "Gleam/BEAM Bounded Contexts",
    path: "/Users/tawj/Desktop/ema 0.0.3/ema-003-gleam-beam-bounded-contexts.md",
    note: "OTP app layout, schema ideas, runtime stance, shell model.",
    kind: "implementation",
    status: "foundational",
    feeds: ["parts", "program", "docs"]
  },
  {
    title: "Shared Agent Swarm Workspace",
    path: "/Users/tawj/Desktop/ema 0.0.3/ema-003-shared-agent-swarm-workspace.md",
    note: "Lanes, handoffs, queue items, planner, calendar, checkups.",
    kind: "doctrine",
    status: "growing",
    feeds: ["parts", "desktop", "showroom"]
  },
  {
    title: "Knowledge Graph Hub",
    path: "/Users/tawj/Desktop/ema 0.0.3/ema-003-knowledge-graph-hub.md",
    note: "Semantic layer seed wiki and concept graph.",
    kind: "evidence",
    status: "active",
    feeds: ["graph", "docs", "parts"]
  },
  {
    title: "GitHub Cross-Pollination Map",
    path: "/Users/tawj/Desktop/ema 0.0.3/ema-003-github-cross-pollination-map.md",
    note: "Branch families and bounded-context donor map.",
    kind: "evidence",
    status: "growing",
    feeds: ["graph", "docs", "parts"]
  },
  {
    title: "Recovery And Implementation Plan",
    path: "/Users/tawj/Desktop/ema 0.0.3/ema-003-recovery-and-implementation-plan.md",
    note: "Recovery lanes, donor mining, phased implementation order, and surface wiring priorities.",
    kind: "implementation",
    status: "growing",
    feeds: ["program", "docs", "parts"]
  },
  {
    title: "Shared Swarm Source Pack",
    path: "/Users/tawj/Desktop/ema 0.0.3/ema-003-shared-swarm-source-pack.md",
    note: "Confirmed evidence and donor patterns for shared coordination, planner, and swarm workspace objects.",
    kind: "evidence",
    status: "active",
    feeds: ["docs", "program", "showroom"]
  },
  {
    title: "Workboard",
    path: "/Users/tawj/Desktop/ema 0.0.3/ema-003-workboard.md",
    note: "Current local recovery wave and next source-mining lanes.",
    kind: "backlog",
    status: "active",
    feeds: ["program", "docs", "showroom"]
  },
  {
    title: "GitHub Branch Resource Inventory",
    path: "/Users/tawj/Desktop/ema 0.0.3/ema-003-github-branch-resource-inventory.md",
    note: "Catalog of branches, top-level contents, and source context for the transfer pack.",
    kind: "evidence",
    status: "growing",
    feeds: ["graph", "docs"]
  }
];

export const topLevelRoutes = [
  { href: "/", label: "Atlas" },
  { href: "/parts", label: "Parts" },
  { href: "/artifacts", label: "Artifacts" },
  { href: "/showroom", label: "Showroom" },
  { href: "/program", label: "Program" },
  { href: "/demo", label: "Demo" },
  { href: "/graph", label: "Graph" },
  { href: "/desktop", label: "Desktop" },
  { href: "/docs", label: "Docs" },
  { href: "/questions", label: "Questions" },
  { href: "/timeline", label: "Timeline" },
  { href: "/futures-board", label: "Futures" },
  { href: "/decisions", label: "Decisions" },
  { href: "/research", label: "Research" },
  { href: "/vapps", label: "vApps" },
  { href: "/launchpad", label: "Launchpad" },
  { href: "/hq", label: "HQ" },
  { href: "/wiki", label: "Wiki" },
  { href: "/chat", label: "Chat" },
  { href: "/threads", label: "Threads" }
];

export function getPart(slug: string) {
  return parts.find((part) => part.slug === slug);
}
