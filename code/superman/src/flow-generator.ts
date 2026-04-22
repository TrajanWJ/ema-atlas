import { callClaude, safeParseJSON } from './ai/claude-client.js';
import { log, logError } from './logger.js';
import { KnowledgeGraph } from './graph/knowledge-graph.js';
import { getCallChain } from './graph/traversal.js';
import { IntentGraph } from './intent-graph.js';
import type { ProjectModel, CodeNode, IntentStatus } from './types.js';

/**
 * Flow-first intent graph generator.
 *
 * Instead of mapping code structure (files, modules, utils), this detects
 * USER FLOWS — what a real person does when they use the app:
 *
 * Level 0: Product (what is this app)
 * Level 1: Flows (login, create load, assign carrier, deliver)
 * Level 2: Actions (user clicks, system responds)
 * Level 3: System behavior (API calls, state changes, validations)
 * Level 4: Code (actual functions/files)
 */
export async function generateFlowIntentGraph(
  model: ProjectModel,
  codeGraph: KnowledgeGraph,
): Promise<IntentGraph> {
  log('intent', 'Generating flow-first intent graph');
  const graph = new IntentGraph();

  // ── Level 0: Product ──
  const productId = await detectProduct(model, codeGraph, graph);

  // ── Level 1: User flows — detected from pages, routes, handlers ──
  const flows = detectUserFlows(codeGraph);
  for (const flow of flows) {
    const flowId = `flow::${flow.id}`;
    graph.createNode(flowId, 1, flow.label, 'flow', {
      description: flow.description,
      parent: productId,
      linkedCode: flow.codeIds,
      status: flow.status,
      userVisible: true,
    });
    graph.addChild(productId, flowId);

    // ── Level 2: Actions within this flow ──
    for (const action of flow.actions) {
      const actionId = `action::${flow.id}::${action.id}`;
      graph.createNode(actionId, 2, action.label, 'action', {
        description: action.description,
        parent: flowId,
        linkedCode: action.codeIds,
        status: action.codeIds.length > 0 ? 'complete' : 'planned',
        userVisible: action.userVisible,
      });
      graph.addChild(flowId, actionId);

      // ── Level 3: System behavior behind each action ──
      for (const sys of action.systemBehaviors) {
        const sysId = `system::${flow.id}::${action.id}::${sys.id}`;
        graph.createNode(sysId, 3, sys.label, 'system', {
          description: sys.description,
          parent: actionId,
          linkedCode: sys.codeIds,
          status: sys.codeIds.length > 0 ? 'complete' : 'planned',
          userVisible: false,
        });
        graph.addChild(actionId, sysId);

        // ── Level 4: Code nodes ──
        for (const codeId of sys.codeIds.slice(0, 5)) {
          const node = codeGraph.getNode(codeId);
          if (!node || node.type === 'import' || node.type === 'export') continue;
          const cId = `code::${sysId}::${codeId}`;
          if (graph.getNode(cId)) continue;
          graph.createNode(cId, 4, node.name, 'code', {
            description: `${node.type} in ${node.filePath.split('/').pop()}`,
            parent: sysId,
            linkedCode: [codeId],
            status: 'complete',
            userVisible: false,
          });
          graph.addChild(sysId, cId);
        }
      }
    }
  }

  // ── Detect missing flows via LLM ──
  await detectMissingFlows(graph, model, codeGraph, productId, flows);

  // ── Propagate statuses bottom-up ──
  propagateStatuses(graph);

  const stats = graph.getStats();
  log('intent', 'Flow-first intent graph generated', stats as unknown as Record<string, unknown>);
  return graph;
}

// ── Types ──

interface DetectedFlow {
  id: string;
  label: string;
  description: string;
  status: IntentStatus;
  codeIds: string[];
  actions: DetectedAction[];
}

interface DetectedAction {
  id: string;
  label: string;
  description: string;
  userVisible: boolean;
  codeIds: string[];
  systemBehaviors: SystemBehavior[];
}

interface SystemBehavior {
  id: string;
  label: string;
  description: string;
  codeIds: string[];
}

// ── Level 0 ──

async function detectProduct(
  model: ProjectModel,
  codeGraph: KnowledgeGraph,
  graph: IntentGraph,
): Promise<string> {
  const systems = model.systems.map((s) => s.name);
  let purpose = 'Application';

  try {
    const prompt = `In 5-10 words, what is this application for an end user?
Systems: ${systems.join(', ')}
Routes: ${model.stats.routes}
Respond with ONLY the description, no quotes.`;
    purpose = (await callClaude(prompt, 'intent')).trim() || purpose;
  } catch {
    if (model.stats.routes > 0) purpose = 'Web application';
  }

  const id = 'product::root';
  graph.createNode(id, 0, purpose, 'product', {
    description: `${model.stats.files} files, ${model.stats.routes} routes`,
    status: 'partial',
    userVisible: true,
  });
  return id;
}

// ── Flow Detection ──

function detectUserFlows(codeGraph: KnowledgeGraph): DetectedFlow[] {
  const flows: DetectedFlow[] = [];

  // 1. Detect flows from PAGE components (Next.js app router pages)
  const pageFlows = detectPageFlows(codeGraph);
  flows.push(...pageFlows);

  // 2. Detect flows from API routes
  const apiFlows = detectApiFlows(codeGraph);
  flows.push(...apiFlows);

  // 3. Detect flows from handler functions (handleSubmit, handleClick, etc.)
  enrichFlowsWithHandlers(flows, codeGraph);

  // 4. Merge overlapping flows (e.g., page + API for same feature)
  return mergeFlows(flows);
}

function detectPageFlows(codeGraph: KnowledgeGraph): DetectedFlow[] {
  const flows: DetectedFlow[] = [];
  const allFiles = codeGraph.findByType('file');

  // Find page components: page.tsx, page.ts, layout.tsx in app router
  const pageFiles = allFiles.filter((f) =>
    /\/(page|layout)\.(tsx?|jsx?)$/.test(f.filePath) &&
    !/node_modules|\.next/.test(f.filePath),
  );

  // Group pages by route segment
  const routeGroups = new Map<string, CodeNode[]>();
  for (const page of pageFiles) {
    // Skip layout files (they're wrappers, not flows)
    if (/layout\.(tsx?|jsx?)$/.test(page.filePath)) continue;

    // Extract route from file path: app/(dashboard)/loads/page.tsx → loads
    const match = page.filePath.match(/app\/(?:\([^)]+\)\/)*([^/]+)\/(?:page)\./);
    let route: string;

    if (match) {
      route = match[1];
    } else if (/app\/page\.(tsx?|jsx?)$/.test(page.filePath)) {
      // Root page: app/page.tsx → 'home'
      route = 'home';
    } else {
      route = extractRouteSegment(page.filePath);
    }

    if (!route || route === 'app') continue;

    if (!routeGroups.has(route)) routeGroups.set(route, []);
    routeGroups.get(route)!.push(page);
  }

  // Also detect flows from major client components (Editor, AiPanel, etc.)
  const componentFiles = allFiles.filter((f) =>
    /\/components\/[A-Z][^/]+\.(tsx?)$/.test(f.filePath) &&
    !/node_modules/.test(f.filePath),
  );
  for (const comp of componentFiles) {
    const name = comp.filePath.match(/\/([^/]+)\.(tsx?)$/)?.[1] || '';
    if (!name || routeGroups.has(name.toLowerCase())) continue;

    // Only include major components (those with handler functions)
    const neighbors = codeGraph.getNeighbors(comp.id, 'forward');
    const handlers = neighbors.filter((n) =>
      (n.type === 'function' || n.type === 'method') &&
      /^handle|^on[A-Z]|submit|click|send|save|load|toggle|open|close/i.test(n.name),
    );
    if (handlers.length >= 2) {
      // This component has enough interactivity to be a flow
      const key = name.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '');
      if (!routeGroups.has(key)) {
        routeGroups.set(key, [comp]);
      }
    }
  }

  for (const [route, pages] of routeGroups) {
    const flowLabel = routeToFlowLabel(route);
    const codeIds = pages.map((p) => p.id);

    // Find all functions in these pages
    const pageFunctions: CodeNode[] = [];
    for (const page of pages) {
      const neighbors = codeGraph.getNeighbors(page.id, 'forward');
      pageFunctions.push(...neighbors.filter((n) =>
        n.type === 'function' || n.type === 'method',
      ));
    }

    // Detect actions from handler functions
    const actions = detectActionsFromFunctions(pageFunctions, codeGraph);

    flows.push({
      id: route,
      label: flowLabel,
      description: `User navigates to /${route}`,
      status: codeIds.length > 0 ? 'complete' : 'planned',
      codeIds: [...codeIds, ...pageFunctions.map((f) => f.id)],
      actions: actions.length > 0 ? actions : [{
        id: 'view',
        label: `View ${flowLabel}`,
        description: `User sees the ${flowLabel.toLowerCase()} page`,
        userVisible: true,
        codeIds,
        systemBehaviors: [{
          id: 'render',
          label: 'Render page',
          description: `Render the ${route} page component`,
          codeIds,
        }],
      }],
    });
  }

  return flows;
}

function detectApiFlows(codeGraph: KnowledgeGraph): DetectedFlow[] {
  const flows: DetectedFlow[] = [];
  const routes = codeGraph.findByType('route');

  // Group routes by resource (e.g., /api/loads, /api/carriers)
  const resourceGroups = new Map<string, CodeNode[]>();
  for (const route of routes) {
    const path = route.metadata.routePath || route.name;
    const resource = extractResource(path);
    if (!resource) continue;

    if (!resourceGroups.has(resource)) resourceGroups.set(resource, []);
    resourceGroups.get(resource)!.push(route);
  }

  for (const [resource, routeNodes] of resourceGroups) {
    const actions: DetectedAction[] = [];

    for (const route of routeNodes) {
      const method = route.metadata.httpMethod || 'GET';
      const path = route.metadata.routePath || route.name;
      const actionLabel = methodToAction(method, resource);

      // Trace what this route handler calls
      const chain = getCallChain(codeGraph, route.id);
      const systemBehaviors: SystemBehavior[] = [];

      for (const step of chain.slice(0, 5)) {
        if (step.id === route.id) continue;
        systemBehaviors.push({
          id: step.name,
          label: describeBehavior(step),
          description: `${step.type} ${step.name} in ${step.filePath.split('/').pop()}`,
          codeIds: [step.id],
        });
      }

      actions.push({
        id: `${method.toLowerCase()}-${path.replace(/[/:]/g, '-')}`,
        label: actionLabel,
        description: `${method} ${path}`,
        userVisible: method === 'GET' || method === 'POST',
        codeIds: [route.id, ...chain.map((n) => n.id)],
        systemBehaviors,
      });
    }

    flows.push({
      id: `api-${resource}`,
      label: `${resourceToLabel(resource)} Management`,
      description: `CRUD operations for ${resource}`,
      status: actions.length > 0 ? 'complete' : 'planned',
      codeIds: routeNodes.map((r) => r.id),
      actions,
    });
  }

  return flows;
}

function detectActionsFromFunctions(functions: CodeNode[], codeGraph: KnowledgeGraph): DetectedAction[] {
  const actions: DetectedAction[] = [];
  const seen = new Set<string>();

  for (const fn of functions) {
    const name = fn.name.toLowerCase();

    // Detect handler functions
    const isHandler = /^handle|^on[A-Z]|submit|click|change|toggle|open|close|create|delete|update|save|send|fetch|load/i.test(fn.name);
    if (!isHandler) continue;

    const label = handlerToLabel(fn.name);
    if (seen.has(label)) continue;
    seen.add(label);

    // Trace what this handler calls
    const chain = getCallChain(codeGraph, fn.id);
    const systemBehaviors: SystemBehavior[] = [];

    for (const step of chain.slice(1, 5)) {
      const isApiCall = /fetch|api|post|get|put|delete|mutation|query/i.test(step.name) ||
        /fetch\(|api\.|\.post\(|\.get\(/i.test(step.content);

      systemBehaviors.push({
        id: step.name,
        label: isApiCall ? `API: ${step.name}` : describeBehavior(step),
        description: step.content.slice(0, 100),
        codeIds: [step.id],
      });
    }

    actions.push({
      id: fn.name,
      label,
      description: fn.content.slice(0, 100),
      userVisible: true,
      codeIds: [fn.id],
      systemBehaviors,
    });
  }

  return actions;
}

function enrichFlowsWithHandlers(flows: DetectedFlow[], codeGraph: KnowledgeGraph): void {
  // Find handler functions not yet assigned to any flow
  const assignedCodeIds = new Set(flows.flatMap((f) => f.codeIds));
  const allFunctions = codeGraph.findByType('function');

  const unassignedHandlers = allFunctions.filter((fn) => {
    if (assignedCodeIds.has(fn.id)) return false;
    return /^handle|^on[A-Z]|Submit|Click/i.test(fn.name);
  });

  // Try to assign them to existing flows by file proximity
  for (const handler of unassignedHandlers) {
    const fileNodes = codeGraph.findByFile(handler.filePath);
    for (const flow of flows) {
      const flowFiles = new Set(
        flow.codeIds
          .map((id) => codeGraph.getNode(id))
          .filter(Boolean)
          .map((n) => (n as CodeNode).filePath),
      );
      if (flowFiles.has(handler.filePath)) {
        const action = detectActionsFromFunctions([handler], codeGraph);
        flow.actions.push(...action);
        flow.codeIds.push(handler.id);
        break;
      }
    }
  }
}

function mergeFlows(flows: DetectedFlow[]): DetectedFlow[] {
  // Merge page flows with API flows for the same resource
  const merged = new Map<string, DetectedFlow>();

  for (const flow of flows) {
    const key = flow.id.replace(/^api-/, '');

    if (merged.has(key)) {
      const existing = merged.get(key)!;
      existing.actions.push(...flow.actions);
      existing.codeIds.push(...flow.codeIds);
      existing.codeIds = [...new Set(existing.codeIds)];
      if (flow.description && !existing.description.includes(flow.description)) {
        existing.description += '; ' + flow.description;
      }
    } else {
      merged.set(key, { ...flow, id: key });
    }
  }

  return Array.from(merged.values());
}

// ── Missing Flow Detection (LLM) ──

async function detectMissingFlows(
  graph: IntentGraph,
  model: ProjectModel,
  codeGraph: KnowledgeGraph,
  productId: string,
  existingFlows: DetectedFlow[],
): Promise<void> {
  const existingNames = existingFlows.map((f) => f.label);
  const entities = model.entities.map((e) => e.name);
  const systems = model.systems.map((s) => s.name);

  const prompt = `Given this app with:
- Existing user flows: ${existingNames.join(', ')}
- Data entities: ${entities.join(', ')}
- Systems: ${systems.join(', ')}

What user flows are MISSING but clearly implied by the data model?
Only include flows a real end-user would perform. No internal/dev flows.

Respond ONLY with JSON:
[{"id":"slug","label":"Flow Name","description":"what user does","actions":["step 1","step 2","step 3"]}]

Max 8 flows.`;

  try {
    const response = await callClaude(prompt, 'intent');
    const parsed = safeParseJSON<Array<{
      id: string;
      label: string;
      description: string;
      actions: string[];
    }>>(response);

    if (!parsed.ok) return;

    for (const missing of parsed.data) {
      const flowId = `flow::${missing.id}`;
      if (graph.getNode(flowId)) continue;

      graph.createNode(flowId, 1, missing.label, 'flow', {
        description: missing.description,
        parent: productId,
        status: 'planned',
        userVisible: true,
      });
      graph.addChild(productId, flowId);

      // Add planned actions
      for (let i = 0; i < missing.actions.length; i++) {
        const actionId = `action::${missing.id}::step-${i}`;
        graph.createNode(actionId, 2, missing.actions[i], 'action', {
          parent: flowId,
          status: 'planned',
          userVisible: true,
        });
        graph.addChild(flowId, actionId);
      }
    }
  } catch (err) {
    logError('intent', 'Missing flow detection failed', err);
  }
}

// ── Status Propagation ──

function propagateStatuses(graph: IntentGraph): void {
  const allNodes = graph.allNodes();
  const sorted = [...allNodes].sort((a, b) => b.level - a.level);

  for (const node of sorted) {
    if (node.children.length > 0) {
      graph.updateStatus(node.id);
    }
  }
}

// ── Helpers ──

function extractRouteSegment(filePath: string): string {
  const parts = filePath.split('/');
  // Walk backwards to find the meaningful segment
  for (let i = parts.length - 2; i >= 0; i--) {
    const seg = parts[i];
    if (seg === 'app' || seg.startsWith('(') || seg === 'api') continue;
    return seg;
  }
  return '';
}

function routeToFlowLabel(route: string): string {
  // Convert route slugs to human labels
  const labels: Record<string, string> = {
    home: 'Home',
    login: 'Login',
    signup: 'Sign Up',
    dashboard: 'Dashboard',
    loads: 'Load Management',
    carriers: 'Carrier Management',
    tickets: 'Dispatch Tickets',
    dispatch: 'Dispatch Workflow',
    settings: 'Settings',
    documents: 'Documents',
    templates: 'Templates',
    automations: 'Automations',
    onboarding: 'Onboarding',
    profile: 'User Profile',
    billing: 'Billing',
    analytics: 'Analytics',
    reports: 'Reports',
    admin: 'Administration',
    workbench: 'Workbench',
    issues: 'Issue Tracking',
    graph: 'Intent Graph',
    // Component-based flows
    editor: 'Code Editor',
    'ai-panel': 'AI Assistant',
    'code-editor': 'Code Editing',
    sidebar: 'File Browser',
    'tab-bar': 'File Tabs',
    'spatial-canvas': 'Spatial Graph',
    'node-inspector': 'Node Inspector',
    'intent-graph-panel': 'Intent Graph Panel',
  };

  return labels[route] || route
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function extractResource(path: string): string {
  // /api/loads/:id → loads
  const match = path.match(/\/api\/([a-z-]+)/);
  return match ? match[1] : '';
}

function resourceToLabel(resource: string): string {
  return resource
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function methodToAction(method: string, resource: string): string {
  const label = resourceToLabel(resource);
  switch (method) {
    case 'GET': return `View ${label}`;
    case 'POST': return `Create ${label}`;
    case 'PUT': case 'PATCH': return `Update ${label}`;
    case 'DELETE': return `Delete ${label}`;
    default: return `${method} ${label}`;
  }
}

function handlerToLabel(name: string): string {
  // handleSubmitTicket → Submit Ticket
  // onClickAssign → Assign
  return name
    .replace(/^handle|^on[A-Z][a-z]*/i, '')
    .replace(/([A-Z])/g, ' $1')
    .trim() || name;
}

function describeBehavior(node: CodeNode): string {
  const content = node.content.toLowerCase();
  if (/fetch\(|api\.|\.post\(|\.get\(/i.test(content)) return `API call: ${node.name}`;
  if (/validate|schema|parse|zod/i.test(content)) return `Validate: ${node.name}`;
  if (/set\w*state|usestate|dispatch/i.test(content)) return `Update state: ${node.name}`;
  if (/navigate|router|redirect|push/i.test(content)) return `Navigate: ${node.name}`;
  if (/toast|alert|notification/i.test(content)) return `Notify: ${node.name}`;
  return node.name;
}

/**
 * Update flow statuses after code changes.
 */
export function updateFlowIntentGraph(
  intentGraph: IntentGraph,
  codeGraph: KnowledgeGraph,
): void {
  log('intent', 'Updating flow intent graph statuses');

  // Re-evaluate leaf nodes based on linked code existence
  for (const node of intentGraph.allNodes()) {
    if (node.children.length === 0 && node.linkedCode && node.linkedCode.length > 0) {
      const existing = node.linkedCode.filter((id) => codeGraph.getNode(id));
      if (existing.length === node.linkedCode.length) node.status = 'complete';
      else if (existing.length > 0) node.status = 'partial';
      else node.status = 'planned';
    }
  }

  propagateStatuses(intentGraph);
  const stats = intentGraph.getStats();
  log('intent', 'Flow intent graph updated', stats as unknown as Record<string, unknown>);
}
