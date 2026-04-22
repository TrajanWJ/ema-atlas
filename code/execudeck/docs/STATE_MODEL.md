# State Model: Entities & Persistence

The state model ensures parity between the Terminal and the Pages View.

## 1. Initial State Baseline
```text
System
├─ Overview
├─ Agents
│  ├─ Executive Management
│  └─ Meta-Development
├─ Pages
│  ├─ [Blank Page A]
│  └─ [Blank Page B]
└─ History
```

## 2. Core Entities
- **Tabs**: Persistent artifacts (not ephemeral). Bound to an Agent configuration.
- **Pages**: Structured manifests with nested nav metadata.
- **Agents**: Identities (Name, Scope, Tone, Call logic).
- **Proposals**: Unsigned state mutations.
- **Events**: The immutable log of all narrative, delegation, and meta-actions.

## 3. Persistence & Local-First
- **IndexedDB**: The primary store for message logs and manifest versions.
- **Local Undo/Redo**: Scoped to individual pages/tabs. Reverts manifest revisions.
- **Export/Import**: Full system snapshot support as JSON.

## 4. Contextual Referencing
- Agents can generate **Reference IDs** (e.g., A1, B2) for pages or tabs.
- These IDs are used in terminal commands (e.g., `/view A1`) or narrative text to quickly link between the two surfaces.
