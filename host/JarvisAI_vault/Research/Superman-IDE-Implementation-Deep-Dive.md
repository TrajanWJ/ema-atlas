# Superman-IDE Complete Deep Dive Research Report

> **Generated**: 2026-04-03
> **Source**: ~/Desktop/superman/ — `src/`, `codevault-mcp/`, `docs/`
> **Purpose**: Implementation-level reference for porting intelligence subsystems to EMA

---

## 1. Complete Architecture Map

### 1.1 Core Engine (Autonomous Loop + State)

| File | Purpose | Key Exports | Dependencies | Role |
|------|---------|-------------|--------------|------|
| `src/autonomous-engine.ts` | Main 5-iteration autonomous improvement loop | `runAutonomous()`, `buildProjectModel()`, `validate()` | parser, graph-builder, embeddings, vector-store, KnowledgeGraph, traversal, simulation, modification, runner, intent-graph, auto-intent-generator, gap-engine, planner, working-memory, flow-engine, focus-engine, flow-index | **Orchestrator** — drives the full index→model→gaps→plan→execute→validate→learn cycle |
| `src/working-memory.ts` | Persistent cross-iteration state | `WorkingMemory` class | experience-store, types | **State hub** — loads/saves `.codevault-memory.json`, tracks gaps, plan, decisions, experiences, changed files |
| `src/experience-store.ts` | Learning from past actions via embeddings + keyword search | `findSimilarExperiences()`, `indexExperience()`, `adjustConfidence()`, `buildExperienceContext()`, `buildPlanningContext()` | semantic/embeddings, types | **Learning engine** — cosine similarity search over experience embeddings, confidence adjustment |
| `src/planner.ts` | Converts gaps into dependency-ordered executable steps | `createPlan()`, `orderStepsByFileDependency()`, `buildRichNodeContext()` | ai/claude-client, KnowledgeGraph, traversal, experience-store, types | **Planning** — LLM-generated steps with rich code context, system priority ordering |
| `src/project-manager.ts` | Background indexing singleton, panel data computation | `setActiveProject()`, `getPanelData()`, `reindex()` | parser, graph-builder, KnowledgeGraph, flow-engine, auto-intent-generator, embeddings, bm25, flow-index, gap-engine, focus-engine, working-memory, cache, watcher, openai-embeddings, vector-store | **Project lifecycle** — instant file tree, async deep indexing, cache management |

### 1.2 Code Analysis (Parsing + Graph)

| File | Purpose | Key Exports | Dependencies | Role |
|------|---------|-------------|--------------|------|
| `src/parser/index.ts` | Repository-wide file parsing with incremental hashing | `parseRepository()` | glob, parser/extractor, parser/incremental | **Entry point** — globs SOURCE_PATTERNS, skips unchanged files via SHA256 hash cache |
| `src/parser/extractor.ts` | AST extraction from individual files | `extractFromFile()` | @ast-grep/napi, component-analyzer | **AST engine** — 3-pass extraction: nodes+edges → intra-file calls → React component analysis |
| `src/parser/incremental.ts` | File hash caching for incremental updates | `FileHashCache` class | crypto, KnowledgeGraph | **Cache layer** — SHA256 content hashing, reverse-dep invalidation |
| `src/structural/graph-builder.ts` | Cross-file dependency edge resolution | `buildDependencyGraph()` | types | **Edge resolver** — 5-pass: collect exports → resolve imports → resolve extends/implements → resolve cross-file calls → cleanup |
| `src/graph/knowledge-graph.ts` | In-memory code graph with forward/reverse adjacency maps | `KnowledgeGraph` class | types | **Graph store** — nodes Map, edges array, forward/reverse adjacency maps, BFS subgraph extraction |
| `src/graph/traversal.ts` | Graph query algorithms | `getCallChain()`, `getReverseDependencies()`, `findCycles()`, `topologicalSort()`, `bfs()`, `dfs()`, `findPath()` | KnowledgeGraph | **Graph algorithms** — BFS, DFS, shortest path, cycle detection (DFS coloring), Kahn's topo sort |

### 1.3 Semantic Search + Embeddings

| File | Purpose | Key Exports | Dependencies | Role |
|------|---------|-------------|--------------|------|
| `src/semantic/embeddings.ts` | Hybrid embedding generation (local → TF-IDF fallback) | `generateEmbedding()`, `generateEmbeddings()`, `createNodeEmbeddingText()` | semantic/tfidf, semantic/local-embeddings | **Embedding router** — tries local transformers first, falls back to TF-IDF random projection (1536D) |
| `src/semantic/tfidf.ts` | TF-IDF term weighting + random projection | `TFIDFIndex` class, `tokenize()`, `projectToDense()` | — | **Baseline search** — IDF = log(N/df), TF = count/maxTf, cosine similarity on sparse vectors, seeded random projection to 1536D |
| `src/semantic/bm25.ts` | BM25 keyword search via MiniSearch | `BM25Index` class | minisearch | **Keyword search** — code-aware tokenizer (camelCase split), boost weights: name=5, filePath=1.5, content=1, fuzzy=0.2 |
| `src/semantic/local-embeddings.ts` | Local transformer embeddings | `generateLocalEmbedding()`, `generateLocalEmbeddingsBatch()` | @huggingface/transformers | **Local ML** — Xenova/jina-embeddings-v2-base-code (768D), fallback: Xenova/all-MiniLM-L6-v2 (384D) |
| `src/semantic/openai-embeddings.ts` | OpenAI API embeddings (optional) | `generateOpenAIEmbedding()`, `generateOpenAIEmbeddingsBatch()` | — (fetch API) | **Cloud embeddings** — text-embedding-3-small, batch size 100, 30K char truncation |
| `src/semantic/vector-store.ts` | Qdrant vector DB integration (optional) | `initCollection()`, `upsertNodes()`, `searchSimilar()` | @qdrant/js-client-rest | **Vector DB** — 1536D cosine distance, FNV-1a hash for point IDs, batch 100 |
| `src/semantic/flow-index.ts` | Flow-specific semantic index | `FlowVectorIndex` class, `buildFlowIndex()` | semantic/embeddings, graph/traversal | **Flow search** — 3-layer index: flows → systems/actions → code nodes (top 200 important) |
| `src/semantic/multi-signal.ts` | Multi-signal node similarity scoring | `scorePair()`, `findSimilar()` | KnowledgeGraph, TFIDFIndex | **Pair scoring** — W: TF-IDF=0.40, Import=0.20, Signature=0.20, CallGraph=0.20 |

### 1.4 Retrieval Pipeline

| File | Purpose | Key Exports | Dependencies | Role |
|------|---------|-------------|--------------|------|
| `src/retrieval/pipeline.ts` | Orchestrates all retrieval stages | `retrieve()` | decomposer, candidate-generator, graph-expander, smart-traversal, reranker, hierarchical, cache, query-rewriter | **Pipeline orchestrator** — decompose → candidates → expand → rerank → cross-encode → hierarchical |
| `src/retrieval/decomposer.ts` | Splits compound queries into sub-queries | `decompose()` | — | **Query splitter** — heuristic: connection patterns, "and" split (skip related conjunctions) |
| `src/retrieval/candidate-generator.ts` | Three-retriever parallel candidate generation | `generateCandidates()` | bm25, flow-index, embeddings, openai-embeddings | **Candidate gen** — BM25 (30 results) + FlowIndex (15) + OpenAI (15), max-score merge |
| `src/retrieval/graph-expander.ts` | Legacy 1-hop neighbor expansion | `expandGraph()` | KnowledgeGraph | **Deprecated** — fixed 0.5 decay, top 20, 3 per edge type |
| `src/retrieval/smart-traversal.ts` | Query-aware graph expansion with dynamic decay | `smartExpand()`, `detectQueryIntent()` | KnowledgeGraph | **Smart expansion** — intent-aware edge prioritization, per-edge-type decay (0.3–0.8), selective 2-hop (threshold 0.7) |
| `src/retrieval/reranker.ts` | Multi-signal reranking + LLM cross-encoder | `rerank()`, `rerankWithCrossEncoder()`, `shouldTriggerLLMRerank()` | semantic/tfidf, bm25, KnowledgeGraph, cross-encoder | **Reranker** — W: BM25=0.35, Keyword=0.20, Centrality=0.20, Source=0.25; optional LLM rerank |
| `src/retrieval/hierarchical.ts` | Three-level diversity enforcement | `applyHierarchicalRetrieval()` | KnowledgeGraph | **Diversity** — file grouping → classification (entry/business/data) → max 3 per file |
| `src/retrieval/cache.ts` | Two-level caching (disk index + LRU query) | `saveIndexCache()`, `loadIndexCache()`, `getCachedQuery()`, `setCachedQuery()` | candidate-generator | **Cache** — disk: .codevault-cache.json v3 (mtime staleness), memory: LRU 50 entries |
| `src/retrieval/query-rewriter.ts` | LLM-powered query expansion + heuristic fallback | `rewriteQuery()`, `heuristicExpand()` | — | **Query expansion** — LLM extracts concepts/actions/components/fileTypes, 2s timeout → heuristic fallback |
| `src/retrieval/types.ts` | Shared retrieval types | `ScoredCandidate`, `RetrievalOptions`, `PipelineResult` | types | **Types** — RetrieverSource: 'bm25' \| 'local-embeddings' \| 'openai' \| 'graph-expansion' |

### 1.5 Intent Graph + Flow Analysis

| File | Purpose | Key Exports | Dependencies | Role |
|------|---------|-------------|--------------|------|
| `src/intent-graph.ts` | Multi-level intent graph data structure | `IntentGraph` class | types | **Graph structure** — 5 levels (0=product, 1=flow/system, 2=action/feature, 3=system behavior, 4=code), status propagation |
| `src/auto-intent-generator.ts` | Intent graph generation (delegates to flow-generator) | `generateIntentGraph()`, `updateIntentGraph()` | flow-generator, KnowledgeGraph | **Generator entry** — delegates to flow-first strategy |
| `src/flow-generator.ts` | Flow-first intent graph construction | `generateFlowIntentGraph()`, `updateFlowIntentGraph()` | intent-graph, ai/claude-client, KnowledgeGraph, traversal | **Flow-first builder** — detects page/API/component/journey flows, LLM for missing flows, bottom-up status propagation |
| `src/flow-engine.ts` | User flow detection and complete flow tracing | `detectFlows()`, `traceCompleteFlow()`, `traceAllFlows()` | KnowledgeGraph, traversal | **Flow detector** — page flows, interactive components, cross-page journeys; complete chain tracing with broken step detection |
| `src/gap-engine.ts` | Gap detection (7 structural patterns + LLM) | `analyzeGaps()`, `analyzeGapsFromIntentGraph()` | KnowledgeGraph, traversal, flow-engine, ai/claude-client | **Gap analysis** — missing systems, incomplete flows, broken integrations, architectural issues, component gaps, flow chain gaps, LLM-enhanced gaps |
| `src/focus-engine.ts` | Priority ranking of what to work on | `getRecommendedFocus()` | types | **Focus ranker** — multi-factor score (0-100): incompleteness + gap density + missing steps + low confidence + critical boost |

### 1.6 Code Modification + Execution

| File | Purpose | Key Exports | Dependencies | Role |
|------|---------|-------------|--------------|------|
| `src/modification/engine.ts` | LLM-powered code change proposal + application | `proposeChanges()`, `applyChanges()`, `validateSyntax()`, `validateNotProse()`, `validateSizeRatio()`, `applySurgicalEditsToContent()` | @ast-grep/napi, ai/claude-client, KnowledgeGraph | **Modification engine** — surgical edits (line-range JSON), full-file fallback, LCS diff, syntax validation |
| `src/execution/runner.ts` | Shell command execution with error parsing | `runCommand()`, `parseStructuredErrors()`, `captureBaseline()`, `diffErrors()`, `classifyEnvironmentErrors()` | modification/engine | **Executor** — 60s timeout, 5 error regex patterns, env vs code error classification, baseline diffing |
| `src/execution/ripple-fixer.ts` | Cascading change detection | `findRippleTargets()`, `detectBrokenInterfaces()` | KnowledgeGraph | **Ripple detector** — reverse graph walk, removed export detection, signature change detection |
| `src/execution/api-sync.ts` | Frontend-backend coordination | `findAPIConsumers()`, `findCoordinatedUpdates()` | KnowledgeGraph | **API sync** — backend path patterns → reverse graph walk → frontend consumer discovery |
| `src/simulation/engine.ts` | User flow simulation | `simulateFlow()`, `simulateAllFlows()` | KnowledgeGraph | **Simulator** — 9-layer chain classification (ui_handler→api_call→validation→middleware→database→response→state_update→navigation→error_handling), completeness scoring |

### 1.7 AI Integration

| File | Purpose | Key Exports | Dependencies | Role |
|------|---------|-------------|--------------|------|
| `src/ai/claude-client.ts` | Claude CLI invocation via stdin | `callClaude()`, `safeParseJSON()`, `buildPrompt()` | child_process | **LLM client** — `claude --print --output-format text -` via stdin, 5min timeout, 30K char prompt limit, 2 retries, JSON extraction (direct → fence → bracket match) |

### 1.8 Intelligence + Analysis

| File | Purpose | Key Exports | Dependencies | Role |
|------|---------|-------------|--------------|------|
| `src/intelligence/infrastructure-scanner.ts` | Database, services, runtime detection | `scanInfrastructure()` | fs, path | **Infra scanner** — Prisma schema parsing, env var collection, service detection (stripe, redis, etc.), port checks |
| `src/intelligence/route-scanner.ts` | API route discovery | `scanRoutes()` | fs, path, glob | **Route scanner** — auto-detects framework (nextjs-app/pages, express, fastify), auth detection (session/jwt/api-key/oauth), middleware extraction |
| `src/intelligence/test-generator.ts` | Deterministic test case generation | `TestGenerator` class | KnowledgeGraph | **Test gen** — framework detection (vitest/jest/mocha), function tests (happy/edge/error), route tests (200/400/404/500) |
| `src/contract-validator/index.ts` | API contract validation | `validateContracts()` | fs, path | **Contract checker** — scans server contracts + client calls, matches, detects mismatches (missing endpoints, method errors, unused routes) |
| `src/component-analyzer/index.ts` | React component analysis | `analyzeComponent()` | @ast-grep/napi | **Component analyzer** — props, state fields, hooks, context deps, rendered components, loading/error boundary detection |
| `src/impact/predictor.ts` | Change impact prediction | `predictImpact()` | KnowledgeGraph | **Impact predictor** — ripple analysis for proposed changes |

### 1.9 Context Assembly + Query

| File | Purpose | Key Exports | Dependencies | Role |
|------|---------|-------------|--------------|------|
| `src/context/assembler.ts` | Budget-aware context assembly (50K chars) | `assembleContext()`, `assembleContextFromPipeline()` | retrieval, types | **Context builder** — 7 sections with priority budgets (HIGH: flow+files, MEDIUM: tests+git+deps, LOW: patterns+experiences), max 300 lines/file |
| `src/query/engine.ts` | Query orchestration with mode routing | `query()` | retrieval/pipeline, context/assembler, ai/claude-client, modification/engine | **Query router** — 3 modes: ANALYZE (explain), SIMULATE (trace flow), EXECUTE (modify code) |

### 1.10 Suggestions + Product Vision

| File | Purpose | Key Exports | Dependencies | Role |
|------|---------|-------------|--------------|------|
| `src/suggestions/engine.ts` | Gap-to-suggestion conversion | `generateSuggestions()` | types | **Suggestion engine** — classifies gaps (fix/feature/insight), scores by severity + focus boost + radius |
| `src/product-vision.ts` | Product vision generation and milestone tracking | `generateProductVision()`, `buildImplementationPlan()` | ai/claude-client | **Vision** — LLM-generated product roadmap from project model |

### 1.11 HTTP Server + Routes

| File | Purpose | Key Exports | Dependencies | Role |
|------|---------|-------------|--------------|------|
| `src/server.ts` | Express HTTP server | Express app | All route modules | **Server** — CORS, 10MB JSON limit, 10 route groups |
| `src/config.ts` | Environment configuration | `config` object | — | **Config** — qdrantUrl, port, openaiApiKey, maxRetries=3 |
| `src/logger.ts` | Structured stderr logging | `log()`, `logError()` | — | **Logger** — stage-based color coding |
| `src/routes/index-repo.ts` | POST /index-repo | — | parser, graph-builder, embeddings, vector-store | Parse + graph + embed |
| `src/routes/query.ts` | POST /query | — | query/engine | Q&A retrieval |
| `src/routes/simulate.ts` | POST /simulate | — | simulation/engine | Flow simulation |
| `src/routes/apply-changes.ts` | POST /apply-changes | — | modification/engine | Code changes |
| `src/routes/autonomous.ts` | POST /autonomous | — | autonomous-engine | Full autonomous loop |
| `src/routes/project.ts` | Project metadata | — | project-manager | File tree + project data |
| `src/routes/filesystem.ts` | File read/write | — | project-manager | Sandboxed file I/O |
| `src/routes/intent-graph-routes.ts` | Intent graph API | — | project-manager | Intent visualization |
| `src/routes/suggestions.ts` | Suggestion generation | — | suggestions/engine | Gap → suggestion |
| `src/routes/intelligence.ts` | Route/infra scanning | — | intelligence modules | Route scan, infra scan, test gen |

### 1.12 MCP Layer (codevault-mcp/)

| File | Purpose | Key Exports | Dependencies | Role |
|------|---------|-------------|--------------|------|
| `codevault-mcp/index.ts` | MCP server entry + tool registration | 10 MCP tools | @modelcontextprotocol/sdk, all tools/ | **MCP server** — registers check_status, analyze_repo, apply_task, ask_codebase, get_gaps, simulate_flow, get_status, rollback_last, generate_tests, validate_contracts |
| `codevault-mcp/session.ts` | Session caching + persistence | `getSession()`, `requireSession()`, `saveSnapshot()`, `rollbackSnapshot()` | parser, graph-builder, KnowledgeGraph, infrastructure-scanner, route-scanner, working-memory | **Session manager** — 5min TTL, .superman/session-*.json persistence, auto-recovery, thread-safe init |
| `codevault-mcp/dual-transport.ts` | Content-Length + NDJSON transport | `DualFormatTransport` class | @modelcontextprotocol/sdk | **Protocol adapter** — auto-detects client format, responds in matching format |
| `codevault-mcp/tools/analyze.ts` | Index codebase | `analyzeRepo()` | session | Returns files, functions, classes, routes, techStack |
| `codevault-mcp/tools/apply.ts` | Apply code changes with validation | `applyTask()` | session, modification/engine, execution/runner, ripple-detector | Snapshot → surgical edits → validate → baseline diff → ripple detect |
| `codevault-mcp/tools/ask.ts` | Structured context for questions | `askCodebase()` | session | Does NOT answer — returns evidence for Claude to reason over |
| `codevault-mcp/tools/gaps.ts` | Ranked gap analysis | `getGaps()` | session, autonomous-engine | Top 20 gaps sorted by severity |
| `codevault-mcp/tools/simulate.ts` | Flow tracing | `simulateFlowByName()` | session, simulation/engine, flow-engine | Fuzzy flow name match + step-by-step trace |
| `codevault-mcp/tools/status.ts` | Session health | `getStatus()` | session | Active state, graph size, infra, routes, next step guidance |
| `codevault-mcp/tools/generate-tests.ts` | Test generation | `generateTestsTool()` | session, test-generator | Deterministic (no LLM), optional disk write |
| `codevault-mcp/tools/validate-contracts.ts` | API contract validation | `validateContractsTool()` | contract-validator | Client↔server mismatch detection |

### 1.13 Frontend Components

| File | Purpose | Role |
|------|---------|------|
| `src/components/Editor.tsx` | Main editor interface | Primary workspace |
| `src/components/CodeEditor.tsx` | Code editing + syntax highlighting | Code display |
| `src/components/AiPanel.tsx` | AI assistant panel | Chat/query interface |
| `src/components/InsightsPanel.tsx` | Insights & analysis display | Gap/suggestion display |
| `src/components/IntentGraphPanel.tsx` | Intent graph visualization | Intent tree view |
| `src/components/Sidebar.tsx` | Navigation sidebar | File navigation |
| `src/components/TabBar.tsx` | Tab navigation | Multi-file tabs |
| `src/components/spatial/SpatialCanvas.tsx` | Spatial graph canvas | Node-link diagram |
| `src/components/spatial/NodeInspector.tsx` | Node detail inspector | Selected node detail |
| `src/components/spatial/layout-engine.ts` | Graph layout algorithms | Force-directed layout |

---

## 2. Autonomous Loop — Full Trace

### 2.1 Entry Point

```typescript
async function runAutonomous(repoPath: string): Promise<AutonomousResult>
```

**Constants:**
- `MAX_ITERATIONS = 5`

### 2.2 Initialization (Lines 40–70)

```
1. Create WorkingMemory(repoPath)
2. Load persistent state: memory.load()
   → Reads .codevault-memory.json from disk
   → Hydrates experience search index via loadExperiences()
   → Returns true if prior state exists, false if fresh start
3. Initialize: graph = new KnowledgeGraph()
4. Initialize: intentGraph: IntentGraph | null = null
5. Initialize: iterations: IterationResult[] = []
6. Initialize: seenGapSignatures = new Set<string>()
```

### 2.3 Main Loop: Iteration 1–5

Each iteration follows this exact sequence:

#### Phase 1: Update World Model (Index → Graph → Model)

```
memory.nextIteration()  // state.iteration++

// Index repository
const results = await parseRepository(repoPath, { hashCache })
const { nodes, edges } = buildDependencyGraph(results)
graph = new KnowledgeGraph()
graph.build(nodes, edges)

// Build project model
const model = buildProjectModel(graph)
memory.updateIntent(model)  // Merges systems map: keeps unchanged, replaces changed
```

**buildProjectModel algorithm:**
1. `buildSystems(graph)` — groups nodes by domain (inferred from file path keywords), computes per-system completeness (penalizes orphaned functions -5%, missing error handling -15%, missing validation -20%)
2. `buildFlows(graph)` — finds route nodes, traces call chains, detects gaps (missing validation, missing error handling, missing response handling)
3. `buildEntities(graph)` — finds class/interface nodes, extracts fields from content, finds usedBy via reverse deps
4. Computes stats: files, functions, classes, routes counts

#### Phase 2: Detect Flows

```
const structuredFlows = detectFlows(graph)
memory.updateFlows(structuredFlows)  // Replaces state.flows entirely
```

`detectFlows()` finds:
- **Page flows**: `/page\.(tsx?|jsx?)$/` → extracts route, finds handler functions, builds steps
- **Interactive component flows**: Sheet/Modal/Wizard/Dialog/Drawer/Composer/Panel/Form patterns with handler functions
- **Cross-page journeys**: Groups flows by app router route groups

Each flow gets completeness = implemented_steps / total_steps, confidence = 0.7 if >0 steps else 0.3.

#### Phase 2.5: Generate Intent Graph + Flow Index

```
if (!intentGraph) {
  intentGraph = await generateIntentGraph(model, graph)
} else {
  updateIntentGraph(intentGraph, graph)
}
await buildFlowIndex(intentGraph.allNodes(), graph)
```

`generateFlowIntentGraph()` builds 5 levels:
- **Level 0**: Product purpose (LLM: "In 5-10 words, what is this application?")
- **Level 1**: User flows (detected from pages + APIs + components, merged by resource)
- **Level 2**: Actions within flows (HTTP methods → "View X", "Create X", etc.)
- **Level 3**: System behaviors (API calls, validation, state updates, navigation, notifications)
- **Level 4**: Code nodes linked to behaviors

`updateFlowIntentGraph()` re-evaluates leaf node statuses based on whether linked code exists in the current graph, then propagates statuses bottom-up.

`buildFlowIndex()` creates a 3-layer semantic index:
- Layer 1: Flow embeddings with domain keyword enrichment
- Layer 2: System/action embeddings with parent flow context
- Layer 3: Top 200 important code nodes (function, class, route, method)

#### Phase 3: Gap Analysis + Focus

```
const analysis = await analyzeGapsFromIntentGraph(model, intentGraph, graph)
```

This walks the intent graph and creates Gap objects for:
- `planned` nodes → missing implementation
- `partial` nodes → incomplete implementation (counts missing linked code)
- Systems in intent but absent in model
- Features with missing code nodes

Then gaps are deduplicated (>50% word overlap = same gap, keep highest severity).

```
// Link gaps to flows
for (const gap of analysis.gaps) {
  for (const flow of structuredFlows) {
    if (gap.description.toLowerCase().includes(flow.name.toLowerCase())) {
      gap.flowId = flow.id
    }
  }
}

// Refine against resolved gaps
const refinedGaps = memory.refineGaps(analysis.gaps, analysis.overallHealth)
```

`refineGaps()`:
1. Filters new gaps: removes any whose `gapKey()` is in `resolvedGapKeys`
2. Carries forward old gaps not found in new scan AND not in resolved set
3. Marks carried gaps as resolved if absent from new scan

```
// Convergence detection
const sig = gapSignature(refinedGaps)  // gaps.map(g => `${g.type}:${g.description}`).sort().join('|')
if (seenGapSignatures.has(sig)) {
  // Same gaps seen before → converged, BREAK
  break
}
seenGapSignatures.add(sig)
```

**seenGapSignatures prevents loops**: If the exact same set of gaps (by type+description, sorted) appears twice across iterations, the engine stops. This prevents infinite loops where the same gaps keep being detected but never resolved.

```
// Focus ranking
const focusItems = getRecommendedFocus(structuredFlows, refinedGaps, intentGraph.allNodes(), 5)
memory.recordDecision('focus', 'success', `Top focus: ${focusItems[0]?.name}`)
```

Focus scoring formula per flow:
- Incompleteness: `(1 - completeness) * 40` (0-40 points)
- Gap density: `min(25, gapCount * 8)` (0-25 points)
- Missing steps: `min(20, missing * 10 + partial * 5)` (0-20 points)
- Low confidence: `(1 - confidence) * 15` (0-15 points)
- Critical gap boost: `+20` if any critical gaps

```
// Check convergence thresholds
if (refinedGaps.length === 0 || analysis.overallHealth >= 95) {
  break  // Nothing to fix or healthy enough
}
```

#### Phase 3.5: Experience Query at Decision Time

```
const experienceContext = await memory.buildExperienceContext(
  refinedGaps.slice(0, 5).map(g => g.description).join('; ')
)
```

This is where the experience store is queried:
1. Generates embedding for the gap summary text
2. Searches indexed experiences by cosine similarity (top `limit * 2`)
3. Also does keyword search (split query, filter words > 2 chars)
4. Merges: embedding results first (filter confidence < 0.3), then keyword results
5. Deduplicates by id, sorts by confidence descending
6. Returns formatted context:
   ```
   [OK|~|FAIL] "query" (confidence: X%)
     Flow: detectedFlow
     Actions: action1, action2
     Lesson: what was learned
     [⚠ This approach FAILED — avoid repeating it]
   ```

#### Phase 4: Create Plan

```
const plan = await createPlan(analysis, model, graph)
```

**Plan creation algorithm:**
1. Group gaps by system domain
2. Order systems by `SYSTEM_PRIORITY`: database=1, models=1, config=1 → auth=2, middleware=2 → validation=3, api=3 → services=4 → frontend=5 → testing=6 → deployment=7
3. For each system in priority order, generate steps via Claude LLM:
   - Gathers affected files from gap nodes
   - Builds rich context (exact signatures, line numbers, parameters, return types, reverse deps)
   - Reads actual file content
   - Queries experience store for proven/failed approaches
   - Sends prompt to Claude requesting 1-3 atomic steps per gap
4. Reorder steps by file dependency (leaf files first, core files last via reverse dep counting)
5. Resolve intra-system dependencies (each step depends on previous step in SAME system)

```
// Filter plan steps based on failed patterns
const filteredSteps = plan.steps.filter(step => {
  // Check if similar step failed before
  // ...
})

const refinedPlan = memory.refinePlan(filteredSteps)
```

`refinePlan()`:
1. Filters new steps: removes ones targeting resolved gaps
2. Carries old plan steps that don't overlap with new steps AND aren't in `failedStepIds`
3. Combines filtered new + carried old

```
// Capture baseline before changes
const baselineResult = await runCommand('npm run build', repoPath)
const baselineFingerprints = captureBaseline(baselineResult)
```

#### Phase 5: Execute Plan Steps

```
const { executed, succeeded, failed } = await executePlanWithMemory(
  refinedPlan, graph, repoPath, memory
)
```

For each step:
1. **Check if previously failed**: if `failedStepIds.includes(step.id)` → skip, record decision 'skipped'
2. **Check dependencies**: all dependency step IDs must have succeeded (but attempts anyway with warning)
3. **Propose changes**: `proposeChanges(step.instruction, step.targetFiles, graph)` → Claude generates surgical edits
4. **Apply changes**: `applyChanges(changes)` → validates syntax, validates not prose, validates size ratio, writes to disk
5. **Record outcome**: `memory.recordDecision(action, outcome, reason)`
6. On failure: `memory.recordFailedStep(step.id)`

#### Phase 6: Validate

```
const valid = await validate(repoPath, graph, changedFiles, baselineFingerprints)
```

Validation algorithm:
1. Run `npm run build`
2. If failed:
   - Parse errors into structured format (5 regex patterns)
   - Classify: environment errors vs code errors
   - Diff against baseline fingerprints → only NEW errors matter
   - If no new errors → treat as success (pre-existing issues)
   - If new errors → extract error files, format for LLM, proposeChanges() to auto-fix, retry build
3. If passed:
   - Run `npm test` (if exists, ignore "no test specified")
   - Simulate top 3 flows → check for critical issues
   - Return true

#### Phase 6.5: Record Experience + Learn

```
const result = succeeded > 0 && valid ? 'success' : succeeded > 0 ? 'partial' : 'failure'

await memory.recordExperience(
  gapSummary,           // query
  focusItems[0]?.name,  // detectedFlow
  'improve',            // intent
  plan.steps.map(s => s.description),  // plan
  executedActions,       // actionsTaken
  result,               // 'success' | 'partial' | 'failure'
  changedFiles,          // affectedFiles
  lesson                 // derived from outcome
)
```

Experience creation sets initial confidence:
- success → 0.8
- partial → 0.5
- failure → 0.2

Then adjusts past experience confidence:
```
if (worked) exp.confidence = min(1.0, confidence + 0.1)
else exp.confidence = max(0.0, confidence - 0.15)
```

Experiences capped at 200, sorted by confidence, lowest dropped.

#### Phase 7: Save Memory

```
memory.addChangedFiles(changedFiles)  // Caps at 500, FIFO
memory.save()  // Writes .codevault-memory.json
graph = new KnowledgeGraph()  // Reset for next iteration
```

### 2.4 Working Memory Accumulation Across Iterations

The `.codevault-memory.json` file persists ALL of these across iterations:

| Field | Accumulation Strategy | Cap |
|-------|----------------------|-----|
| `iteration` | Incremented each iteration | None |
| `intent` (ProjectModel) | Merged: unchanged systems kept, changed replaced | None |
| `flows` | Replaced entirely each iteration | None |
| `gaps` | Refined: resolved removed, unresolved carried forward | None |
| `plan` | Refined: resolved removed, failed removed, new merged | None |
| `decisions` | Appended, newest kept | 100 |
| `health` | Replaced each iteration | None |
| `resolvedGapKeys` | Appended when gaps resolve | None |
| `failedStepIds` | Appended when steps fail | None |
| `experiences` | Appended, sorted by confidence | 200 |
| `changedFiles` | Appended, oldest dropped | 500 |

### 2.5 Convergence Conditions (Iteration Exits Early When)

1. `refinedGaps.length === 0` — no gaps detected
2. `analysis.overallHealth >= 95` — healthy enough
3. `seenGapSignatures.has(sig)` — same gaps appeared before (loop detected)
4. `refinedPlan.length === 0` — no actionable steps remain
5. `i >= MAX_ITERATIONS` — hard limit of 5

---

## 3. Retrieval Pipeline — Algorithm Deep Dive

### 3.1 Pipeline Orchestration (`pipeline.ts`)

```typescript
async function retrieve(
  question: string,
  graph: KnowledgeGraph,
  bm25Index: BM25Index | null,
  options: RetrievalOptions = {},
): Promise<PipelineResult>
```

**Default:** `DEFAULT_MAX_RESULTS = 15`

**Stage execution order:**

```
Stage 0a: Query Rewriting (LLM, 2s timeout → heuristic fallback)
Stage 0b: Query Decomposition (heuristic only)
Stage 1:  Candidate Generation (3 retrievers in parallel)
          → Per sub-query, then merge + boost shared candidates
Stage 2:  Graph Expansion (smart traversal, query-aware)
Stage 3a: Multi-signal Reranking
Stage 3b: Cross-encoder Reranking (optional)
Stage 4:  Hierarchical Diversity Enforcement
```

### 3.2 Query Rewriting (`query-rewriter.ts`)

**LLM prompt** (2000ms timeout):
```
You are a code search query expander. Given a user's question about a codebase,
extract structured components to improve search.
Input: "${query}"
→ { concepts[], actions[], components[], fileTypes[] }
```

**Heuristic fallback** (`heuristicExpand()`):
- Action detection: maps question words → actions ("how does" → "understand", "fix" → "debug")
- Domain detection: matches keywords → domains ("auth" keywords → auth, "database" keywords → database)
- Component inference: auth → [middleware, guard, service], database → [model, repository, migration], etc.
- File type inference: auth → [middleware, .ts], ui → [.tsx, component], etc.

**Cache:** In-memory Map, max 100 entries.

### 3.3 Query Decomposition (`decomposer.ts`)

Pure heuristic, no LLM:

**Connection patterns** (8 regexes):
```
/how does (.+?) connect to (.+)/i
/relationship between (.+?) and (.+)/i
/(.+?) vs\.? (.+)/i
/compare (.+?) (?:and|with|to) (.+)/i
```
→ Extracts two subjects, returns as separate sub-queries.

**"And" split:**
```
/^(.+?)\s+and\s+(.+)$/i
```
Skips related conjunction pairs: 'read and write', 'request and response', 'input and output', 'create and update', etc. (12 pairs). Both parts must be > 2 words.

**Fallback:** Returns `[query]` as single element.

### 3.4 Candidate Generation (`candidate-generator.ts`)

Three retrievers run in parallel:

**Retriever 1: BM25** — `retrieveBM25(query, bm25Index, graph, limit=30)`
- Uses MiniSearch with code-aware tokenizer (camelCase split: `([a-z])([A-Z])` → space)
- Boost weights: `{ name: 5, filePath: 1.5, content: 1 }`
- Fuzzy matching: `0.2`, prefix: `true`, combineWith: `'OR'`
- Skips nodes of type 'import' or 'export'
- Text: `${node.type} ${node.name} in ${node.filePath}:\n${node.content.slice(0, 500)}`
- Source tag: `['bm25']`

**Retriever 2: FlowIndex** — `retrieveFlowIndex(query, graph, limit=15)`
- Generates query embedding via local embeddings
- Cosine similarity search against FlowVectorIndex entries
- For flow-type entries: also includes up to 5 linked code nodes with `score * 0.6`
- Source tag: `['local-embeddings']`

**Retriever 3: OpenAI** — `retrieveOpenAI(query, graph, limit=15)` (skipped if no API key)
- Generates OpenAI embedding for query
- Cosine similarity against pre-computed node embeddings
- Filters: similarity > 0.1
- Source tag: `['openai']`

**Merge strategy** (`mergeCandidates`):
```typescript
// For each candidate across all groups:
// If already seen (by id): keep MAX score, UNION sources
// If new: add to map
if (candidate.score > existing.score) {
  existing.score = candidate.score  // MAX SCORE, not average
}
for (const src of candidate.sources) {
  if (!existing.sources.includes(src)) existing.sources.push(src)
}
```

**Sub-query boost** (when decomposed into multiple sub-queries):
```typescript
candidate.score *= 1 + 0.3 * (groupCount - 1)
// 30% boost per additional sub-query that found this candidate
```

### 3.5 Graph Expansion (`smart-traversal.ts`)

Replaces the deprecated `graph-expander.ts` (fixed 0.5 decay).

**Query intent detection:**
```typescript
function detectQueryIntent(query, expanded?): QueryIntent
// 'auth' | 'data' | 'ui' | 'api' | 'general'
// Checks expanded.concepts first, then regex patterns on query
```

**Intent → Edge priority:**
```typescript
auth:    ['calls', 'imports', 'uses']
data:    ['uses', 'calls', 'imports']
ui:      ['renders', 'contains', 'calls']
api:     ['calls', 'imports', 'uses']
general: ['calls', 'imports', 'uses', 'contains']
```

**Per-edge-type decay factors:**
```typescript
calls: 0.8, extends: 0.7, implements: 0.7, renders: 0.7,
contains: 0.6, uses: 0.6, imports: 0.5, exports: 0.3, type_reference: 0.3
```

**Configuration:**
- `MAX_EXPAND = 20` — only expand top 20 candidates
- `MAX_NEIGHBORS_PER_EDGE = 4` — cap per edge type
- `TWO_HOP_THRESHOLD = 0.7` — only 2-hop if first-hop score ≥ this
- `MAX_TWO_HOP_NODES = 3` — max 2-hop nodes per first-hop node
- `SKIP_TYPES = Set(['import', 'export'])` — skip these node types

**First-hop scoring:**
```typescript
score = candidate.score * EDGE_DECAY[edgeType]
// e.g., calls: candidate.score * 0.8
```

**Selective 2-hop** (only when first-hop score ≥ 0.7):
```typescript
score = hop1Score * (EDGE_DECAY[edgeType] * 0.5)
// Extra 0.5 decay for 2-hop, so effective: candidate.score * decay1 * decay2 * 0.5
```

### 3.6 Reranking (`reranker.ts`)

**Signal weights:**
```typescript
W_BM25      = 0.35
W_KEYWORD   = 0.20
W_CENTRALITY = 0.20
W_SOURCE    = 0.25
```

**Combined score:**
```
combined = 0.35 * bm25Score + 0.20 * keywordScore + 0.20 * centrality + 0.25 * sourceScore
```

**Signal 1: BM25 Score** (normalized):
```typescript
results = bm25Index.search(query, 100)
match = results.find(r => r.id === candidateId)
bm25Score = match ? match.score / results[0].score : 0  // Normalized [0,1]
```

**Signal 2: Keyword Coverage:**
```typescript
hits = count of queryTokens found in candidate.text OR candidate.node.name
keywordScore = hits / queryTokens.length  // [0,1]
```

**Signal 3: Centrality** (link count among candidates):
```typescript
// For each candidate, count edges to OTHER candidates in the set
linkCounts[otherId]++
// Normalize: centrality = count / maxLinks  [0,1]
```

**Signal 4: Source Bonus:**
```typescript
3+ sources → 1.0
2 sources  → 0.7
1 source   → 0.3
+0.2 bonus if 'openai' in sources (capped at 1.0)
```

**LLM Reranking (selective second stage):**

Triggers when:
1. Top 3 candidates score spread < 0.1 (ambiguous)
2. 3+ concepts in expanded query
3. Intent words in query: /how does|why does|explain|trace|walk through/

LLM prompt asks to rank candidate indices by relevance. 3000ms timeout. Scored descending: `1.0 - (rank * 0.05)`, unranked get 0.1.

### 3.7 Cross-Encoder Reranking

Uses `Xenova/ms-marco-MiniLM-L-6-v2` cross-encoder model. Maps cross-encoder scores back to candidates, filters and re-sorts. Graceful skip if model unavailable (`hasCrossEncoderFailed()`).

### 3.8 Hierarchical Diversity (`hierarchical.ts`)

**Three-level process:**

**Level 1 — File Grouping:** Group candidates by `node.filePath`

**Level 2 — Classification per file group:**
```typescript
hasEntryPoint:    /^(page|layout|app|index|main|server|handler)\./i  OR type === 'route'
hasBusinessLogic: type in {function, method, class} AND content.length > 50
hasDataModel:     /model|schema|entity|type|interface/i  OR type in {interface, type, class}
```

**Level 3 — Query needs detection:**
```typescript
needsEntryPoint:    /flow|route|endpoint|handler|page|entry/
needsBusinessLogic: /how|logic|process|handle|calculate|validate/
needsDataModel:     /model|schema|data|type|entity|database/
```

**Selection:**
1. Priority pass: ensure at least one of each needed category (entry, business, data)
2. Fill remaining slots with top candidates
3. Enforce `MAX_NODES_PER_FILE = 3`

### 3.9 Caching (`cache.ts`)

**Index cache** (disk):
- File: `.codevault-cache.json`, version 3
- Stores: fileMtimes, bm25Docs, localEmbeddings, openaiEmbeddings
- Staleness: invalidated if any file mtime changed or file deleted

**Query cache** (memory):
- LRU with `MAX_QUERY_CACHE = 50`
- Key normalization: `query.toLowerCase().trim().replace(/\s+/g, ' ')`
- Eviction: removes oldest by timestamp

---

## 4. Intent Graph — Full Implementation

### 4.1 The Five Levels

| Level | Type | Content | Example |
|-------|------|---------|---------|
| 0 | `product` | Application purpose | "Freight dispatch management platform" |
| 1 | `flow` / `system` | User-facing flows, major systems | "Load Management", "Carrier Portal" |
| 2 | `action` / `feature` | Actions within flows | "Create Load", "View Load Details" |
| 3 | `implementation` | System behaviors behind actions | "API call: createLoad", "Validate: loadSchema" |
| 4 | `code` | Actual code nodes | `src/routes/loads.ts::createLoad::45` |

### 4.2 IntentNode Structure

```typescript
interface IntentNode {
  id: string
  level: number          // 0-4
  title: string
  description?: string
  type: IntentNodeType   // 'product' | 'flow' | 'action' | 'system' | 'feature' | 'implementation' | 'code'
  parent?: string
  children: string[]
  linkedCode?: string[]  // code node IDs
  status?: IntentStatus  // 'planned' | 'partial' | 'complete'
  userVisible?: boolean
  flowId?: string
  completeness?: number
  confidence?: number
}
```

### 4.3 Intent Graph Construction (`generateFlowIntentGraph`)

**Step 1: Product Detection (Level 0)**
LLM prompt: `"In 5-10 words, what is this application for an end user?"`
Creates single root node at level 0.

**Step 2: Flow Detection (Level 1)**

Four detection strategies run in sequence:

**A. Page Flows**: Match `page.tsx` in Next.js app router
- Extract route from path: `app/(group)/route/page.tsx` → `route`
- Route-to-label mapping (20+ mappings): `home→Home`, `loads→Load Management`, `carriers→Carrier Management`
- Find handler functions in page file
- Status: 'complete' if ≥3 handlers, 'partial' if ≥1, 'planned' otherwise

**B. API Flows**: Match route nodes in graph
- Group by resource: extract from `/api/{resource}`
- Per route: create action for HTTP method
- GET → "View {label}", POST → "Create {label}", PUT/PATCH → "Update {label}", DELETE → "Delete {label}"

**C. Interactive Component Flows**: Match `Sheet|Modal|Wizard|Dialog|Drawer|Composer|Panel|Form`
- Must have ≥1 handler function
- Component-to-label mapping (20+): `AddLoadSheet→Create New Load`, `OutcomeComposer→Log Call Outcome`

**D. Cross-Page Journeys**: Group flows by route group
- `app/(app)/` → "Dispatcher Workflow"
- `app/(carrier)/` → "Carrier Portal"

**E. Flow Merging**: Combine page + API flows for same resource (matching by name)

**Step 3: LLM for Missing Flows**
Prompt: "Given existing flows, entities, systems — what user flows are MISSING but clearly implied?" → Max 8 additional flows with actions.

**Step 4: Build Actions (Level 2)**

For page flows: handlers → actions via `handlerToLabel()`:
- `handleSubmitTicket` → "Submit Ticket"
- `onClickAssign` → "Assign"

For API flows: HTTP method → action label

**Step 5: Build System Behaviors (Level 3)**

For each action, trace call chain and classify behaviors:
```typescript
function describeBehavior(node: CodeNode): string
// fetch/api → "API call: ${name}"
// validate/schema/zod → "Validate: ${name}"
// setState/dispatch → "Update state: ${name}"
// navigate/redirect → "Navigate: ${name}"
// toast/alert → "Notify: ${name}"
```

**Step 6: Link Code Nodes (Level 4)**

Each behavior links to actual code node IDs via `intentGraph.linkCode()`.

### 4.4 Incremental Update (`updateFlowIntentGraph`)

Re-evaluates ALL leaf nodes:
```typescript
// For each leaf node with linkedCode:
if (all linked code exists in codeGraph) → 'complete'
else if (some exists) → 'partial'
else → 'planned'
```

Then propagates statuses bottom-up:
```typescript
// Sort all nodes by level descending (leaves first)
for (const node of sortedNodes) {
  if (node has children) {
    allComplete → 'complete'
    anyComplete → 'partial'
    noneComplete → 'planned'
  }
}
// Recursive propagation to parent
```

### 4.5 Gap Detection via Intent Graph (`analyzeGapsFromIntentGraph`)

Walks entire intent graph:
- `planned` nodes → Gap: missing implementation
- `partial` nodes → Gap: incomplete implementation, counts missing linked code
- Systems in intent but absent in model → Gap: missing system
- Features with missing code nodes → Gap: unlinked feature

---

## 5. Experience Store + Working Memory — Full Schema

### 5.1 Working State (`.codevault-memory.json`)

```typescript
interface WorkingState {
  intent: ProjectModel          // World model with systems, flows, entities, stats
  flows: StructuredFlow[]       // Detected user flows with steps + completeness
  gaps: Gap[]                   // Current unresolved gaps
  plan: PlanStep[]              // Current execution plan
  decisions: Decision[]         // History of decisions made (capped at 100)
  iteration: number             // Current iteration counter
  health: number                // Overall project health 0-100
  resolvedGapKeys: string[]     // Keys of gaps already fixed
  failedStepIds: number[]       // Step IDs that failed execution
  experiences: Experience[]     // Past experiences (capped at 200)
  changedFiles: string[]        // Files modified across iterations (capped at 500)
}
```

### 5.2 Experience Structure

```typescript
interface Experience {
  id: string                    // `exp-${Date.now()}-${random6chars}`
  timestamp: number             // Date.now()
  query: string                 // What was being worked on
  detectedFlow: string          // Which flow was targeted
  intent: 'improve' | 'fix' | 'add' | 'refactor'
  plan: string[]                // Step descriptions
  actionsTaken: string[]        // What was actually done
  result: 'success' | 'partial' | 'failure'
  affectedFiles: string[]       // Files that were changed
  lesson: string                // What was learned
  confidence: number            // 0.0-1.0, adjusts over time
}
```

**Initial confidence by result:**
```
success → 0.8
partial → 0.5
failure → 0.2
```

**Confidence adjustment:**
```
worked:     confidence = min(1.0, confidence + 0.1)
not worked: confidence = max(0.0, confidence - 0.15)
```

### 5.3 IndexedExperience (Search Index)

```typescript
interface IndexedExperience {
  experience: Experience
  embedding: number[]  // Generated from experienceToText()
}
```

**Text for embedding:**
```
Query: ${exp.query}
Flow: ${exp.detectedFlow}
Intent: ${exp.intent}
Plan: ${exp.plan.join(', ')}
Actions: ${exp.actionsTaken.join(', ')}
Result: ${exp.result}
Files: ${exp.affectedFiles.join(', ')}
Lesson: ${exp.lesson}
```

### 5.4 Cosine Similarity Search

```typescript
function cosine(a: number[], b: number[]): number {
  let dot = 0, ma = 0, mb = 0
  const len = Math.min(a.length, b.length)
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i]
    ma += a[i] * a[i]
    mb += b[i] * b[i]
  }
  const d = Math.sqrt(ma) * Math.sqrt(mb)
  return d === 0 ? 0 : dot / d
}
```

### 5.5 Search Strategy (`findSimilarExperiences`)

1. Generate embedding for query text
2. **Embedding search**: cosine similarity, top `limit * 2` results
3. **Keyword search**: split query into words > 2 chars, count hits in experience text, top `limit`
4. **Merge**: embedding results first (filter confidence < 0.3), then keyword results (filter confidence < 0.3)
5. **Deduplicate** by experience ID
6. **Sort** by confidence descending
7. Return top `limit`

### 5.6 Consecutive Failure Detection

```typescript
function getConsecutiveFailures(experiences: Experience[], queryPattern: string): number
// Filter experiences matching query pattern
// Sort by timestamp descending (newest first)
// Count consecutive failures from most recent
// Stop at first non-failure
```

When `consecutiveFailures >= 3`: sets `needsHumanReview = true` flag.

### 5.7 Decision Structure

```typescript
interface Decision {
  iteration: number
  action: string       // What was attempted
  outcome: 'success' | 'failure' | 'skipped'
  reason: string       // Why this outcome
  timestamp: number
}
```

### 5.8 Key Data Caps

| Field | Cap | Eviction Strategy |
|-------|-----|-------------------|
| decisions | 100 | FIFO (oldest dropped) |
| experiences | 200 | Sorted by confidence, lowest dropped |
| changedFiles | 500 | FIFO (oldest dropped) |

### 5.9 Serialization

Written to `.codevault-memory.json` via `JSON.stringify(state, null, 2)` — pretty-printed with 2-space indent. Loaded via `JSON.parse()` with backward compatibility check (ensures `experiences` array exists).

---

## 6. Gap Engine — Every Pattern

### 6.1 Structural Gap Detection Functions

#### `detectMissingSystems(model, intent)`
**Algorithm:** Checks if systems in `intent.missingSystems` exist in `model.systems`.
- Missing entirely → severity: 'high'
- Exists but completeness < 10% → severity: 'critical'
- Exists but completeness < 30% → severity: 'high'
- Otherwise: skipped

#### `detectIncompleteFlows(model)`
**Algorithm:** Checks each flow's `complete` flag and error handling.
- Incomplete flow → severity: 'medium'
- Multi-step flow (>2 steps) without error handling patterns (`try { }`, `.catch(`, `catch (`) → severity: 'high'

#### `detectBrokenIntegrations(graph)`
**Algorithm:** Two checks:
1. **Circular dependencies**: `findCycles(graph)` → severity: 'medium' per cycle
2. **Unresolved imports**: nodes with type='import' where importSource starts with `.` or `src/` but no matching target node → severity: 'low'

#### `detectArchitecturalIssues(model, graph)`
**Algorithm:** Three patterns:
1. **God files**: >15 functions in single file → severity: 'low'
2. **Highly coupled functions**: >10 reverse dependencies → severity: 'medium'
3. **Scattered systems**: system spread across >3 directories → severity: 'low'

#### `detectComponentGaps(graph)`
**Algorithm:** React-specific analysis (only on .tsx/.jsx files with component metadata):
1. **Missing loading state**: has async hook (useQuery, useSWR, useFetch) but no loading/isLoading useState → severity: 'medium'
2. **Untyped props**: component with parameters but no TypeScript type annotations → severity: 'low'
3. **Missing key prop**: `.map()` call without `key=` in render → severity: 'medium'
4. **Conditional hook**: hook call inside `if` statement → severity: 'high'

#### `detectFlowChainGaps(graph)`
**Algorithm:** Calls `traceAllFlows(graph)` then maps each `BrokenStep` to a Gap.

`traceCompleteFlow()` detects 5 broken step types:
1. **Node not found**: referenced node missing from graph → severity: 'high'
2. **Empty/stub function**: content < 10 chars → severity: 'medium'
3. **Unhandled async**: `await` without `try/catch` → severity: 'medium'
4. **Route without response**: GET/POST handler without `res.json`/`res.send`/`NextResponse` → severity: 'high'
5. **POST without input validation**: `req.body` without zod/yup/joi → severity: 'high'

### 6.2 LLM-Enhanced Gap Detection (`detectLLMGaps`)

**Prompt:**
```
You are analyzing a ${intent.appType} for gaps.

Current capabilities: ${intent.currentCapabilities.join(', ')}
Intended capabilities: ${intent.intendedCapabilities.join(', ')}
Missing systems: ${intent.missingSystems.join(', ')}

## Systems
${systemSummary}  // name, domain, completeness, nodeCount, issues

## Flows
${flowSummary}    // name, complete, stepCount, gaps

## Entities
${model.entities.map((e) => `${e.name}: ${e.fields.join(', ')}`).join('\n')}

Identify SPECIFIC, ACTIONABLE gaps not already covered. Be concrete:
- NOT: "Missing auth"
- YES: "POST /api/users has no authentication check"

Focus on: Security, Data integrity, Operational, Integration

SEVERITY rules:
- critical: exploitable now or breaks core functionality
- high: causes data loss, unhandled errors, or major feature failures
- medium: affects some flows, needs improvement
- low: code quality, minor issues

Return at most 10 gaps.
```

### 6.3 Deduplication (`deduplicateGaps`)

**Algorithm:** Semantic matching via word overlap:
```typescript
// For each pair of gaps:
const wordsA = new Set(a.description.toLowerCase().split(/\s+/))
const wordsB = new Set(b.description.toLowerCase().split(/\s+/))
const overlap = intersection(wordsA, wordsB).size / min(wordsA.size, wordsB.size)
if (overlap > 0.5) → duplicate, keep higher severity
```

### 6.4 Gap Signature (Loop Detection)

```typescript
function gapSignature(gaps: Gap[]): string {
  return gaps.map(g => `${g.type}:${g.description}`).sort().join('|')
}
```
Creates deterministic string from gap set. If same signature seen twice across iterations → convergence, stop loop.

### 6.5 Gap Key (Resolution Tracking)

```typescript
function gapKey(gap: Gap): string {
  return `${gap.type}::${gap.system}::${gap.description.slice(0, 80)}`
}
```
Used for tracking which gaps have been resolved across iterations.

### 6.6 Health Scoring

```typescript
function computeHealth(gaps: Gap[], model: ProjectModel): number {
  // Penalty per gap
  const penaltyMap = { critical: 8, high: 4, medium: 2, low: 0.5 }
  let penalty = sum(gaps.map(g => penaltyMap[g.severity]))
  
  // Scale by codebase size
  const nodeCount = totalNodesAcrossAllSystems
  const scaleFactor = Math.log2(nodeCount / 10)  // Larger codebases tolerate more gaps
  
  // Normalize
  const normalizedPenalty = Math.min(80, penalty / scaleFactor)
  
  // Flow completeness bonus
  const flowBonus = averageFlowCompleteness * 20  // 0-20 bonus
  
  // Final score
  const score = 100 - normalizedPenalty + flowBonus
  return Math.max(5, Math.min(100, Math.round(score)))
}
```

### 6.7 Intent-Graph Based Gaps (`analyzeGapsFromIntentGraph`)

Walks the entire intent graph tree:
- `planned` status nodes → Gap (type depends on level: missing_system for level 1, incomplete_flow for level 2)
- `partial` status nodes → Gap with count of missing linked code
- Systems referenced in intent but not in model → missing_system
- Features with no linked code → architectural_issue

---

## 7. EMA Port Priority Matrix

| Subsystem | Elixir Native | Node.js Sidecar | TS Frontend | Effort (days) | EMA Feature | Recommendation |
|-----------|--------------|-----------------|-------------|---------------|-------------|----------------|
| **Knowledge Graph** (knowledge-graph.ts, traversal.ts, graph-builder.ts) | GenServer with ETS tables, adjacency maps as Maps. BFS/DFS/topo-sort are straightforward to port. | N/A | N/A | 5-7 | Core knowledge base | **Elixir Native** — graph is the heart of EMA, needs tight integration with OTP supervision. ETS gives concurrent read access. |
| **AST Parser** (parser/extractor.ts) | Would require @ast-grep/napi equivalent or Tree-sitter NIF. No Elixir ast-grep binding exists. | Keep as Node sidecar — ast-grep/napi is C++ and works perfectly in Node. | N/A | 2-3 (sidecar) | Code understanding | **Node.js Sidecar** — no Elixir ast-grep binding exists. Tree-sitter NIF is an alternative but loses pattern matching power. |
| **Incremental Parsing** (parser/incremental.ts, parser/index.ts) | SHA256 in Erlang :crypto, file hash cache in ETS. | N/A | N/A | 1-2 | Efficient re-indexing | **Elixir Native** — trivial port, :crypto.hash(:sha256, content), ETS for hash storage. |
| **BM25 Search** (bm25.ts) | Port MiniSearch logic or use Elixir text search lib. Code-aware tokenizer is custom. | Could keep in Node with existing MiniSearch. | N/A | 3-4 (native) / 1 (sidecar) | Keyword search | **Elixir Native** — BM25 is well-understood algorithm, Elixir string processing is adequate. Eliminates a sidecar dependency. |
| **TF-IDF + Random Projection** (tfidf.ts) | Straightforward math port. Sparse vector ops in Elixir Maps. Random projection with :rand seed. | N/A | N/A | 2-3 | Fallback embeddings | **Elixir Native** — pure math, no external deps. Good fallback when ML models unavailable. |
| **Local Embeddings** (local-embeddings.ts) | No HuggingFace transformers for Elixir. Would need Nx/Bumblebee (Elixir ML). Bumblebee supports sentence-transformers. | Keep in Node — @huggingface/transformers works. | N/A | 5-7 (Bumblebee) / 1 (sidecar) | Semantic search | **Elixir Native via Bumblebee** — Nx/Bumblebee can load ONNX models including MiniLM. Keeps ML in-process. Fallback: Node sidecar. |
| **OpenAI Embeddings** (openai-embeddings.ts) | Trivial HTTP client port (Req library). | N/A | N/A | 1 | Cloud embeddings | **Elixir Native** — simple HTTP API call, Req + Jason. |
| **Vector Store / Qdrant** (vector-store.ts) | Qdrant has REST API, trivial to call from Elixir. | N/A | N/A | 1-2 | Vector DB | **Elixir Native** — REST API, no client SDK needed. Or replace with Pgvector if using Postgres. |
| **Flow Index** (flow-index.ts) | In-memory cosine search, port to Elixir list comprehension + ETS. | N/A | N/A | 2 | Flow-aware search | **Elixir Native** — small in-memory index, cosine similarity is simple math. |
| **Retrieval Pipeline** (pipeline.ts, decomposer, candidate-gen, reranker, etc.) | Complex orchestration — good fit for Elixir Task.async_stream. Each stage is independent. | N/A | N/A | 7-10 | Core retrieval | **Elixir Native** — pipeline stages map well to Task.async for parallelism. Reranker weights are just config. |
| **Intent Graph** (intent-graph.ts, flow-generator.ts, auto-intent-generator.ts) | Tree structure in ETS/GenServer. LLM calls via HTTP. Status propagation is recursive. | N/A | N/A | 4-5 | Knowledge hierarchy | **Elixir Native** — tree data structure + LLM API calls. Bottom-up propagation is natural recursion. |
| **Gap Engine** (gap-engine.ts) | All pattern matchers port directly. LLM prompt is just a string. Health scoring is pure math. | N/A | N/A | 3-4 | Gap detection | **Elixir Native** — pattern matching is Elixir's strength. Regex for code patterns, math for scoring. |
| **Focus Engine** (focus-engine.ts) | Pure scoring function, trivial port. | N/A | N/A | 0.5 | Priority ranking | **Elixir Native** — pure function, 20 lines of math. |
| **Experience Store** (experience-store.ts) | Cosine similarity + keyword search. Store in Postgres with pgvector. | N/A | N/A | 3-4 | Learning system | **Elixir Native** — store experiences in Postgres, pgvector for similarity search. Confidence adjustment is simple math. |
| **Working Memory** (working-memory.ts) | GenServer with state, persist to Postgres instead of JSON file. | N/A | N/A | 2-3 | Persistent state | **Elixir Native** — GenServer is perfect for stateful process. Persist to Postgres for durability. |
| **Autonomous Engine** (autonomous-engine.ts) | GenServer with iteration loop. Each phase is a function call. | N/A | N/A | 5-7 | Autonomous loop | **Elixir Native** — GenServer with handle_continue for iteration phases. OTP supervision for crash recovery. |
| **Planner** (planner.ts) | LLM prompt generation + response parsing. System priority is a map. | N/A | N/A | 2-3 | Planning | **Elixir Native** — prompt templates + JSON parsing. LLM call via HTTP. |
| **Modification Engine** (modification/engine.ts) | LCS diff in Elixir. Surgical edit parsing. BUT: ast-grep validation needs sidecar. | Syntax validation needs Node (ast-grep). | N/A | 4-5 | Code changes | **Hybrid** — edit logic in Elixir, syntax validation delegates to Node AST parser sidecar. |
| **Execution Runner** (execution/runner.ts) | System.cmd for shell execution. Error regex parsing in Elixir. | N/A | N/A | 2 | Build/test execution | **Elixir Native** — System.cmd + Regex. Port available for streaming output. |
| **Simulation Engine** (simulation/engine.ts) | Layer classification via regex. Chain tracing uses graph. | N/A | N/A | 3-4 | Flow simulation | **Elixir Native** — regex pattern matching + graph traversal. |
| **Claude Client** (ai/claude-client.ts) | Replace CLI invocation with Anthropic HTTP API (better for server). | N/A | N/A | 2-3 | LLM integration | **Elixir Native** — use Anthropic Messages API directly via HTTP (Req). Eliminates CLI dependency entirely. |
| **MCP Transport** (dual-transport.ts, session.ts) | Elixir is excellent for protocol handling. GenServer for sessions. | N/A | N/A | 3-4 | MCP integration | **Elixir Native** — binary protocol parsing is Elixir's sweet spot. GenServer for session state. |
| **Infrastructure Scanner** (infrastructure-scanner.ts) | File reading + regex. Port check via :gen_tcp. | N/A | N/A | 2 | Infra detection | **Elixir Native** — file I/O + regex + :gen_tcp.connect for port checks. |
| **Route Scanner** (route-scanner.ts) | File globbing + regex extraction. | N/A | N/A | 2 | Route discovery | **Elixir Native** — Path.wildcard + Regex. |
| **Contract Validator** (contract-validator/index.ts) | Scan + match logic, regex-based. | N/A | N/A | 2 | API validation | **Elixir Native** — pattern matching + regex. |
| **Test Generator** (test-generator.ts) | Template-based generation, no LLM needed. | N/A | N/A | 2 | Test scaffolding | **Elixir Native** — EEx templates or string interpolation. |
| **Component Analyzer** (component-analyzer/index.ts) | Needs AST parsing (ast-grep). | Delegate to Node AST sidecar. | N/A | 1 (sidecar) | React analysis | **Node.js Sidecar** — depends on ast-grep. Bundle with parser sidecar. |
| **Context Assembler** (context/assembler.ts) | String building with budget management. | N/A | N/A | 2 | Context building | **Elixir Native** — IO.iodata for efficient string building. Budget logic is simple math. |
| **Frontend UI** (components/*.tsx) | N/A | N/A | Keep as-is or rebuild in LiveView | 10-15 | IDE panels | **TS Frontend** for standalone IDE. **LiveView** for EMA web UI. |

### Summary

| Category | Count | Total Effort |
|----------|-------|-------------|
| Elixir Native | 22 subsystems | ~55-70 days |
| Node.js Sidecar | 2 subsystems (AST parser + component analyzer) | ~3-4 days |
| Hybrid (Elixir + sidecar) | 1 subsystem (modification engine) | ~4-5 days |
| Frontend (TS or LiveView) | 1 subsystem | ~10-15 days |
| **Total** | **26 subsystems** | **~72-94 days** |

**Critical path**: Knowledge Graph → Retrieval Pipeline → Intent Graph → Autonomous Engine. These four form the core intelligence loop and should be ported first.

---

## 8. Design Gaps and Limitations

### 8.1 Hardcoded IDE Assumptions

**File-centric world model**: Everything revolves around `filePath`, `CodeNode`, `CodeEdge`. The entire graph schema assumes "code in files." A general knowledge wiki has no file paths — it has documents, sections, concepts. The `NodeType` enum (`file | function | class | method | interface | type | variable | route | import | export`) is entirely code-centric.

**AST-only extraction**: The parser uses `@ast-grep/napi` which only works on programming languages. No support for Markdown, prose, configuration-as-knowledge, or unstructured text. EMA would need a fundamentally different extraction layer.

**Build/test validation**: The autonomous loop validates by running `npm run build` and `npm test`. This assumes a buildable software project. A knowledge wiki has no build step — validation would need to be semantic (consistency checks, broken links, stale references).

**Domain inference from file paths**: `inferDomain()` checks for `auth`, `route`, `middleware`, etc. in file paths. This is code-project specific. EMA domains would be user-defined knowledge areas.

### 8.2 Scalability Concerns

**In-memory graph**: `KnowledgeGraph` holds all nodes and edges in a `Map`. For large repositories (100K+ nodes), this becomes memory-intensive. No pagination, no lazy loading.

**Full graph rebuild per iteration**: The autonomous engine creates a fresh `KnowledgeGraph` each iteration and rebuilds entirely. Incremental hash caching helps parsing, but the graph itself is rebuilt from scratch.

**Experience store linear scan**: `ExperienceIndex.search()` computes cosine similarity against ALL entries. With 200 cap this is fine, but wouldn't scale to thousands. No approximate nearest neighbor (ANN) index.

**Synchronous LLM calls**: `callClaude()` spawns a child process and waits. No streaming, no concurrent LLM calls within a single phase. The 5-minute timeout per call is generous but blocking.

### 8.3 Single-LLM Dependency

**Claude CLI only**: The entire system depends on `claude --print --output-format text -` being available. No abstraction layer for LLM providers. Switching to OpenAI, local models, or Anthropic API requires rewriting `callClaude()` and all prompt formats.

**No prompt versioning**: LLM prompts are inline strings. No templating system, no A/B testing, no prompt registry. Changes to prompts require code changes.

**JSON parsing fragility**: `safeParseJSON()` has three fallback strategies (direct parse → markdown fence → bracket match), but LLM responses still sometimes fail to parse. No structured output (function calling) support.

### 8.4 Gap Detection Blindspots

**No runtime analysis**: All gap detection is static. Can't detect:
- Performance bottlenecks
- Memory leaks
- Race conditions
- Actual user behavior patterns (only inferred flows)

**No cross-repository awareness**: Each project is analyzed in isolation. Can't detect:
- Shared library incompatibilities
- Microservice contract violations (only client↔server in same repo)
- Dependency version conflicts across services

**Simplistic deduplication**: Gap deduplication uses >50% word overlap. This can miss semantic duplicates ("missing auth on /api/users" vs "POST /users endpoint is unprotected") and false-positive on word-similar but different gaps.

### 8.5 Flow Detection Limitations

**Framework-specific heuristics**: Flow detection is hardcoded for Next.js App Router patterns (`page.tsx`, `route.ts`, `app/(group)/`). Other frameworks (Express-only, SvelteKit, Remix, etc.) get minimal flow detection.

**Hardcoded domain labels**: `routeToFlowLabel()` has 20+ hardcoded mappings (loads, carriers, tickets, dispatch). These are specific to the freight/dispatch domain. Any other domain would get generic labels.

**No real user flow data**: Flows are inferred from code structure (pages + handlers + API routes). Actual user behavior (analytics, session recordings) is never consulted. Inferred flows may not match reality.

### 8.6 Modification Engine Weaknesses

**Line-number fragility**: Surgical edits use `startLine`/`endLine` references. If the LLM hallucinates line numbers (common), edits land in wrong locations. The bottom-up application strategy helps but doesn't eliminate the risk.

**No semantic diffing**: Changes are validated by syntax check + build + test. No semantic analysis of whether the change actually addresses the gap it was supposed to fix.

**Single-file atomicity**: Each code change is applied file-by-file. No transaction across files — if file A is changed but file B fails, file A is already written. Rollback exists but is manual (via MCP `rollback_last`).

### 8.7 Architecture Decisions That Differ for EMA

**JSON file persistence**: Working memory is a single JSON file (`.codevault-memory.json`). For EMA: use Postgres + Ecto for structured persistence with migrations, transactions, and concurrent access.

**Express HTTP server**: Superman uses Express.js for its API. For EMA: Phoenix channels / LiveView for real-time updates, or integrate directly into the Elixir application.

**Singleton pattern**: `project-manager.ts` is a module-level singleton with mutable state. For EMA: use OTP GenServer with proper supervision tree. Each project gets its own GenServer process.

**No multi-tenancy**: One project at a time, one user at a time. EMA would need to support multiple knowledge bases, multiple users, concurrent access.

**No event sourcing**: State changes are direct mutations saved to a JSON file. No audit trail, no undo beyond one level (snapshot rollback). For EMA: consider event sourcing for the knowledge graph to enable time-travel debugging and audit trails.

---
tags: [superman, research, ema, intelligence-layer, knowledge-graph, deep-dive]
created: 2026-04-03
status: deep-research
priority: high
---
