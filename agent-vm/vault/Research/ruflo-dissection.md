# Ruflo (claude-flow) v3.5 — Full Dissection

**Source:** https://github.com/ruvnet/ruflo
**Analyzed:** 2026-03-24
**Verdict:** Solid ideas, mixed execution. Several concepts map directly onto our system. Code quality varies — some modules are production-grade, others are scaffolding.

## What It Is

Enterprise multi-agent orchestration platform for Claude Code. Originally "claude-flow", rebranded to Ruflo. ~787K lines of TypeScript across v2 and v3 monorepos. v3 is the real meat — modular packages under `@claude-flow/` namespace.

## Architecture Overview

```
User → CLI/MCP → Router (Q-Learning + MoE) → Swarm Coordinator → 60+ Agents → Memory/LLM Providers
                                                     ↑                              ↓
                                                     └──── Learning Loop ←──────────┘
```

Key difference from our setup: Ruflo coordinates agents **within** Claude Code via hooks and MCP tools. We coordinate agents **around** Claude Code via OpenClaw sessions. Different layer, but the coordination patterns are transferable.

## Module Breakdown (v3)

### 🏆 High Value — Directly Applicable

#### 1. HNSW Vector Index (`@claude-flow/memory`)
- **What:** Pure TypeScript HNSW (Hierarchical Navigable Small World) implementation
- **Quality:** Excellent. Proper binary heap priority queues, pre-normalized vectors for O(1) cosine similarity, quantization support (binary, scalar, product)
- **Lines:** ~1,013 LOC, self-contained
- **Applicable:** We could use this for semantic search in our vault instead of/alongside QMD embeddings. Local vector search without external dependencies.
- **Performance claims:** 150x-12,500x vs brute force (realistic for HNSW)

#### 2. Pattern Learner (`@claude-flow/neural`)
- **What:** Extracts patterns from agent trajectories, clusters them, evolves them based on outcomes
- **Quality:** Clean implementation. K-means clustering, EMA-based quality tracking, pattern merge/split operations
- **Lines:** ~757 LOC
- **Applicable:** This is basically a formalized version of our `workflow-patterns.json` + `agent-performance.md` system. Could replace our ad-hoc tracking with proper vector-based pattern matching.
- **Key concepts:**
  - Pattern extraction from agent trajectories → crystallization candidates
  - Cosine similarity matching for "have I seen this before?"
  - Evolution via exponential moving average
  - Automatic pruning of low-performing patterns

#### 3. Work Stealing (`@claude-flow/claims`)
- **What:** Redistributes work from stale/blocked/overloaded agents to available ones
- **Quality:** Very well-designed. Grace periods, progress protection, cross-type stealing rules, contest mechanism (original owner can contest a steal)
- **Lines:** ~807 LOC
- **Applicable:** We don't have this and should. When an agent times out or gets stuck, we manually retry. This automates it with configurable thresholds:
  - Stale detection (no activity for N minutes)
  - Blocked detection (waiting on dependency too long)
  - Overload detection (agent has too many claims)
  - Contest window (original agent can fight to keep the task)

#### 4. ReasoningBank (`@claude-flow/hooks`)
- **What:** Pattern-based guidance for agent routing. Stores successful strategies as vectors, retrieves them for similar future tasks
- **Quality:** Good architecture, uses HNSW + ONNX embeddings
- **Lines:** ~1,090 LOC
- **Applicable:** This is the "self-learning" piece — when a coder succeeds at a TypeScript refactor, the strategy gets stored. Next time a similar task comes in, the system retrieves that pattern and suggests the same approach. Maps onto our evolution signals system.

### 📊 Medium Value — Concepts Worth Porting

#### 5. Task Orchestrator (`@claude-flow/swarm`)
- **What:** Task decomposition, dependency DAG, priority queue, lifecycle management
- **Quality:** Solid but standard. Cycle detection, priority ordering, metrics tracking
- **Lines:** ~605 LOC
- **Applicable:** We already have dispatch protocol in AGENTS.md but it's informal. This formalizes: task states (pending→queued→assigned→in-progress→completed/failed), dependency blocking, automatic retry with count limits, and throughput metrics.

#### 6. Raft Consensus (`@claude-flow/swarm/consensus`)
- **What:** Leader election and log replication for distributed coordination
- **Quality:** Simplified but functional. In-process peer simulation (not networked)
- **Lines:** ~443 LOC
- **Applicable conceptually:** When multiple agents work on the same problem (our "diverge" pattern), having a consensus mechanism to resolve conflicts is valuable. Not directly portable (our agents aren't networked peers) but the voting/quorum concepts apply.

#### 7. Hooks System (`@claude-flow/hooks`)
- **What:** Pre/post task hooks that intercept Claude Code operations for routing, optimization, and learning
- **Lines:** Multiple modules totaling ~2K LOC
- **Applicable:** The "Agent Booster" concept is clever — simple code transforms (var→const, add types, etc.) get handled by WASM/regex instead of calling the LLM. We could implement something similar for trivial tasks.

### 📉 Lower Value — Interesting but Over-Engineered

#### 8. Neural Algorithms (PPO, DQN, SARSA, A2C, Decision Transformer)
- Full RL algorithm implementations in TypeScript
- Impressive scope but questionable utility — these are toy implementations compared to PyTorch equivalents
- The Q-Learning router is the most practical piece

#### 9. Byzantine Fault Tolerance / Gossip Protocol
- Academic implementations of distributed consensus
- Overkill for our use case (we trust our own agents)
- Byzantine makes sense if you're running untrusted agent code

#### 10. Guidance/WASM Kernel
- Policy engine compiled to WebAssembly
- Proof system, trust scores, adversarial detection
- Enterprise-y features we don't need

## What We Should Port

### Immediate (high ROI, low effort)

1. **HNSW Index** → Drop into our vault search as a local vector index
   - Replace brute-force similarity in pattern matching
   - Use for fast "have I seen this before?" checks in dispatch
   - ~1K LOC, zero external deps

2. **Work Stealing Concepts** → Add to our dispatch protocol
   - Stale agent detection (already partially in our timeout/fallback chains)
   - Formalize grace periods and progress protection
   - Auto-redistribute when agents fail

3. **Pattern Tracking Upgrade** → Replace workflow-patterns.json with vector-based
   - Store dispatch patterns as embeddings
   - Match new tasks against historical patterns
   - EMA-based quality evolution (already partially in agent-performance.md)

### Medium-term (moderate effort, good concepts)

4. **Task State Machine** → Formalize our TASKS.md tracking
   - Proper state transitions: pending→queued→assigned→in-progress→blocked→completed/failed
   - Dependency DAG for complex multi-agent work
   - Auto-retry with configurable limits

5. **Agent Routing via Similarity** → Improve our dispatch routing
   - Instead of keyword matching in AGENTS.md, embed the task description
   - Match against historical success patterns per agent
   - "Coder succeeded on 12 TypeScript tasks, Researcher on 0" → route TypeScript to Coder

6. **Simple Task Bypass** → Agent Booster concept
   - Detect trivially simple requests
   - Handle directly instead of spawning a full agent
   - Saves tokens and time on low-complexity work

### Skip (not worth porting)

- RL algorithms (toy implementations)
- Byzantine consensus (we trust our agents)
- WASM kernel (over-engineered for our scale)
- Full MCP integration (we have OpenClaw's MCP)
- Claude Code hooks (different architecture)

## Code Quality Assessment

| Module | Quality | Notes |
|--------|---------|-------|
| HNSW Index | ⭐⭐⭐⭐⭐ | Production-grade, well-optimized |
| Pattern Learner | ⭐⭐⭐⭐ | Clean, well-structured |
| Work Stealing | ⭐⭐⭐⭐ | Thorough edge case handling |
| Task Orchestrator | ⭐⭐⭐ | Solid but standard |
| ReasoningBank | ⭐⭐⭐ | Good concepts, heavy on abstractions |
| Raft Consensus | ⭐⭐⭐ | Simplified, in-process only |
| Neural/RL | ⭐⭐ | Impressive scope, impractical |
| Agent configs | ⭐⭐ | Thin YAML, not much substance |

## Key Takeaway

Ruflo's best contribution is the **learning loop**: extract patterns from what worked → store as vectors → match future tasks against patterns → route to best agent → evolve patterns based on outcomes. This is exactly the crystallization concept we have in AGENTS.md but formalized with proper vector math instead of JSON counters.

The work-stealing system is the other gem — it solves the "agent went dark" problem we handle manually today.

## Links
- [[Agent Performance]] — our current tracking
- [[Self-Critique and Auto-Evolution Design]] — our evolution system
- [[Workflow Patterns]] — what pattern tracking would replace
