import { Router } from 'express';
import type { Request, Response } from 'express';
import { log, logError } from '../logger.js';
import { projectManager } from '../project-manager.js';
import { generateSuggestions } from '../suggestions/engine.js';
import { generateSummary } from '../suggestions/summary-generator.js';
import { generateBuildInstruction } from '../suggestions/instruction-generator.js';
import { FeedbackStore } from '../suggestions/feedback.js';
import type { Suggestion, SuggestionsResult } from '../suggestions/engine.js';

export const router = Router();

// Cache suggestions so /summary and /build-instruction can reference them by ID
let cachedSuggestions: Map<string, Suggestion> = new Map();
let cachedResult: SuggestionsResult | null = null;
let feedbackStore: FeedbackStore | null = null;

function getFeedbackStore(): FeedbackStore {
  if (!feedbackStore) {
    feedbackStore = new FeedbackStore(projectManager.getProjectPath());
    feedbackStore.load().catch(() => {});
  }
  return feedbackStore;
}

// ── GET /suggestions ──
// Returns all suggestions grouped by category (fixes, features, insights)
router.get('/', (_req: Request, res: Response) => {
  if (!projectManager.isInitialized()) {
    res.json({ fixes: [], features: [], insights: [], health: 0, totalCount: 0 });
    return;
  }

  try {
    const graph = projectManager.getGraph();
    const panelData = projectManager.getPanelData();

    // Get gaps and focus from project manager internals
    const gaps = projectManager.getGaps();
    const focus = projectManager.getFocusItems();
    const health = panelData.overallCompleteness;

    const result = generateSuggestions(gaps, focus, graph, health);

    // Apply feedback adjustments
    const store = getFeedbackStore();
    for (const list of [result.fixes, result.features, result.insights]) {
      for (const sug of list) {
        const adjustment = store.getScoreAdjustment(sug.system, sug.category);
        sug.score = Math.min(100, Math.round(sug.score * adjustment));

        // Demote recently dismissed
        if (store.wasRecentlyDismissed(sug.system, sug.description)) {
          sug.score = Math.max(0, sug.score - 30);
        }
      }
      list.sort((a, b) => b.score - a.score);
    }

    // Cache for subsequent detail requests
    cachedSuggestions.clear();
    for (const sug of [...result.fixes, ...result.features, ...result.insights]) {
      cachedSuggestions.set(sug.id, sug);
    }
    cachedResult = result;

    res.json(result);
  } catch (err: any) {
    logError('server', 'Failed to generate suggestions', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /suggestions/:id/summary ──
// Returns AI-generated plain-English summary for a specific suggestion
router.get('/:id/summary', async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const suggestion = cachedSuggestions.get(id);
  if (!suggestion) {
    res.status(404).json({ error: `Suggestion "${id}" not found. Call GET /suggestions first.` });
    return;
  }

  try {
    const graph = projectManager.getGraph();
    const flows = projectManager.getFlows();
    const tfidf = projectManager.getTFIDFIndex();

    const summary = await generateSummary(suggestion, graph, flows, tfidf);
    res.json(summary);
  } catch (err: any) {
    logError('server', `Failed to generate summary for ${id}`, err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /suggestions/:id/build-instruction ──
// Returns a precise, context-rich instruction optimized for Claude Code
router.get('/:id/build-instruction', async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const suggestion = cachedSuggestions.get(id);
  if (!suggestion) {
    res.status(404).json({ error: `Suggestion "${id}" not found. Call GET /suggestions first.` });
    return;
  }

  try {
    const graph = projectManager.getGraph();
    const instruction = await generateBuildInstruction(suggestion, graph);
    res.json(instruction);
  } catch (err: any) {
    logError('server', `Failed to generate build instruction for ${id}`, err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /suggestions/:id/feedback ──
// Record whether a suggestion was built/dismissed and the outcome
router.post('/:id/feedback', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { action, outcome, buildIterations, errorSummary } = req.body;

  if (!action || !['built', 'dismissed', 'deferred'].includes(action)) {
    res.status(400).json({ error: 'Missing or invalid action. Use: built, dismissed, deferred' });
    return;
  }

  const suggestion = cachedSuggestions.get(id);
  const store = getFeedbackStore();

  store.record({
    suggestionId: id,
    category: suggestion?.category || 'fix',
    system: suggestion?.system || 'unknown',
    action,
    outcome,
    buildIterations,
    timestamp: Date.now(),
    errorSummary,
  });

  res.json({ recorded: true });
});

// ── GET /suggestions/stats ──
// Returns feedback statistics
router.get('/stats', (_req: Request, res: Response) => {
  try {
    const store = getFeedbackStore();
    res.json(store.getStats());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
