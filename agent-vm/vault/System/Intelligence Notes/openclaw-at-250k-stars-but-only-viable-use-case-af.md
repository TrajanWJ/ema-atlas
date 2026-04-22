# OpenClaw at 250K stars but only viable use case after 1000+ deploys is daily news summaries — memory degradation in persistent agents is invisible and the core unsolved problem; narrow task-specific agents consistently beat general-purpose always-on agents

- **Category:** best-practice
- **Source:** 1f54fe61.txt
- **Applied:** 2026-04-13T21:06:30Z
- **Impact:** 3/5
- **Project:** EMA Phase 2 Implementation Guide

## Details

Save as memory/design guidance: when designing dispatch agents, prefer narrow single-task agents over persistent general-purpose ones. Validates existing dispatch architecture direction but adds concrete failure data (1000+ deploys, invisible memory drift). Update agent design docs to cite this as anti-pattern evidence.

## Source Context

Extracted from agent result: `1f54fe61.txt`

---
Tags: #intelligence #best-practice #auto-applied
