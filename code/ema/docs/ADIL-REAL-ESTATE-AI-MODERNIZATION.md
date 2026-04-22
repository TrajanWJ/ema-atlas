# Adil Real Estate AI — EMA/Hermes Modernization Note

## Purpose
Translate the recovered old OpenClaw/Discord real-estate workspace into the newer EMA/Hermes architecture without preserving the old surface-as-state coupling.

## Recovered source
Recovered artifact root:
- `/home/trajan/Projects/ema/recovered/adil/real-estate-ai-openclaw-src`

Recovery note:
- `/home/trajan/Projects/ema/recovered/adil/RECOVERY.md`

## Old model
The old system was designed as a Discord/OpenClaw operating environment with many domain lanes.
That was useful for collaboration, but it mixed:
- human coordination
- workflow identity
- agent runtime
- durable project state

## Modern model
### EMA owns
- project definition
- intent/proposal/execution lineage
- canonical workflow state
- review/approval points
- cross-peer routing policy

### Hermes owns
- agent execution
- provider/runtime selection
- tool invocation
- subagent/delegation behavior
- surface streaming and response delivery

### Discord/web own
- operator interaction
- visibility
- mirrored status and output
- lightweight control inputs

## Recommended first revival pass
### Phase 1 — import as reference
Treat the old recovered files as design/reference artifacts, not live truth.

### Phase 2 — rebuild shared backbone in EMA/Hermes terms
Recreate these first as modern workflows:
1. Opportunity intake
2. Lead enrichment
3. Strategy routing
4. Follow-up orchestration
5. KPI reporting

### Phase 3 — revive one revenue lane only
Start with wholesaling MVP:
- off-market list building
- distress monitoring
- seller motivation scoring
- response triage
- fast underwriting

### Phase 4 — reconnect surfaces
Only after the workflow exists in EMA/Hermes should Discord categories/channels be created to mirror it.

## Mapping table
- old Discord lane -> EMA workflow / Hermes execution target
- old OpenClaw session -> EMA execution lineage + Hermes session binding
- old lane docs -> EMA project reference docs
- old operator prompts -> Hermes system/task templates

## Current blocker
EMA daemon is unreachable from this machine right now, so this recovery is file-level and architectural, not yet live-control-plane ingestion.

## Operator note
If/when Discord provisioning is available again, create surfaces that mirror this split:
- Adil personal
- Adil real-estate AI
- optional sub-surfaces for house / land / shared backbone

But do not let those categories become the source of truth again.