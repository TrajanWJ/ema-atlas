import { Router } from 'express';
import type { Request, Response } from 'express';
import { log, logError } from '../logger.js';
import { projectManager } from '../project-manager.js';
import { getVisibleNodes } from '../zoom-engine.js';
import { analyzeGapsFromIntentGraph } from '../gap-engine.js';
import { createPlan } from '../planner.js';
import { proposeChanges, applyChanges } from '../modification/engine.js';
import { runCommand } from '../execution/runner.js';
import type { IntentNodeType, IntentStatus } from '../types.js';

export const router = Router();

router.get('/', (req: Request, res: Response) => {
  if (!projectManager.isInitialized()) {
    res.status(400).json({ error: 'No active project. Call POST /project first.' });
    return;
  }

  const intentGraph = projectManager.getIntentGraph();
  if (!intentGraph) {
    res.json({ nodes: [], stats: { totalNodes: 0 }, zoom: 0 });
    return;
  }

  const zoom = parseInt(req.query.zoom as string, 10);
  const zoomLevel = isNaN(zoom) ? 4 : zoom;
  const maxLevel = intentGraph.maxLevel();

  const nodes = zoomLevel < maxLevel
    ? getVisibleNodes(intentGraph, zoomLevel)
    : intentGraph.allNodes();

  res.json({
    nodes,
    stats: intentGraph.getStats(),
    zoom: zoomLevel,
  });
});

router.post('/add', (req: Request, res: Response) => {
  if (!projectManager.isInitialized()) {
    res.status(400).json({ error: 'No active project. Call POST /project first.' });
    return;
  }

  const intentGraph = projectManager.getIntentGraph();
  if (!intentGraph) {
    res.json({ nodes: [], stats: { totalNodes: 0 }, zoom: 0 });
    return;
  }

  const { parentId, title, type, description } = req.body as {
    parentId: string;
    title: string;
    type: IntentNodeType;
    description?: string;
  };

  if (!parentId || !title || !type) {
    res.status(400).json({ error: 'Missing required fields: parentId, title, type' });
    return;
  }

  const parent = intentGraph.getNode(parentId);
  if (!parent) {
    res.status(400).json({ error: `Parent node not found: ${parentId}` });
    return;
  }

  try {
    const id = `${type}::${title.toLowerCase().replace(/\s+/g, '-')}`;
    const level = parent.level + 1;

    const node = intentGraph.createNode(id, level, title, type, {
      description,
      parent: parentId,
    });
    intentGraph.addChild(parentId, id);

    log('intent', `Added intent node: ${id}`, { parentId, level });

    res.json({ node });
  } catch (err: any) {
    logError('intent', 'Failed to add intent node', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/update', (req: Request, res: Response) => {
  if (!projectManager.isInitialized()) {
    res.status(400).json({ error: 'No active project. Call POST /project first.' });
    return;
  }

  const intentGraph = projectManager.getIntentGraph();
  if (!intentGraph) {
    res.json({ nodes: [], stats: { totalNodes: 0 }, zoom: 0 });
    return;
  }

  const { id, title, description, status } = req.body as {
    id: string;
    title?: string;
    description?: string;
    status?: IntentStatus;
  };

  if (!id) {
    res.status(400).json({ error: 'Missing required field: id' });
    return;
  }

  const node = intentGraph.getNode(id);
  if (!node) {
    res.status(400).json({ error: `Node not found: ${id}` });
    return;
  }

  try {
    if (title !== undefined) node.title = title;
    if (description !== undefined) node.description = description;
    if (status !== undefined) node.status = status;

    log('intent', `Updated intent node: ${id}`);

    res.json({ node });
  } catch (err: any) {
    logError('intent', 'Failed to update intent node', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/execute', async (req: Request, res: Response) => {
  if (!projectManager.isInitialized()) {
    res.status(400).json({ error: 'No active project. Call POST /project first.' });
    return;
  }

  const intentGraph = projectManager.getIntentGraph();
  const model = projectManager.getModel();
  const codeGraph = projectManager.getGraph();

  if (!intentGraph || !model) {
    res.status(400).json({ error: 'Intent graph or project model not available.' });
    return;
  }

  const { nodeId } = req.body as { nodeId: string };

  if (!nodeId) {
    res.status(400).json({ error: 'Missing required field: nodeId' });
    return;
  }

  const intentNode = intentGraph.getNode(nodeId);
  if (!intentNode) {
    res.status(400).json({ error: `Intent node not found: ${nodeId}` });
    return;
  }

  log('intent', `Executing intent pipeline for node: ${nodeId}`);

  try {
    // 1. Get the subtree
    const subtree = intentGraph.getSubtree(nodeId);
    log('intent', `Subtree has ${subtree.length} node(s)`);

    // 2. Analyze gaps
    const analysis = await analyzeGapsFromIntentGraph(model, intentGraph, codeGraph);
    log('gap', `Found ${analysis.gaps.length} gap(s)`);

    // 3. Create plan
    const plan = await createPlan(analysis, model, codeGraph);
    log('plan', `Plan has ${plan.steps.length} step(s)`);

    // 4. Execute each plan step
    let stepsExecuted = 0;
    let stepsSucceeded = 0;
    let stepsFailed = 0;

    for (const step of plan.steps) {
      stepsExecuted++;
      try {
        log('apply', `Executing step ${step.id}: ${step.action}`);
        const changes = await proposeChanges(step.instruction, step.targetFiles, codeGraph);
        await applyChanges(changes);
        stepsSucceeded++;
      } catch (err: any) {
        logError('apply', `Step ${step.id} failed`, err);
        stepsFailed++;
      }
    }

    // 5. Build validation
    const projectPath = projectManager.getProjectPath();
    const buildResult = runCommand('npm run build 2>&1 || true', projectPath);
    const buildPassed = buildResult.exitCode === 0;
    log('execute', `Build ${buildPassed ? 'passed' : 'failed'}`, { exitCode: buildResult.exitCode });

    // 6. Reindex
    await projectManager.reindex();
    log('index', 'Reindexed after intent execution');

    res.json({
      stepsExecuted,
      stepsSucceeded,
      stepsFailed,
      buildPassed,
      gaps: analysis.gaps.length,
    });
  } catch (err: any) {
    logError('intent', 'Intent execution pipeline failed', err);
    res.status(500).json({ error: err.message });
  }
});
