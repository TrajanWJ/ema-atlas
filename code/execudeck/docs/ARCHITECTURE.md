# Architecture: Peer Surfaces & Universal Containers

ExecuDeck is a local-first system where the **Tab** is the universal container for all missions, artifacts, and sessions.

## 1. Tabs: Windows into Artifacts
A Tab is the primary unit of the workspace. Its `kind` determines what it renders:
- **Session Tab**: A window into a generative terminal session (Intelligence).
- **Page Tab**: A window into a structured page artifact (Artifact).
- **Hybrid Tab**: A combined view (Split-screen) showing both.

The "Pages View" in the sidebar acts as a meta-navigator for all `Page` artifacts, which can then be opened in their own Tabs.

## 2. Peer Surface Layout (The Split-Screen)
Terminal and Pages are peers, synchronized via a unified event-sourced state.
- **50/50 Vertical Split**: This is the canonical state for human-in-the-loop review.
- **Coordination**: When a terminal-based agent (e.g., MD) proposes an artifact, the view splits vertically. CLI is on the left, GUI preview is on the right.
- **Continuity**: Context is preserved. User signature (Accept/Reject) happens in the GUI pane while narrative continues in the CLI.

## 3. The Proposal & Signature Loop
1. **Initiation**: Intent entered in a Session Tab (CLI).
2. **Execution**: Multi-agent delegation (EM -> Specialist) occurs.
3. **Drafting**: MD generates an A2UI-style **Declarative Manifest**.
4. **Preview**: Split-View is activated.
5. **Signature**: User accepts the proposal, promoting the draft to a persistent Page artifact.

## 4. Trust & Safety Zones
- **Zone 0 (Human)**: Absolute authority to sign state mutations.
- **Zone 1 (Renderer)**: Headless UI (Radix) + Registry-driven rendering. Zero agent-code execution.
- **Zone 2 (Orchestrator)**: Manages delegation tokens and lineage.
