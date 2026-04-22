import path from 'path';
import fs from 'fs/promises';
import { log, logError } from './logger.js';
import { KnowledgeGraph } from './graph/knowledge-graph.js';
import { IntentGraph } from './intent-graph.js';
import { parseRepository } from './parser/index.js';
import { buildDependencyGraph } from './structural/graph-builder.js';
import { generateEmbeddings, createNodeEmbeddingText } from './semantic/embeddings.js';
import { initCollection, upsertNodes } from './semantic/vector-store.js';
import { generateIntentGraph, updateIntentGraph } from './auto-intent-generator.js';
import { buildFlowIndex } from './semantic/flow-index.js';
import { TFIDFIndex } from './semantic/tfidf.js';
import { BM25Index } from './semantic/bm25.js';
import { FileWatcher } from './sync/watcher.js';
import { FileHashCache } from './parser/incremental.js';
import { buildProjectModel } from './autonomous-engine.js';
import { detectFlows } from './flow-engine.js';
import { getRecommendedFocus, type FocusItem } from './focus-engine.js';
import { generateOpenAIEmbeddingsBatch, isOpenAIAvailable } from './semantic/openai-embeddings.js';
import { getOpenAIEmbeddingStore } from './retrieval/candidate-generator.js';
import { saveIndexCache, loadIndexCache, restoreOpenAIEmbeddings, restoreLocalEmbeddings, invalidateQueryCache } from './retrieval/cache.js';
import type { ProjectModel, CodeNode, StructuredFlow, Gap } from './types.js';

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  language?: string;
}

export type LoadingPhase = 'idle' | 'structure_ready' | 'flows_ready' | 'fully_indexed';

export interface PanelData {
  features: FeatureItem[];
  bugs: BugItem[];
  completion: CompletionItem[];
  loadingPhase: LoadingPhase;
  overallCompleteness: number;
}

export interface FeatureItem {
  title: string;
  description: string;
  affectedFlow: string;
  impactScore: number;
}

export interface BugItem {
  issue: string;
  severity: 'low' | 'medium' | 'high';
  affectedFlow: string;
  confidence: number;
}

export interface CompletionItem {
  task: string;
  flow: string;
  completeness: number;
  canExecute: boolean;
  blockers: string[];
}

class ProjectManager {
  private projectPath: string | null = null;
  private graph = new KnowledgeGraph();
  private intentGraph: IntentGraph | null = null;
  private watcher: FileWatcher | null = null;
  private model: ProjectModel | null = null;
  private _phase: LoadingPhase = 'idle';
  private _flows: StructuredFlow[] = [];
  private _gaps: Gap[] = [];
  private _focus: FocusItem[] = [];
  private _tfidfIndex: TFIDFIndex | null = null;
  private _bm25Index: BM25Index | null = null;
  private _hashCache: FileHashCache = new FileHashCache();

  /**
   * INSTANT project loading:
   * 1. Validate path + load file tree → return immediately
   * 2. Background: parse → graph → flows → intent → embeddings
   */
  async setActiveProject(projectPath: string): Promise<{ files: number; nodes: number }> {
    const expanded = projectPath.startsWith('~')
      ? path.join(process.env.HOME || '/Users/' + process.env.USER, projectPath.slice(1))
      : projectPath;
    const resolved = path.resolve(expanded);
    const stat = await fs.stat(resolved);
    if (!stat.isDirectory()) throw new Error('Path is not a directory');

    this.watcher?.stop();
    this.projectPath = resolved;
    this._phase = 'idle';
    this.graph = new KnowledgeGraph();
    this.intentGraph = null;
    this.model = null;
    this._flows = [];
    this._gaps = [];
    this._focus = [];
    this._hashCache = new FileHashCache();

    log('auto', `Setting active project: ${resolved}`);

    // Phase 1: File tree is ready instantly (getFileTree works now)
    this._phase = 'structure_ready';
    log('auto', 'Phase: structure_ready');

    // Start background indexing — don't await
    this.backgroundIndex(resolved);

    // Return immediately with file count estimate
    const tree = await this.getFileTree();
    const fileCount = countFiles(tree);
    return { files: fileCount, nodes: 0 };
  }

  /**
   * Background indexing pipeline — runs after setActiveProject returns.
   */
  private async backgroundIndex(projectPath: string): Promise<void> {
    try {
      // Load file hash cache for incremental parsing
      await this._hashCache.load(projectPath);

      // Check for cached index
      const currentMtimes = await this.getFileMtimes(projectPath);
      const cached = loadIndexCache(projectPath, currentMtimes);

      let nodes: CodeNode[];
      let bm25Docs: Array<{ id: string; name: string; filePath: string; content: string }>;

      if (cached) {
        // Fast path: rebuild from cache
        log('auto', 'Background: restoring from cache');
        const parseResults = await parseRepository(projectPath, { hashCache: this._hashCache });
        const deps = buildDependencyGraph(parseResults);
        nodes = deps.nodes;
        this.graph = new KnowledgeGraph();
        this.graph.build(deps.nodes, deps.edges);
        this.model = buildProjectModel(this.graph);

        // Restore BM25 from cache
        bm25Docs = cached.bm25Docs;
        const bm25 = new BM25Index();
        bm25.build(bm25Docs);
        this._bm25Index = bm25;

        // Build TF-IDF index from cached BM25 docs
        const tfidfDocs = bm25Docs.map(d => ({ id: d.id, text: `${d.name} ${d.content}` }));
        const tfidf = new TFIDFIndex();
        tfidf.build(tfidfDocs);
        this._tfidfIndex = tfidf;

        // Restore local embeddings from cache
        if (cached.localEmbeddings && cached.localEmbeddings.length > 0) {
          restoreLocalEmbeddings(cached.localEmbeddings);
        }

        // Restore OpenAI embeddings from cache
        if (cached.openaiEmbeddings.length > 0) {
          restoreOpenAIEmbeddings(cached.openaiEmbeddings);
        }
      } else {
        // Full parse path
        log('parse', 'Background: parsing repository');
        const parseResults = await parseRepository(projectPath, { hashCache: this._hashCache });

        log('graph', 'Background: building dependency graph');
        const deps = buildDependencyGraph(parseResults);
        nodes = deps.nodes;
        this.graph = new KnowledgeGraph();
        this.graph.build(deps.nodes, deps.edges);
        this.model = buildProjectModel(this.graph);

        // Build TF-IDF index
        const tfidfDocs = nodes.map(n => ({ id: n.id, text: `${n.name} ${n.content}` }));
        const tfidf = new TFIDFIndex();
        tfidf.build(tfidfDocs);
        this._tfidfIndex = tfidf;

        // Build BM25 docs for later use
        bm25Docs = nodes
          .filter((n) => n.type !== 'import' && n.type !== 'export')
          .map((n) => ({ id: n.id, name: n.name, filePath: n.filePath, content: n.content }));
      }

      // Save file hash cache after parsing
      await this._hashCache.save(projectPath);

      // Invalidate query cache on re-index
      invalidateQueryCache();

      // Build BM25 index (only if not already restored from cache)
      if (!this._bm25Index) {
        const bm25 = new BM25Index();
        bm25.build(bm25Docs);
        this._bm25Index = bm25;
      }

      // Detect flows (fast, no LLM)
      this._flows = detectFlows(this.graph);
      this._phase = 'flows_ready';
      log('auto', `Phase: flows_ready (${this._flows.length} flows)`);

      // Intent graph (may use LLM for missing flow detection)
      try {
        this.intentGraph = await generateIntentGraph(this.model, this.graph);
      } catch {
        this.intentGraph = new IntentGraph();
      }

      // Build flow index
      try {
        await buildFlowIndex(this.intentGraph.allNodes(), this.graph);
      } catch (err) {
        log('index', 'Failed to build flow index', { source: 'project-manager', error: String(err) });
      }

      // Compute gaps and focus
      this.computePanelData();

      // Start watcher
      this.startWatcher();

      this._phase = 'fully_indexed';
      log('auto', `Phase: fully_indexed (${nodes.length} nodes)`);

      // Background embeddings + cache save (non-blocking)
      this.generateEmbeddingsBackground(nodes, bm25Docs);
    } catch (err) {
      logError('auto', 'Background indexing failed', err);
      // Still usable — file tree works, just no intelligence
    }
  }

  private computePanelData(): void {
    if (!this.model || !this.intentGraph) return;

    // Import gap analysis
    import('./gap-engine.js').then(({ analyzeGapsFromIntentGraph }) =>
    analyzeGapsFromIntentGraph(this.model!, this.intentGraph!, this.graph)
      .then((analysis: { gaps: Gap[]; overallHealth: number }) => {
        this._gaps = analysis.gaps;
        // Link gaps to flows
        for (const gap of this._gaps) {
          if (!gap.flowId) {
            const match = this._flows.find((f) =>
              f.name.toLowerCase().includes(gap.system.toLowerCase()),
            );
            if (match) gap.flowId = match.id;
          }
        }
        // Compute focus
        this._focus = getRecommendedFocus(
          this._flows,
          this._gaps,
          this.intentGraph?.allNodes() || [],
          20,
        );
        log('auto', `Panel data computed: ${this._gaps.length} gaps, ${this._focus.length} focus items`);
      })
      .catch((err: unknown) => logError('gap', 'Panel data computation failed', err))
    ).catch((err: unknown) => logError('gap', 'Gap engine import failed', err));
  }

  // ── Accessors ──

  getProjectPath(): string {
    if (!this.projectPath) throw new Error('No active project.');
    return this.projectPath;
  }

  getGraph(): KnowledgeGraph { return this.graph; }
  getIntentGraph(): IntentGraph | null { return this.intentGraph; }
  getModel(): ProjectModel | null { return this.model; }
  getFlows(): StructuredFlow[] { return this._flows; }
  getGaps(): Gap[] { return this._gaps; }
  getFocusItems(): FocusItem[] { return this._focus; }
  getPhase(): LoadingPhase { return this._phase; }
  getTFIDFIndex(): TFIDFIndex | null {
    return this._tfidfIndex;
  }

  getBM25Index(): BM25Index | null {
    return this._bm25Index;
  }

  isInitialized(): boolean {
    return this._phase !== 'idle' && this.projectPath !== null;
  }

  /**
   * Get panel data for the side panels.
   */
  getPanelData(): PanelData {
    const features: FeatureItem[] = [];
    const bugs: BugItem[] = [];
    const completion: CompletionItem[] = [];

    // Features: gaps that suggest new capabilities
    for (const gap of this._gaps.filter((g) => g.type === 'missing_system' || g.type === 'incomplete_flow')) {
      features.push({
        title: gap.suggestedFix.slice(0, 80),
        description: gap.description,
        affectedFlow: gap.flowId || gap.system,
        impactScore: gap.severity === 'critical' ? 90 : gap.severity === 'high' ? 70 : gap.severity === 'medium' ? 45 : 20,
      });
    }

    // Bugs: gaps that indicate broken things
    for (const gap of this._gaps.filter((g) => g.type === 'broken_integration' || g.type === 'architectural_issue')) {
      bugs.push({
        issue: gap.description,
        severity: gap.severity === 'critical' ? 'high' : gap.severity as 'low' | 'medium' | 'high',
        affectedFlow: gap.flowId || gap.system,
        confidence: 0.7,
      });
    }

    // Completion: each flow's status
    for (const flow of this._flows) {
      const flowGaps = this._gaps.filter((g) => g.flowId === flow.id);
      const missingSteps = flow.steps.filter((s) => s.status === 'missing');
      const blockers = [
        ...flowGaps.map((g) => g.description.slice(0, 60)),
        ...missingSteps.map((s) => `Missing: ${s.userAction}`),
      ];

      completion.push({
        task: flow.name,
        flow: flow.id,
        completeness: flow.completeness,
        canExecute: flow.completeness < 1 && blockers.length > 0 && this._phase === 'fully_indexed',
        blockers: blockers.slice(0, 5),
      });
    }

    // Sort
    features.sort((a, b) => b.impactScore - a.impactScore);
    bugs.sort((a, b) => {
      const s: Record<string, number> = { high: 3, medium: 2, low: 1 };
      return (s[b.severity] || 0) - (s[a.severity] || 0);
    });
    completion.sort((a, b) => a.completeness - b.completeness);

    const totalCompleteness = this._flows.length > 0
      ? this._flows.reduce((s, f) => s + f.completeness, 0) / this._flows.length
      : 0;

    return {
      features: features.slice(0, 20),
      bugs: bugs.slice(0, 20),
      completion: completion.slice(0, 30),
      loadingPhase: this._phase,
      overallCompleteness: Math.round(totalCompleteness * 100),
    };
  }

  /**
   * Validate whether an action can be safely executed.
   */
  validateExecution(taskFlowId: string): {
    canExecute: boolean;
    missingRequirements: string[];
    confidence: number;
  } {
    const missing: string[] = [];
    let confidence = 0;

    if (this._phase !== 'fully_indexed') {
      missing.push('Indexing not complete — wait for full analysis');
      confidence = 0.1;
    } else {
      confidence = 0.6;
    }

    const flow = this._flows.find((f) => f.id === taskFlowId);
    if (!flow) {
      missing.push('Flow not found in analysis');
      confidence = 0;
    } else {
      if (!flow.entryFile) missing.push('Entry file not identified');
      if (flow.relatedFiles.length === 0) missing.push('No related files found');
      if (flow.steps.length === 0) missing.push('No steps detected');
      confidence = Math.min(confidence, flow.confidence);
    }

    if (!this.model) {
      missing.push('Project model not built');
      confidence = 0;
    }

    return {
      canExecute: missing.length === 0,
      missingRequirements: missing,
      confidence,
    };
  }

  // ── Filesystem ──

  validatePath(relativePath: string): string {
    const projectPath = this.getProjectPath();
    const resolved = path.resolve(projectPath, relativePath);
    if (!resolved.startsWith(projectPath + path.sep) && resolved !== projectPath) {
      throw new Error('Access denied: path outside project root');
    }
    return resolved;
  }

  async readFile(relativePath: string): Promise<string> {
    return fs.readFile(this.validatePath(relativePath), 'utf-8');
  }

  async writeFile(relativePath: string, content: string): Promise<void> {
    await fs.writeFile(this.validatePath(relativePath), content, 'utf-8');
  }

  async getFileTree(): Promise<FileTreeNode[]> {
    const projectPath = this.getProjectPath();
    return this.readDirRecursive(projectPath, projectPath);
  }

  private async readDirRecursive(dirPath: string, rootPath: string): Promise<FileTreeNode[]> {
    let entries;
    try { entries = await fs.readdir(dirPath, { withFileTypes: true }); }
    catch { return []; }

    const sorted = entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    const nodes: FileTreeNode[] = [];
    for (const entry of sorted) {
      if (/^(\.|node_modules|dist|\.next|\.git|__pycache__|\.superpowers|\.turbo)$/.test(entry.name)) continue;
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(rootPath, fullPath);
      if (entry.isDirectory()) {
        const children = await this.readDirRecursive(fullPath, rootPath);
        nodes.push({ name: entry.name, path: relativePath, type: 'directory', children });
      } else {
        nodes.push({ name: entry.name, path: relativePath, type: 'file', language: detectLanguageFromExt(entry.name) });
      }
    }
    return nodes;
  }

  private generateEmbeddingsBackground(nodes: CodeNode[], bm25Docs: Array<{ id: string; name: string; filePath: string; content: string }>) {
    (async () => {
      const embeddable = nodes.filter((n) => n.type !== 'import' && n.type !== 'export').slice(0, 500);

      // Qdrant embeddings (optional — if Qdrant is running)
      try {
        await initCollection();
        if (embeddable.length > 0) {
          const texts = embeddable.map(createNodeEmbeddingText);
          const embeddings = await generateEmbeddings(texts);
          await upsertNodes(embeddable, embeddings);
        }
      } catch (err) {
        log('embed', 'Qdrant embedding generation failed (non-blocking)', { source: 'project-manager', error: String(err) });
      }

      // OpenAI embeddings (optional — if API key is set)
      if (isOpenAIAvailable() && embeddable.length > 0) {
        try {
          const openaiResults = await generateOpenAIEmbeddingsBatch(embeddable);
          const store = getOpenAIEmbeddingStore();
          for (const [id, embedding] of openaiResults) {
            store.set(id, embedding);
          }
          log('embed', `OpenAI embeddings stored in-memory: ${openaiResults.size} nodes`);
        } catch (err) {
          log('embed', 'OpenAI embedding generation failed (non-blocking)', { source: 'project-manager', error: String(err) });
        }
      }

      // Save index cache to disk
      try {
        const projectPath = this.getProjectPath();
        const fileMtimes = await this.getFileMtimes(projectPath);
        saveIndexCache(projectPath, bm25Docs, fileMtimes);
      } catch (err) {
        log('cache', 'Failed to save index cache (non-blocking)', { error: String(err) });
      }
    })();
  }

  private async getFileMtimes(projectPath: string): Promise<Record<string, number>> {
    const mtimes: Record<string, number> = {};
    const walkDir = async (dir: string) => {
      let entries;
      try { entries = await fs.readdir(dir, { withFileTypes: true }); }
      catch { return; }
      for (const entry of entries) {
        if (/^(\.|node_modules|dist|\.next|\.git|__pycache__)$/.test(entry.name)) continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walkDir(fullPath);
        } else {
          try {
            const stat = await fs.stat(fullPath);
            mtimes[path.relative(projectPath, fullPath)] = stat.mtimeMs;
          } catch { /* skip */ }
        }
      }
    };
    await walkDir(projectPath);
    return mtimes;
  }

  private startWatcher() {
    const projectPath = this.getProjectPath();
    this.watcher = new FileWatcher(
      projectPath,
      async (results) => {
        for (const result of results) {
          this.graph.removeByFile(result.filePath);
          for (const node of result.nodes) this.graph.addNode(node);
          for (const edge of result.edges) this.graph.addEdge(edge);
        }
        this.model = buildProjectModel(this.graph);
        this._flows = detectFlows(this.graph);
        if (this.intentGraph) updateIntentGraph(this.intentGraph, this.graph);
        this.computePanelData();
        log('sync', `Incremental update: ${results.length} file(s)`);
      },
      { fileHashCache: this._hashCache, graph: this.graph },
    );
    this.watcher.setOnDelete(async (filePath: string) => {
      log('server', `File deleted: ${filePath}`);
      this.graph.removeByFile(filePath);
    });
    this.watcher.start();
  }

  async reindex(): Promise<{ files: number; nodes: number }> {
    const projectPath = this.getProjectPath();
    const parseResults = await parseRepository(projectPath);
    const { nodes, edges } = buildDependencyGraph(parseResults);
    this.graph = new KnowledgeGraph();
    this.graph.build(nodes, edges);
    this.model = buildProjectModel(this.graph);
    this._flows = detectFlows(this.graph);
    try { this.intentGraph = await generateIntentGraph(this.model, this.graph); } catch { this.intentGraph = new IntentGraph(); }
    try { await buildFlowIndex(this.intentGraph.allNodes(), this.graph); } catch (err) {
      log('index', 'Failed to rebuild flow index during reindex', { source: 'project-manager', error: String(err) });
    }
    this.computePanelData();
    this._phase = 'fully_indexed';
    return { files: parseResults.length, nodes: nodes.length };
  }
}

function detectLanguageFromExt(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    py: 'python', go: 'go', rs: 'rust', java: 'java', json: 'json',
    md: 'markdown', yml: 'yaml', yaml: 'yaml', css: 'css', scss: 'scss',
    html: 'html', sh: 'shell', sql: 'sql', toml: 'toml', xml: 'xml', txt: 'plaintext',
  };
  return map[ext || ''] || 'plaintext';
}

function countFiles(tree: FileTreeNode[]): number {
  let count = 0;
  for (const node of tree) {
    if (node.type === 'file') count++;
    if (node.children) count += countFiles(node.children);
  }
  return count;
}

export const projectManager = new ProjectManager();
