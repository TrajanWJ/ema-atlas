# Fresh Context — Project / Space / App Model (2026-04-22)

**Source:** direct user message in current thread  
**Status:** raw-but-important product/context note  
**Use:** design review input, app-model grounding, org/project/personal-AI semantics

## Confirmed new context from user

- Each instance of these apps / each EMA instance is **within a project**.
- Projects can belong to an **organization** or be **personal projects**.
- Projects/spaces can have **different datasets**.
- A user's **personal AI can access all projects/spaces they are part of**.

## Named app/interface concepts from user

### 1. Wiki — semantic layer
- shared Google Docs + Discord + Wikipedia + Obsidian feel
- can comment, edit, and prompt inline
- Claude.ai design UI mentioned as visual inspiration

### 2. Chat
- EMA-native interface to local models
- essentially EMA versions of Claude/Codex/Hermes GUIs combined
- forking and integrating foreign apps into EMA is essential
- harness engineering is essential
- EMA's role is not fully clear: sometimes a secondary harness over Claude/Codex/Hermes CLI, sometimes Hermes is the shared backbone
- Hermes is described as core to the system

### 3. Threads / Server
- EMA-integrated, EMA-first mirror of what Discord does now
- intended as migration path from Discord into EMA-native shared functionality
- still mirrored to Discord via webhooks
- with EMA control over the Discord-like surface, the system can gain stronger channel/category/thread types, message history control, visible multi-agent conversations/DMs, better context/history population, and deeper harness/context integration

### 4. Agent virtual environment app
- shows agent virtual calendar / self-dictated schedule / weekly phases
- plans around calendars and creates events, meetings, checkups
- also includes project management tools, todos, notes, organizational tools, queues, roles, etc.

### 5. Blueprint builder
- should integrate tightly with wiki system, Karpathy-style knowledge structuring, and intent capture
- partly overlaps with wiki inline-editing/prompting model

## Additional app categories mentioned

### Collaboration / productivity
- Miro-like
- Docs

### Executive functioning / personal assistant
- brain dump
- todo list
- schedule
- time blocking
- pomodoro
- responsibilities app ideas
- live agent analysis / feedback on time use

### Shared self-hosted / homelab
- shared files app with simulated OS filesystem, able to switch between EMA project filesystem and main computer filesystem
- shared images app
- other self-hosted shared applications

## Main app interfaces named by user

### Launchpad
- like Windows 8/start menu style launcher
- frame containing apps / vApps / useful info

### HQ
- unique per user and per project
- personal HQ aware of all projects and orgs
- dashboard of what is happening in business/project/coding work
- examples: live GitHub repos, client links, uptime awareness

### Main interface
- the **virtual desktop**
- accessible as an app in the native desktop app environment
- or on the website, like original place.org

## Strong design implications

- project and space scoping are not optional; they are core architecture
- personal AI has cross-project visibility subject to membership
- the product is explicitly multi-app, not one monolithic pane
- Discord mirroring is transitional, not the end-state center of gravity
- Hermes/EMA harness layering is still unresolved and must be made explicit in design review
- virtual desktop / launchpad / HQ are not just UI flourishes; they are top-level product surfaces
