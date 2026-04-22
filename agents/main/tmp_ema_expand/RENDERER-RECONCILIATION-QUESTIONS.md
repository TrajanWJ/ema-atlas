# Renderer Reconciliation Questions

## Main question
Which renderer surfaces are:
- real now
- migration scaffolding
- misleading/stale
- deferred
- should be merged/removed

## Required outputs
- tiered surface table
- shell concept vs vApp distinction
- migration-only labels
- canonical backing object for each real surface

## Risk
Without this, the renderer keeps pretending broader completeness than the underlying runtime actually supports.
