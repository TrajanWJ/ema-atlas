# T3 Code Fork — Attachment / Terminal / Dispatch / Secrets Steal Plan

## Source focus
`~/Projects/t3code-fork`

## Why this matters
This codebase already appears to implement a mature version of several things EMA still needs badly:
- local CLI agent attachment
- simulated/live terminal handling through PTY layers
- provider-neutral runtime management
- dispatch/runtime orchestration
- session directories and event logging
- secrets/provider account handling
- desktop/web/server mirrored architecture

## Strong evidence from code layout
Server/runtime side includes:
- `apps/server/src/terminal/Layers/NodePTY.ts`
- `apps/server/src/terminal/Layers/BunPTY.ts`
- `apps/server/src/terminal/Layers/Manager.ts`
- `apps/server/src/terminal/Services/PTY.ts`
- `apps/server/src/terminal/Services/Manager.ts`
- `apps/server/src/orchestration/runtimeLayer.ts`
- `apps/server/src/provider/Layers/ProviderRegistry.ts`
- `apps/server/src/provider/Layers/ProviderAdapterRegistry.ts`
- `apps/server/src/provider/Layers/ProviderService.ts`
- `apps/server/src/provider/Layers/ProviderSessionDirectory.ts`
- `apps/server/src/provider/Layers/ClaudeProvider.ts`
- `apps/server/src/provider/Layers/CodexProvider.ts`
- `apps/server/src/provider/Layers/ClaudeAdapter.ts`
- `apps/server/src/provider/Layers/CodexAdapter.ts`
- `apps/server/src/provider/Layers/EventNdjsonLogger.ts`
- `apps/server/src/provider/codexAppServer.ts`
- `apps/server/src/codexAppServerManager.ts`
- `apps/server/src/provider/codexAccount.ts`
- `apps/server/src/provider/codexCliVersion.ts`

Web/runtime side includes:
- `apps/web/src/environments/runtime/connection.ts`
- `apps/web/src/environments/runtime/service.ts`
- `apps/web/src/environments/runtime/catalog.ts`
- `apps/web/src/terminalStateStore.ts`
- `apps/web/src/terminalActivity.ts`
- `apps/web/src/lib/terminalContext.ts`
- `apps/web/src/session-logic.ts`

Shared contracts/runtime packages include:
- `packages/contracts/src/terminal.ts`
- `packages/contracts/src/providerRuntime.ts`
- `packages/contracts/src/provider.ts`
- `packages/client-runtime/src/index.ts`
- `packages/client-runtime/src/knownEnvironment.ts`
- `packages/client-runtime/src/scoped.ts`

## What EMA should steal directly

### 1. PTY / terminal layering
Steal the structural idea of:
- PTY abstraction layer
- manager layer over PTYs
- service layer over manager

EMA benefit:
- contextual terminal can stop being ad hoc
- terminal can become one reusable subsystem for CLI agents, GUI humans, and live host sessions

### 2. Provider-neutral runtime registry
Steal the pattern of:
- provider registry
- adapter registry
- provider service
- provider session directory
- event logger

EMA benefit:
- Claude/Codex/OpenClaw/local runtime can share one normalized control surface
- workstream identity can bind to provider session more cleanly

### 3. Session directory + event NDJSON logging
Steal the idea of:
- normalized provider session directory
- event log appenders
- server-authoritative event capture

EMA benefit:
- chronicle/review/recall becomes easier to feed from live coding-agent sessions
- import/replay/babysitter supervision gets dramatically simpler

### 4. Runtime connection/catalog in web layer
Steal the pattern of:
- runtime catalog
- runtime connection service
- terminal state store
- session logic isolated from view components

EMA benefit:
- GUI surfaces can mirror runtime truth without burying logic in components
- HQ / Agent Live / Code vApp become cleaner

### 5. Contracts package for terminal/provider/runtime
Steal the discipline of:
- shared contracts package
- typed provider runtime definitions
- typed terminal definitions

EMA benefit:
- CLI↔GUI parity gets a real contract boundary
- code vApp can share truth with host ops and agent work surfaces

### 6. Secrets/provider account handling
Steal the structure and threat model from provider account / server manager / runtime config code.

EMA benefit:
- secrets stop becoming random settings blobs
- code vApp and host/agent runtime can share one safe secrets strategy

## What EMA should adapt, not clone blindly
- exact provider implementations
- exact naming
- assumptions specific to T3 product UX
- exact server topology if it conflicts with EMA runtime-fabric/control-plane model

## Best direct integration targets inside EMA

### Current EMA areas to connect this into
- `services/core/runtime-fabric/*`
- `services/core/orchestrator/*`
- terminal / machine / host-ops surfaces
- future code vApp
- chronicle/review import paths
- CLI↔GUI parity contract
- workstream identity + provider session binding

## Immediate planning consequence
The future EMA code vApp should not start from a blank slate.
It should explicitly inherit from this architecture shape:
- contracts package
- client runtime package
- provider-neutral runtime registry
- PTY manager stack
- session directory + event logging
- desktop/web/server mirrored surfaces
