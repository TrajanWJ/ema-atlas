---
title: SciTeX — Modular Python Toolkit for Scientific Research Automation
created: '2026-03-18'
updated: '2026-03-18'
type: research
status: active
source: unknown
wiki_id: research/scitex-concepts
imported_from: vault/Research/scitex-concepts.md
imported_at: '2026-04-04T00:23:57.172Z'
tags: []
summary: ''
---

# SciTeX — Modular Python Toolkit for Scientific Research Automation

**Source:** [ywatanabe1989/scitex-python](https://github.com/ywatanabe1989/scitex-python) · [Docs](https://scitex-python.readthedocs.io) · AGPL-3.0
**Version:** v2.25.0 · 120+ MCP tools (originally claimed 293 across full ecosystem)

## What It Is

Unified Python toolkit for the entire scientific research lifecycle: literature search → statistical analysis → publication figures → LaTeX manuscript → peer review simulation. One import: `import scitex as stx`.

**Demo claim:** 40 minutes, minimal human intervention — AI agent completed full research cycle including 21-page manuscript + peer review simulation.

## Core Architecture

### Three-Layer Ecosystem
```
scitex (orchestrator) → CLI, MCP server, templates
  ├── scitex-app      → Runtime SDK (file I/O, config, validation)  
  ├── scitex-ui       → React/TS components (workspace, data-table)
  └── scitex-plt      → figrecipe (figures, diagrams, recipes)
```

### Module Categories
| Category | Key Modules | Purpose |
|----------|------------|---------|
| **Core** | session, io, config, clew | Experiment tracking, I/O, cryptographic verification |
| **Analysis** | stats, plt, dsp, linalg | 23 statistical tests w/ effect sizes, publication plots |
| **Research** | scholar, writer, diagram | Literature search, LaTeX manuscripts, diagrams |
| **ML/AI** | ai, nn, torch, cv | LLM APIs, neural nets, PyTorch, computer vision |
| **Data** | pd, db, dataset, schema | Pandas, databases, scientific datasets (DANDI, OpenNeuro) |
| **Infra** | app, cloud, tunnel, container | App SDK, cloud platform, SSH, Docker |
| **Automation** | browser, capture, audio | Playwright, screenshots, TTS, notifications |

## Key Concepts

### 1. `@stx.session` — Reproducible Experiment Tracking

The core abstraction. Wraps any function and provides:
- **Auto-CLI generation:** Function params become `--flags`
- **YAML config injection:** `./config/*.yaml` merged + injected via `CONFIG=stx.INJECTED`
- **Structured output:** `script_out/FINISHED_SUCCESS/<timestamp>/`
- **Automatic logging:** stdout/stderr captured
- **Provenance tracking:** File hashes recorded to SQLite

```python
@stx.session
def main(lr=0.001, epochs=100, CONFIG=stx.INJECTED, plt=stx.INJECTED, logger=stx.INJECTED):
    """Docstring becomes --help text."""
    # ... your experiment
    return 0  # exit code determines FINISHED_SUCCESS vs FINISHED_ERROR
```

**Config priority:** CLI flags > config files > function defaults

### 2. Clew — Cryptographic Verification (SHA-256 Hash-Chain DAGs)

**The paradigm shift:** Not "could this be reproduced?" but "has this been verified?"

How it works:
1. `@stx.session` starts tracking
2. `stx.io.load()` records input file hashes
3. `stx.io.save()` records output file hashes
4. Session close computes combined hash of all inputs/outputs
5. Later, verify nothing has changed

**Three verification levels:**
| Level | Method | Speed | What It Catches |
|-------|--------|-------|-----------------|
| L1 CACHE | Hash comparison | ms | File tampering, accidental modification |
| L2 RERUN | Sandbox re-execution | min | Logic errors, non-determinism |
| L3 STAMP | Registered timestamp proof | — | Temporal claims ("this existed before X") |

**19 API functions:**
```python
stx.clew.status()              # git-status-like overview
stx.clew.chain("output.png")   # Trace file → source chain
stx.clew.dag(claims=True)      # Verify full DAG with manuscript claims
stx.clew.add_claim(...)        # Register manuscript assertion with source link
stx.clew.verify_claim("Fig 1") # Is this assertion still valid?
stx.clew.mermaid(claims=True)  # Visualize provenance DAG
stx.clew.rerun(target)         # Re-execute in sandbox and compare
```

**Dependency chains:** Cross-session linking — if script B loads script A's output, the parent-child relationship is automatic.

### 3. `stx.io` — Universal I/O (30+ Formats)

Single interface for all formats. Format detected from extension.
- Figures: PNG + auto-exported CSV data + YAML recipe
- Data: CSV, NPY, HDF5, Parquet, MAT, pickle
- Config: YAML, JSON
- Models: PyTorch state_dict

### 4. 120+ MCP Tools

AI agents run statistics, create figures, search literature, compile manuscripts through structured MCP tool calls. Full research lifecycle accessible to any MCP-compatible agent.

## Four Freedoms for Research (AGPL-3.0)

1. **Run** your research anywhere — your machine, your terms
2. **Study** how every step works — from raw data to final manuscript
3. **Redistribute** your workflows, not just your papers
4. **Modify** any module and share improvements

## Application to Agent System Design

### Every agent task = a reproducible experiment
| SciTeX Concept | Agent Equivalent |
|----------------|-----------------|
| `@stx.session` | Agent run with logged inputs, model, timestamp, tools, outputs |
| Clew hash chains | Evidence chains linking findings to source URLs |
| `stx.io.save()` YAML recipes | Prompt version history, parameterized skill files |
| Config priority system | SOUL.md > skill config > default behavior |
| `FINISHED_SUCCESS` / `FINISHED_ERROR` | Agent completion status codes |
| Mermaid DAG visualization | Task dependency visualization across agents |

### The key insight for our system
The question isn't "could an agent redo this research?" — it's "can we prove this finding is backed by real sources?" Every claim in the vault should trace back to a URL, a search query, or a tool call.

## Related
- [[Auto-Prompt Optimization]] — AdalFlow's trainable parameters
- [[Scientific Method for Agents]] — Integration architecture
