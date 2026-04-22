import { Router } from 'express';
import { Server as SocketServer } from 'socket.io';
import { getDb } from '../db.js';
import { randomUUID } from 'crypto';

export function analyzeRoutes(io: SocketServer): Router {
  const router = Router();

  router.post('/', async (req, res) => {
    const { path: projectPath, name } = req.body;
    if (!projectPath) return res.status(400).json({ error: 'path is required' });

    const projectId = randomUUID();
    const projectName = name || projectPath.split('/').pop() || 'Untitled';
    const db = getDb();

    try {
      io.emit('engine-output', { type: 'info', text: `[→] Starting analysis of ${projectPath}`, timestamp: Date.now() });

      // Dynamically import the engine
      const { parseRepository } = await import('../../../src/parser/index.js');
      const { buildDependencyGraph } = await import('../../../src/structural/graph-builder.js');
      const { buildProjectModel } = await import('../../../src/autonomous-engine.js');
      const { KnowledgeGraph } = await import('../../../src/graph/knowledge-graph.js');
      const { detectFlows } = await import('../../../src/flow-engine.js');
      const { analyzeGaps } = await import('../../../src/gap-engine.js');

      io.emit('engine-output', { type: 'info', text: '[→] Phase 1: Parsing repository...', timestamp: Date.now() });
      const parseResults = await parseRepository(projectPath);

      io.emit('engine-output', { type: 'info', text: `[SUCCESS] Parsed ${parseResults.length} files`, timestamp: Date.now() });
      io.emit('engine-output', { type: 'info', text: '[→] Phase 2: Building knowledge graph...', timestamp: Date.now() });

      const deps = buildDependencyGraph(parseResults);
      const graph = new KnowledgeGraph();
      graph.build(deps.nodes, deps.edges);

      io.emit('engine-output', { type: 'info', text: `[SUCCESS] Graph: ${deps.nodes.length} nodes, ${deps.edges.length} edges`, timestamp: Date.now() });
      io.emit('engine-output', { type: 'info', text: '[→] Phase 3: Detecting flows...', timestamp: Date.now() });

      const model = buildProjectModel(graph);
      const flows = detectFlows(graph);

      io.emit('engine-output', { type: 'info', text: `[SUCCESS] ${flows.length} flows detected`, timestamp: Date.now() });
      io.emit('engine-output', { type: 'info', text: '[→] Phase 4: Analyzing gaps...', timestamp: Date.now() });

      // Gap analysis (single pass — no duplicate)
      let gapCount = 0;
      let health = 80;
      let gapsData: any[] = [];
      try {
        const gapResult = await analyzeGaps(model, {
          appType: 'unknown',
          currentCapabilities: [],
          intendedCapabilities: [],
          missingSystems: [],
        }, graph);
        gapCount = gapResult.gaps.length;
        health = gapResult.overallHealth;
        gapsData = gapResult.gaps || [];
      } catch {
        io.emit('engine-output', { type: 'warning', text: '[WARNING] Gap analysis skipped (LLM unavailable)', timestamp: Date.now() });
      }

      // Save to database (including flows + gaps JSON)
      db.prepare(`
        INSERT OR REPLACE INTO projects (id, name, path, last_analyzed, health_score, gap_count, file_count, function_count, flow_count, flows_json, gaps_json)
        VALUES (?, ?, ?, datetime('now'), ?, ?, ?, ?, ?, ?, ?)
      `).run(projectId, projectName, projectPath, health, gapCount, parseResults.length, deps.nodes.filter(n => n.type === 'function').length, flows.length, JSON.stringify(flows), JSON.stringify(gapsData));

      io.emit('engine-output', { type: 'info', text: `[SUCCESS] Analysis complete. Health: ${health}, Gaps: ${gapCount}`, timestamp: Date.now() });

      // Store analysis in memory for subsequent API calls
      (global as any).__supermanSession = {
        projectId,
        projectPath,
        graph,
        model,
        flows,
        gapCount,
        health,
      };

      res.json({
        projectId,
        name: projectName,
        health,
        gapCount,
        fileCount: parseResults.length,
        functionCount: deps.nodes.filter(n => n.type === 'function').length,
        flowCount: flows.length,
      });
    } catch (err: any) {
      io.emit('engine-output', { type: 'error', text: `[ERROR] ${err.message}`, timestamp: Date.now() });
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
