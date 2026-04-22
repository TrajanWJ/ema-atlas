/**
 * Product Vision Engine.
 *
 * Infers what the product is INTENDED to be — not just what code exists.
 * Uses flows, entities, routes, and LLM reasoning to build a vision
 * that guides all planning and execution.
 *
 * Persists in working memory so it evolves but never resets.
 */

import { callClaude, safeParseJSON } from './ai/claude-client.js';
import { log, logError } from './logger.js';
import type { StructuredFlow, ProjectModel } from './types.js';

export interface ProductVision {
  name: string;
  purpose: string;
  targetUser: string;
  coreFlows: string[];
  requiredSystems: string[];
  completionCriteria: string[];
  currentState: string;
  nextMilestone: string;
  timestamp: number;
}

/**
 * Generate or refine the product vision from the current codebase state.
 */
export async function generateProductVision(
  model: ProjectModel,
  flows: StructuredFlow[],
  existingVision?: ProductVision | null,
): Promise<ProductVision> {
  log('auto', 'Generating product vision');

  const flowNames = flows.map((f) => `${f.name} (${Math.round(f.completeness * 100)}%)`);
  const systems = model.systems.map((s) => s.name);
  const entities = model.entities.map((e) => e.name);
  const routes = model.stats.routes;

  const existingContext = existingVision
    ? `\nPrevious vision: "${existingVision.purpose}" for ${existingVision.targetUser}. Next milestone was: ${existingVision.nextMilestone}`
    : '';

  const prompt = `Analyze this codebase and determine what product it's meant to become.

Flows: ${flowNames.join(', ')}
Systems: ${systems.join(', ')}
Entities: ${entities.join(', ')}
Routes: ${routes}
Files: ${model.stats.files}
${existingContext}

Respond ONLY with JSON:
{
  "name": "product name",
  "purpose": "one sentence — what this product does for its user",
  "targetUser": "who uses this (e.g., freight dispatcher, developer, etc.)",
  "coreFlows": ["the 5-8 most important user journeys this product MUST have"],
  "requiredSystems": ["backend systems needed (auth, database, etc.)"],
  "completionCriteria": ["5 specific things that must work for v1 launch"],
  "currentState": "honest assessment of where the product is now",
  "nextMilestone": "the single most important thing to build next"
}`;

  try {
    const response = await callClaude(prompt, 'auto');
    const parsed = safeParseJSON<Omit<ProductVision, 'timestamp'>>(response);
    if (parsed.ok) {
      return { ...parsed.data, timestamp: Date.now() };
    }
  } catch (err) {
    logError('auto', 'Vision generation failed', err);
  }

  // Fallback
  return {
    name: 'Application',
    purpose: `A ${systems.includes('api') ? 'web application' : 'software project'} with ${flows.length} user flows`,
    targetUser: 'End user',
    coreFlows: flowNames.slice(0, 8),
    requiredSystems: systems,
    completionCriteria: ['All core flows implemented', 'Build passes', 'No critical bugs'],
    currentState: `${flows.length} flows detected, ${Math.round(flows.reduce((s, f) => s + f.completeness, 0) / Math.max(flows.length, 1) * 100)}% average completeness`,
    nextMilestone: 'Complete the lowest-completeness flow',
    timestamp: Date.now(),
  };
}

/**
 * Build an implementation plan for a specific task, considering the full product vision.
 */
export async function buildImplementationPlan(
  taskName: string,
  taskBlockers: string[],
  vision: ProductVision,
  model: ProjectModel,
  flows: StructuredFlow[],
): Promise<ImplementationPlan> {
  log('auto', `Building implementation plan for: ${taskName}`);

  const relatedFlow = flows.find((f) =>
    f.name.toLowerCase().includes(taskName.toLowerCase()) ||
    taskName.toLowerCase().includes(f.name.toLowerCase()),
  );

  const flowContext = relatedFlow
    ? `\nFlow "${relatedFlow.name}" has ${relatedFlow.steps.length} steps, ${Math.round(relatedFlow.completeness * 100)}% complete.\nSteps: ${relatedFlow.steps.map((s) => `${s.userAction} [${s.status}]`).join(', ')}`
    : '';

  const prompt = `You are building an implementation plan for a feature in "${vision.name}".

Product purpose: ${vision.purpose}
Target user: ${vision.targetUser}
Next milestone: ${vision.nextMilestone}

Task: ${taskName}
Blockers: ${taskBlockers.join(', ')}
${flowContext}

Available systems: ${model.systems.map((s) => s.name).join(', ')}

Create a step-by-step plan. Each step must be a SINGLE, atomic code change.
Think about: what files to create/modify, what the user will see, what the system needs.

Respond ONLY with JSON:
{
  "approach": "1-2 sentence description of the best approach",
  "steps": [
    {
      "order": 1,
      "action": "what to do",
      "targetFiles": ["files to create or modify"],
      "instruction": "exact instruction for the code modification engine",
      "userImpact": "what the user will see/experience after this step"
    }
  ],
  "estimatedComplexity": "small | medium | large",
  "risks": ["potential issues to watch for"]
}`;

  try {
    const response = await callClaude(prompt, 'plan');
    const parsed = safeParseJSON<Omit<ImplementationPlan, 'taskName' | 'vision'>>(response);
    if (parsed.ok) {
      return { taskName, vision: vision.name, ...parsed.data };
    }
  } catch (err) {
    logError('plan', 'Plan generation failed', err);
  }

  return {
    taskName,
    vision: vision.name,
    approach: `Implement ${taskName} by addressing blockers: ${taskBlockers.join(', ')}`,
    steps: taskBlockers.map((b, i) => ({
      order: i + 1,
      action: `Fix: ${b}`,
      targetFiles: [],
      instruction: b,
      userImpact: 'Resolves a missing capability',
    })),
    estimatedComplexity: 'medium' as const,
    risks: ['May require manual review'],
  };
}

export interface ImplementationPlan {
  taskName: string;
  vision: string;
  approach: string;
  steps: Array<{
    order: number;
    action: string;
    targetFiles: string[];
    instruction: string;
    userImpact: string;
  }>;
  estimatedComplexity: 'small' | 'medium' | 'large';
  risks: string[];
}
