# Real Estate Agent System

This folder is the build scaffold for the Discord-based real estate agent network.

## Purpose
Create a multi-division AI operating system for real estate acquisition and execution across:
- Wholesaling
- Buy & Hold / Rental
- Multifamily / Commercial
- Land / Development

## Core design
The system is built in three layers:

1. **Shared infrastructure**
   - intake
   - enrichment
   - routing
   - follow-up orchestration
   - KPI/reporting

2. **Division specialists**
   - each division has sourcing, underwriting, triage, and execution lanes

3. **Execution support**
   - workflows
   - prompts
   - tool access definitions
   - handoff contracts

## Files
- `MASTER-ARCHITECTURE.md` — system-wide design
- `AGENT-REGISTRY.yaml` — machine-readable registry of agents
- `TOOL-ACCESS-MATRIX.md` — what each agent should be allowed to use
- `WORKFLOW-SET.md` — end-to-end workflows and routing rules
- `MVP-BUILD-ORDER.md` — staged autonomous implementation order

## Principle
Do not build all autonomy at once.
Build:
1. standardized intake
2. shared data schema
3. routing
4. underwriting helpers
5. follow-up and reporting

Then deepen each division.
