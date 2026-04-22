/**
 * Flow Engine — detects structured user flows from the codebase.
 *
 * A flow is NOT a code path. It's a USER JOURNEY:
 *   "User opens loads page → filters by equipment → clicks load →
 *    creates ticket → contacts carrier → books load"
 *
 * Each step has: what the user does, what the system does, what code runs.
 */

import { log } from './logger.js';
import { KnowledgeGraph } from './graph/knowledge-graph.js';
import { getCallChain } from './graph/traversal.js';
import type { CodeNode, StructuredFlow, FlowStep, CompleteFlow, FlowChainStep, BrokenStep } from './types.js';

/**
 * Detect all user flows in the codebase.
 */
export function detectFlows(codeGraph: KnowledgeGraph): StructuredFlow[] {
  log('intent', 'Detecting structured user flows');

  const flows: StructuredFlow[] = [];

  // 1. Page-based flows — each page.tsx is a user journey entry point
  const pageFlows = detectPageFlows(codeGraph);
  flows.push(...pageFlows);

  // 2. Interactive component flows — sheets, modals, wizards, forms
  const interactiveFlows = detectInteractiveFlows(codeGraph, flows);
  flows.push(...interactiveFlows);

  // 3. Cross-page journeys — group related pages by route group
  const journeys = detectCrossPageJourneys(pageFlows);
  flows.push(...journeys);

  // 4. Compute completeness for each flow
  for (const flow of flows) {
    const implemented = flow.steps.filter((s) => s.status === 'implemented').length;
    const total = flow.steps.length || 1;
    flow.completeness = implemented / total;
    flow.confidence = flow.steps.length > 0 ? 0.7 : 0.3;
  }

  log('intent', `Detected ${flows.length} user flows with ${flows.reduce((s, f) => s + f.steps.length, 0)} total steps`);
  return flows;
}

// ── Helpers to filter out noise ──

function isRealFile(filePath: string): boolean {
  return !/node_modules|\.next|\.claude\/worktrees|dist|build/.test(filePath);
}

// ── Page Flows ──

function detectPageFlows(codeGraph: KnowledgeGraph): StructuredFlow[] {
  const flows: StructuredFlow[] = [];
  const allFiles = codeGraph.findByType('file');

  const pageFiles = allFiles.filter((f) =>
    /\/page\.(tsx?|jsx?)$/.test(f.filePath) &&
    isRealFile(f.filePath),
  );

  for (const page of pageFiles) {
    const route = extractRoute(page.filePath);
    if (!route) continue;

    const routeGroup = extractRouteGroup(page.filePath);
    const humanName = routeToHumanName(route, routeGroup);

    // Get all functions in this page
    const neighbors = codeGraph.getNeighbors(page.id, 'forward');
    const functions = neighbors.filter((n) => n.type === 'function' || n.type === 'method');

    // Build steps from handlers
    const steps = buildStepsFromFunctions(functions, codeGraph, route, routeGroup);

    // Add an initial "view" step with human language
    steps.unshift({
      id: `${route}::view`,
      userAction: humanizeViewAction(route, routeGroup),
      systemResponse: humanizeViewResponse(route, routeGroup),
      relatedCode: [page.id],
      status: 'implemented',
    });

    const relatedFiles = [
      page.filePath,
      ...new Set(functions.map((f) => f.filePath)),
    ];

    flows.push({
      id: `flow::${routeGroup ? routeGroup + '::' : ''}${route}`,
      name: humanName,
      description: humanizeFlowDescription(route, routeGroup, steps.length),
      steps,
      completeness: 0,
      confidence: 0,
      entryFile: page.filePath,
      relatedFiles,
    });
  }

  return flows;
}

// ── Interactive Component Flows (Sheets, Modals, Wizards, Forms) ──

function detectInteractiveFlows(
  codeGraph: KnowledgeGraph,
  existingFlows: StructuredFlow[],
): StructuredFlow[] {
  const flows: StructuredFlow[] = [];
  const assignedFiles = new Set(existingFlows.flatMap((f) => f.relatedFiles));
  const allFiles = codeGraph.findByType('file');

  // Match interactive components: Sheets, Modals, Wizards, Forms, Panels, Drawers, Dialogs
  const interactivePatterns = /Sheet|Modal|Wizard|Dialog|Drawer|Composer|Panel|Form/;
  const components = allFiles.filter((f) =>
    interactivePatterns.test(f.filePath) &&
    /\.(tsx?)$/.test(f.filePath) &&
    isRealFile(f.filePath) &&
    !assignedFiles.has(f.filePath) &&
    !/\/ui\//.test(f.filePath),
  );

  for (const comp of components) {
    const neighbors = codeGraph.getNeighbors(comp.id, 'forward');
    const functions = neighbors.filter((n) => n.type === 'function' || n.type === 'method');

    const handlers = functions.filter((f) =>
      /^handle|^on[A-Z]|submit|click|send|save|toggle|open|close|load|fetch|create|delete|update|confirm|approve|reject|cancel|select/i.test(f.name),
    );

    // Interactive components with even 1 handler are worth tracking
    if (handlers.length < 1) continue;

    const fileName = comp.filePath.match(/\/([^/]+)\.(tsx?)$/)?.[1] || comp.name;
    const domain = detectDomain(comp.filePath);
    const humanName = componentToHumanName(fileName, domain);
    const steps = buildStepsFromFunctions(handlers, codeGraph, fileName, domain);

    flows.push({
      id: `flow::interactive::${fileName.toLowerCase()}`,
      name: humanName,
      description: humanizeComponentDescription(fileName, domain, steps.length),
      steps,
      completeness: 0,
      confidence: 0,
      entryFile: comp.filePath,
      relatedFiles: [comp.filePath],
    });
  }

  return flows;
}

// ── Cross-Page Journeys ──

function detectCrossPageJourneys(pageFlows: StructuredFlow[]): StructuredFlow[] {
  const journeys: StructuredFlow[] = [];

  // Group pages by route group
  const groups = new Map<string, StructuredFlow[]>();
  for (const flow of pageFlows) {
    const group = flow.id.match(/flow::(\w+)::/)?.[1] || 'main';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(flow);
  }

  const groupDescriptions: Record<string, { name: string; desc: string }> = {
    app: { name: 'Dispatcher Workflow', desc: 'The complete dispatcher experience — from finding loads to booking carriers and managing shipments' },
    carrier: { name: 'Carrier Portal', desc: 'How carriers view available loads, manage their profile, track earnings, and update shipment status' },
    admin: { name: 'Admin Operations', desc: 'Administrative oversight — managing people, monitoring system health, reviewing activity, and configuring settings' },
  };

  for (const [group, flows] of groups) {
    if (flows.length < 2 || group === 'main') continue;

    const info = groupDescriptions[group] || {
      name: `${group.charAt(0).toUpperCase() + group.slice(1)} Journey`,
      desc: `Complete user journey through the ${group} section`,
    };

    const steps: FlowStep[] = flows.map((f) => ({
      id: `journey::${group}::${f.id}`,
      userAction: `Open ${f.name}`,
      systemResponse: `${f.steps.length} actions available`,
      relatedCode: [],
      status: f.completeness > 0.7 ? 'implemented' as const : f.completeness > 0.3 ? 'partial' as const : 'missing' as const,
    }));

    journeys.push({
      id: `journey::${group}`,
      name: info.name,
      description: info.desc,
      steps,
      completeness: 0,
      confidence: 0.8,
      entryFile: flows[0].entryFile,
      relatedFiles: flows.flatMap((f) => f.relatedFiles),
    });
  }

  return journeys;
}

// ── Step Builder ──

function buildStepsFromFunctions(functions: CodeNode[], codeGraph: KnowledgeGraph, context: string, domain: string): FlowStep[] {
  const steps: FlowStep[] = [];
  const seen = new Set<string>();

  for (const fn of functions) {
    // Only handlers represent user actions
    const isHandler = /^handle|^on[A-Z]|submit|click|send|save|toggle|open|close|create|delete|update|fetch|load|confirm|approve|reject|cancel|select|filter|search|sort/i.test(fn.name);
    if (!isHandler) continue;

    const label = handlerToHumanAction(fn.name, context, domain);
    if (seen.has(label)) continue;
    seen.add(label);

    // Trace what this handler calls to determine system response
    const chain = getCallChain(codeGraph, fn.id);
    const systemResponse = inferHumanResponse(fn, chain, context, domain);

    const relatedCode = [fn.id, ...chain.slice(1, 4).map((n) => n.id)];

    // Determine implementation status
    const hasContent = fn.content.length > 30;
    const hasApiCall = chain.some((n) =>
      /fetch\(|api\.|\.post\(|\.get\(|mutation|query|supabase|prisma|\.insert|\.update|\.delete/i.test(n.content),
    );
    const status = hasContent
      ? (hasApiCall ? 'implemented' : 'partial')
      : 'missing';

    steps.push({
      id: `${fn.filePath}::${fn.name}`,
      userAction: label,
      systemResponse,
      relatedCode,
      status: status as FlowStep['status'],
    });
  }

  return steps;
}

function inferHumanResponse(handler: CodeNode, chain: CodeNode[], context: string, domain: string): string {
  const content = [handler, ...chain.slice(0, 3)]
    .map((n) => n.content.toLowerCase())
    .join(' ');

  const name = handler.name.toLowerCase();

  // Domain-aware responses
  if (/load/i.test(context) || /load/i.test(name)) {
    if (/create|add|new/i.test(name)) return 'Creates the load and adds it to the board';
    if (/delete|remove/i.test(name)) return 'Removes the load from the system';
    if (/update|save|edit/i.test(name)) return 'Saves the updated load details';
    if (/filter|search/i.test(name)) return 'Filters loads matching your criteria';
    if (/assign|book/i.test(name)) return 'Assigns a carrier to the load';
  }
  if (/carrier/i.test(context) || /carrier/i.test(name)) {
    if (/create|add/i.test(name)) return 'Adds the carrier to the system';
    if (/approve|accept/i.test(name)) return 'Approves the carrier for operations';
    if (/contact|call|reach/i.test(name)) return 'Initiates contact with the carrier';
    if (/onboard/i.test(name)) return 'Sends carrier onboarding package';
  }
  if (/ticket/i.test(context) || /ticket/i.test(name)) {
    if (/create|add/i.test(name)) return 'Creates a dispatch ticket';
    if (/update|save/i.test(name)) return 'Updates the ticket status';
    if (/close|complete/i.test(name)) return 'Closes the ticket as complete';
  }
  if (/call/i.test(context) || /call/i.test(name)) {
    if (/start|begin|initiate/i.test(name)) return 'Starts the call and opens the script';
    if (/end|finish|complete/i.test(name)) return 'Ends the call and logs the outcome';
    if (/outcome|result|log/i.test(name)) return 'Records the call outcome';
  }
  if (/offer/i.test(context) || /offer/i.test(name)) {
    if (/send|create/i.test(name)) return 'Sends the rate offer to the carrier';
    if (/accept|confirm/i.test(name)) return 'Carrier accepts the offer — load is booked';
    if (/counter/i.test(name)) return 'Carrier counters with a different rate';
    if (/reject|decline/i.test(name)) return 'Carrier declines the offer';
  }

  // Generic but human-friendly
  if (/fetch\(|api\.|\.post\(/i.test(content)) {
    if (/create|add|new|post/i.test(name)) return 'Saves the new record to the database';
    if (/delete|remove/i.test(name)) return 'Removes the record permanently';
    if (/update|save|edit|patch/i.test(name)) return 'Saves your changes';
    return 'Sends data to the server';
  }
  if (/setstate|usestate|dispatch|set\(/i.test(content)) return 'Updates the view with new data';
  if (/navigate|router|redirect|push/i.test(content)) return 'Takes you to the next screen';
  if (/toast|alert|notification/i.test(content)) return 'Shows a confirmation message';
  if (/modal|dialog|sheet/i.test(content)) return 'Opens a detail panel';
  if (/toggle|open|close/i.test(name)) return 'Opens or closes a section';
  if (/filter|search|sort/i.test(name)) return 'Filters the list based on your input';
  if (/select|pick|choose/i.test(name)) return 'Selects the item';
  if (/cancel/i.test(name)) return 'Cancels the action and goes back';
  if (/confirm|approve/i.test(name)) return 'Confirms and processes the request';
  if (/reject|decline/i.test(name)) return 'Rejects the request';
  if (/upload/i.test(name)) return 'Uploads the file to storage';
  if (/download|export/i.test(name)) return 'Downloads the file to your device';

  return 'Processes your action';
}

// ── Human-Readable Name Generators ──

function handlerToHumanAction(name: string, context: string, domain: string): string {
  // Strip handle/on prefix
  const cleaned = name
    .replace(/^handle|^on/i, '')
    .replace(/([A-Z])/g, ' $1')
    .trim();

  // Make it a verb phrase from the user's perspective
  const words = cleaned.split(' ');
  const verb = words[0].toLowerCase();
  const rest = words.slice(1).join(' ');

  const verbMap: Record<string, string> = {
    submit: 'Submit',
    click: 'Click',
    save: 'Save',
    create: 'Create',
    delete: 'Delete',
    update: 'Update',
    toggle: 'Toggle',
    open: 'Open',
    close: 'Close',
    select: 'Select',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    send: 'Send',
    fetch: 'Load',
    load: 'Load',
    cancel: 'Cancel',
    confirm: 'Confirm',
    approve: 'Approve',
    reject: 'Reject',
    upload: 'Upload',
    download: 'Download',
    export: 'Export',
  };

  const humanVerb = verbMap[verb] || verb.charAt(0).toUpperCase() + verb.slice(1);
  return rest ? `${humanVerb} ${rest.toLowerCase()}` : humanVerb;
}

function routeToHumanName(route: string, group: string): string {
  const names: Record<string, string> = {
    home: 'Landing Page',
    login: 'Sign In',
    signup: 'Create Account',
    'verify-email': 'Email Verification',
    'carrier-login': 'Carrier Sign In',
    dashboard: group === 'carrier' ? 'Carrier Dashboard' : group === 'admin' ? 'Admin Dashboard' : 'Dispatcher Dashboard',
    loads: group === 'carrier' ? 'Available Loads' : group === 'admin' ? 'Load Management' : 'Load Board',
    carriers: group === 'admin' ? 'Carrier Directory' : 'Carrier Management',
    tickets: group === 'admin' ? 'Ticket Oversight' : 'Dispatch Tickets',
    'call-queue': 'Outbound Call Queue',
    calendar: 'Follow-up Calendar',
    workbench: 'Dispatch Workbench',
    pipeline: 'Sales Pipeline',
    settings: group === 'carrier' ? 'Carrier Settings' : group === 'admin' ? 'System Settings' : 'Account Settings',
    templates: 'Message Templates',
    automations: 'Workflow Automations',
    overview: 'Performance Overview',
    'follow-ups': 'Follow-ups & Reminders',
    more: 'More Options',
    operations: 'Operations Center',
    profile: 'Carrier Profile',
    activity: 'Activity Log',
    approvals: 'Pending Approvals',
    calls: 'Call History',
    insights: 'Analytics & Insights',
    leads: 'Lead Management',
    health: 'System Health',
    people: 'Team Management',
  };

  // Handle dynamic routes
  if (route.includes('[token]')) {
    if (route.includes('offer')) return 'Carrier Rate Offer';
    if (route.includes('options')) return 'Load Options';
    if (route.includes('request')) return 'Carrier Request';
    if (route.includes('onboarding')) return 'Carrier Onboarding';
    return 'Dynamic Page';
  }
  if (route.includes('[userId]')) return 'User Detail';

  const key = route.split('/').pop() || route;
  return names[key] || route.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function humanizeViewAction(route: string, group: string): string {
  const name = routeToHumanName(route, group);
  return `Open ${name}`;
}

function humanizeViewResponse(route: string, group: string): string {
  const responses: Record<string, string> = {
    dashboard: 'Shows today\'s key metrics, active loads, and pending tasks',
    loads: group === 'carrier' ? 'Shows loads available for pickup' : 'Shows all loads with status filters and quick actions',
    carriers: 'Shows carrier list with compliance status and contact info',
    tickets: 'Shows dispatch tickets organized by status',
    'call-queue': 'Shows leads ready to call with scripts and outcomes',
    workbench: 'Opens the dispatch workspace with carrier queue and load panels',
    pipeline: 'Shows deals progressing through sales stages',
    calendar: 'Shows upcoming follow-ups and scheduled calls',
    settings: 'Shows configuration options and preferences',
    templates: 'Shows message templates for emails and texts',
    automations: 'Shows automated workflow rules',
    overview: 'Shows performance metrics and team activity',
    'follow-ups': 'Shows scheduled follow-ups and reminders',
    operations: 'Shows operational metrics and system performance',
    profile: 'Shows carrier profile and certification details',
    activity: 'Shows recent actions across the platform',
    approvals: 'Shows items waiting for admin approval',
    calls: 'Shows call recordings and outcomes history',
    insights: 'Shows analytics dashboards and trend data',
    leads: 'Shows inbound and outbound lead pipeline',
    health: 'Shows system uptime, API latency, and error rates',
    people: 'Shows team members with roles and permissions',
  };

  const key = route.split('/').pop() || route;
  return responses[key] || `Displays the ${routeToHumanName(route, group).toLowerCase()} view`;
}

function humanizeFlowDescription(route: string, group: string, stepCount: number): string {
  const key = route.split('/').pop() || route;
  const descriptions: Record<string, string> = {
    dashboard: 'Check daily metrics, review active loads, and jump into urgent tasks',
    loads: group === 'carrier'
      ? 'Browse available loads, view details, and accept assignments'
      : 'Create loads, manage pricing, assign carriers, and track shipments',
    carriers: 'Search carriers, check compliance, review capacity, and initiate contact',
    tickets: 'Create dispatch tickets, update status, track documents, and close out',
    'call-queue': 'Work through leads queue — call, log outcomes, schedule follow-ups',
    workbench: 'The core dispatch workflow — match loads with carriers, send offers, track trips',
    pipeline: 'Move prospects through stages from lead to booked customer',
    settings: 'Configure account preferences, notifications, and integrations',
    login: 'Sign into your account',
    signup: 'Create a new account and set up your profile',
  };

  return descriptions[key] || `${stepCount} actions available in this section`;
}

function componentToHumanName(fileName: string, domain: string): string {
  const names: Record<string, string> = {
    AddLoadSheet: 'Create New Load',
    LoadDetailSheet: 'Load Details',
    CreateOptionSetSheet: 'Send Rate Options',
    OutcomeComposer: 'Log Call Outcome',
    SendOnboardingModal: 'Carrier Onboarding Invite',
    CallDecisionPanel: 'Call Decision',
    LeadDetailSheet: 'Lead Details',
    CallingWizard: 'Outbound Call Flow',
    CalendarView: 'Calendar',
    OfferSetBar: 'Send Rate Offers',
    CarrierQueue: 'Carrier Queue',
    WorkspacePanel: 'Workspace',
    NotificationsSheet: 'Notifications',
    EarningsSheet: 'Earnings Breakdown',
    ContactSheet: 'Contact Carrier',
    RequestDrawer: 'Load Request',
    BulkUploadLeads: 'Bulk Import Leads',
    AdminCommandPalette: 'Admin Quick Actions',
    AdminActionDialog: 'Admin Action',
    AdminDrawer: 'Admin Detail Panel',
    ShortcutOverlay: 'Keyboard Shortcuts',
  };

  if (names[fileName]) return names[fileName];

  // Auto-generate human name
  return fileName
    .replace(/Sheet|Modal|Wizard|Dialog|Drawer|Composer|Panel|Form|Content/g, '')
    .replace(/([A-Z])/g, ' $1')
    .trim() || fileName;
}

function humanizeComponentDescription(fileName: string, domain: string, stepCount: number): string {
  const descriptions: Record<string, string> = {
    AddLoadSheet: 'Fill in origin, destination, equipment, and rate to create a new load',
    LoadDetailSheet: 'View full load details, documents, and carrier assignment history',
    CreateOptionSetSheet: 'Select carriers and send them rate options for a load',
    OutcomeComposer: 'Record what happened on the call — interested, not available, callback, etc.',
    SendOnboardingModal: 'Send a carrier the onboarding link to get set up in the system',
    CallDecisionPanel: 'Decide the next action for this lead after reviewing their info',
    LeadDetailSheet: 'View lead details, past interactions, and notes',
    CallingWizard: 'Step-by-step guided call flow with script, notes, and outcome logging',
    OfferSetBar: 'Batch send rate offers to multiple carriers at once',
    CarrierQueue: 'Work through the carrier contact queue in the workbench',
    NotificationsSheet: 'View and manage your notifications',
    EarningsSheet: 'View earnings breakdown by load and time period',
    ContactSheet: 'Send a message or call a carrier directly',
    RequestDrawer: 'Handle an incoming carrier request for a load',
    BulkUploadLeads: 'Upload a CSV file of leads to import into the call queue',
    AdminCommandPalette: 'Quick-access admin commands and navigation',
  };

  return descriptions[fileName] || `${stepCount} interactive actions`;
}

// ── Utility Helpers ──

function extractRoute(filePath: string): string {
  // app/(group)/route-name/page.tsx → route-name
  const match = filePath.match(/app\/(?:\([^)]+\)\/)*(.+?)\/page\./);
  if (match) return match[1];

  // app/page.tsx → home
  if (/app\/page\.(tsx?|jsx?)$/.test(filePath)) return 'home';

  return '';
}

function extractRouteGroup(filePath: string): string {
  const match = filePath.match(/app\/\(([^)]+)\)\//);
  return match ? match[1] : '';
}

function detectDomain(filePath: string): string {
  if (/\/loads\/|\/load/i.test(filePath)) return 'loads';
  if (/\/carrier/i.test(filePath)) return 'carrier';
  if (/\/ticket/i.test(filePath)) return 'tickets';
  if (/\/call/i.test(filePath)) return 'calls';
  if (/\/admin/i.test(filePath)) return 'admin';
  if (/\/workbench/i.test(filePath)) return 'dispatch';
  if (/\/offer/i.test(filePath)) return 'offers';
  return '';
}

// ── Complete Flow Chain Tracing ──

const EXTERNAL_SERVICE_PATTERNS = /\b(fetch\(|axios\.|supabase\.|prisma\.|stripe\.|sendgrid\.|twilio\.|firebase\.)\b/i;

/**
 * Trace a complete execution flow from an entry point through all call chains.
 * Detects broken steps, external services, and incomplete paths.
 */
export function traceCompleteFlow(
  codeGraph: KnowledgeGraph,
  entryPointId: string,
  flowName: string,
): CompleteFlow {
  const entryNode = codeGraph.getNode(entryPointId);
  if (!entryNode) {
    return {
      name: flowName,
      entryPoint: entryPointId,
      chain: [],
      brokenSteps: [{
        nodeId: entryPointId,
        name: 'unknown',
        reason: 'Entry point node not found in graph',
        severity: 'critical',
      }],
      externalServices: [],
      isComplete: false,
    };
  }

  const chain: FlowChainStep[] = [];
  const brokenSteps: BrokenStep[] = [];
  const externalServices: string[] = [];
  const visited = new Set<string>();

  // Walk the call chain from entry point
  function walk(nodeId: string, depth: number, edgeType: string): void {
    if (visited.has(nodeId) || depth > 20) return;
    visited.add(nodeId);

    const node = codeGraph.getNode(nodeId);
    if (!node) {
      brokenSteps.push({
        nodeId,
        name: nodeId,
        reason: 'Referenced node does not exist in graph',
        severity: 'high',
      });
      return;
    }

    chain.push({
      nodeId: node.id,
      name: node.name,
      type: node.type,
      filePath: node.filePath,
      order: chain.length,
      edgeType: edgeType as FlowChainStep['edgeType'],
    });

    // Check for external service calls
    const serviceMatch = node.content.match(EXTERNAL_SERVICE_PATTERNS);
    if (serviceMatch) {
      const service = serviceMatch[1].replace(/[.(]/g, '');
      if (!externalServices.includes(service)) {
        externalServices.push(service);
      }
    }

    // Check for broken steps
    if (node.content.length < 10 && node.type !== 'import' && node.type !== 'export') {
      brokenSteps.push({
        nodeId: node.id,
        name: node.name,
        reason: 'Function body is empty or stub',
        severity: 'medium',
      });
    }

    // Check for missing error handling on async calls
    const hasAsyncCall = /\bawait\b|\.then\(|\.catch\(/.test(node.content);
    const hasErrorHandling = /try\s*\{|\.catch\(|catch\s*\(/.test(node.content);
    if (hasAsyncCall && !hasErrorHandling) {
      brokenSteps.push({
        nodeId: node.id,
        name: node.name,
        reason: 'Async operation without error handling',
        severity: 'medium',
      });
    }

    // Check for missing response in route handlers
    if (node.type === 'route' || node.metadata.httpMethod) {
      const hasResponse = /res\.(json|send|status|redirect|render)\(|return\s+(new\s+)?Response/i.test(node.content);
      if (!hasResponse && node.content.length > 20) {
        brokenSteps.push({
          nodeId: node.id,
          name: node.name,
          reason: 'Route handler may not send a response',
          severity: 'high',
        });
      }
    }

    // Check for missing input validation on route handlers
    if ((node.type === 'route' || node.metadata.httpMethod) && node.metadata.httpMethod !== 'GET') {
      const hasValidation = /\b(zod|yup|joi|validate|schema|parse)\b/i.test(node.content) ||
        /req\.body\s*&&/.test(node.content);
      if (!hasValidation && node.content.includes('req.body')) {
        brokenSteps.push({
          nodeId: node.id,
          name: node.name,
          reason: 'Accepts req.body without input validation',
          severity: 'high',
        });
      }
    }

    // Follow outgoing calls
    const edges = codeGraph.getEdgesFor(nodeId, 'forward');
    for (const edge of edges) {
      if (edge.type === 'calls' || edge.type === 'uses') {
        walk(edge.target, depth + 1, edge.type);
      }
    }
  }

  walk(entryPointId, 0, 'entry');

  const isComplete = brokenSteps.length === 0;

  log('intent', `Flow trace: "${flowName}"`, {
    steps: chain.length,
    brokenSteps: brokenSteps.length,
    externalServices: externalServices.length,
    isComplete,
  });

  return {
    name: flowName,
    entryPoint: entryPointId,
    chain,
    brokenSteps,
    externalServices,
    isComplete,
  };
}

/**
 * Trace all detected flows in the codebase and return complete flow data.
 */
export function traceAllFlows(codeGraph: KnowledgeGraph): CompleteFlow[] {
  const structuredFlows = detectFlows(codeGraph);
  const completeFlows: CompleteFlow[] = [];

  for (const flow of structuredFlows) {
    // Find the entry point node
    const entryNodeId = flow.steps[0]?.relatedCode[0];
    if (!entryNodeId) continue;

    const completeFlow = traceCompleteFlow(codeGraph, entryNodeId, flow.name);
    completeFlows.push(completeFlow);
  }

  log('intent', `Traced ${completeFlows.length} complete flows`);
  return completeFlows;
}
