export type NodeType =
  | 'file'
  | 'function'
  | 'class'
  | 'method'
  | 'interface'
  | 'type'
  | 'variable'
  | 'route'
  | 'import'
  | 'export';

export type EdgeType =
  | 'calls'
  | 'imports'
  | 'extends'
  | 'implements'
  | 'contains'
  | 'exports'
  | 'uses'
  | 'type_reference'
  | 'renders';

export type Language =
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'go'
  | 'rust'
  | 'java'
  | 'unknown';

export interface Position {
  line: number;
  column: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface CodeNode {
  id: string;
  type: NodeType;
  name: string;
  filePath: string;
  range: Range;
  content: string;
  language: Language;
  signature?: string;
  metadata: NodeMetadata;
}

export interface NodeMetadata {
  exported?: boolean;
  async?: boolean;
  parameters?: ParameterInfo[];
  returnType?: string;
  superClass?: string;
  interfaces?: string[];
  decorators?: string[];
  domain?: string;
  httpMethod?: string;
  routePath?: string;
  importSource?: string;
  importedNames?: string[];
  component?: ComponentMetadata;
}

export interface ParameterInfo {
  name: string;
  type?: string;
  optional?: boolean;
}

export interface CodeEdge {
  source: string;
  target: string;
  type: EdgeType;
  metadata?: Record<string, unknown>;
}

export interface ParseResult {
  nodes: CodeNode[];
  edges: CodeEdge[];
  filePath: string;
  language: Language;
}

export interface IndexResult {
  filesProcessed: number;
  nodesCreated: number;
  edgesCreated: number;
  errors: Array<{ file: string; error: string }>;
  duration: number;
}

export interface QueryResult {
  answer: string;
  relevantNodes: CodeNode[];
  reasoning: string;
  graphPath?: string[];
}

export interface SimulationStep {
  order: number;
  nodeId: string;
  nodeName: string;
  nodeType: NodeType;
  action: string;
  details: string;
  callsTo: string[];
}

export interface SimulationFinding {
  type: 'bottleneck' | 'unused' | 'risky_dependency' | 'side_effect' | 'missing_error_handling';
  nodeId: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface SimulationResult {
  entryPoint: string;
  steps: SimulationStep[];
  findings: SimulationFinding[];
  summary: string;
}

export interface CodeChange {
  filePath: string;
  original: string;
  modified: string;
  diff: string;
  explanation: string;
}

/**
 * A surgical edit — replaces a specific line range instead of the whole file.
 * startLine/endLine are 1-based inclusive.
 * endLine=0 means "insert before startLine" (pure insertion, no deletion).
 */
export interface SurgicalEdit {
  file: string;
  startLine: number;
  endLine: number;
  newContent: string;
  explanation: string;
}

export interface ApplyResult {
  changes: CodeChange[];
  buildResult?: ExecutionResult;
  testResult?: ExecutionResult;
  iterations: number;
  success: boolean;
}

export interface ExecutionResult {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
}

export type LogStage =
  | 'parse'
  | 'embed'
  | 'graph'
  | 'query'
  | 'simulate'
  | 'edit'
  | 'execute'
  | 'sync'
  | 'intent'
  | 'gap'
  | 'plan'
  | 'auto'
  | 'server'
  | 'index'
  | 'apply'
  | 'infra'
  | 'mcp'
  | 'cache';

// ── Autonomous Engine Types ──

export interface System {
  name: string;
  domain: string;
  nodeIds: string[];
  completeness: number; // 0-1
  issues: string[];
}

export interface Flow {
  name: string;
  entryPoint: string;
  steps: string[]; // node IDs in order
  complete: boolean;
  gaps: string[];
}

export interface Entity {
  name: string;
  nodeId: string;
  fields: string[];
  usedBy: string[]; // node IDs that reference this entity
}

export interface ProjectModel {
  systems: System[];
  flows: Flow[];
  entities: Entity[];
  stats: {
    files: number;
    functions: number;
    classes: number;
    routes: number;
  };
}

export interface ProjectIntent {
  appType: string;
  currentCapabilities: string[];
  intendedCapabilities: string[];
  missingSystems: string[];
}

export interface Gap {
  type: 'missing_system' | 'incomplete_flow' | 'broken_integration' | 'architectural_issue'
    | 'unhandled_flow_error' | 'broken_flow_step' | 'missing_flow_response' | 'unvalidated_flow_input';
  system: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedFix: string;
  affectedNodes: string[];
  flowId?: string;
}

export interface GapAnalysis {
  gaps: Gap[];
  overallHealth: number; // 0-100
  criticalIssues: number;
}

export interface PlanStep {
  id: number;
  system: string;
  action: string;
  description: string;
  targetFiles: string[];
  instruction: string; // passed to modification engine
  dependencies: number[]; // step IDs that must complete first
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface ExecutionPlan {
  steps: PlanStep[];
  estimatedComplexity: 'small' | 'medium' | 'large';
  systemOrder: string[];
  /** True when 3+ consecutive failures have been detected for this pattern */
  needsHumanReview?: boolean;
}

export interface IterationResult {
  iteration: number;
  stepsExecuted: number;
  stepsSucceeded: number;
  stepsFailed: number;
  remainingGaps: number;
  buildPassed: boolean;
}

export interface AutonomousResult {
  iterations: IterationResult[];
  finalModel: ProjectModel;
  totalChanges: number;
  success: boolean;
  summary: string;
}

// ── Working Memory Types ──

export interface FlowStep {
  id: string;
  userAction: string;
  systemResponse: string;
  relatedCode: string[];
  status: 'implemented' | 'partial' | 'missing';
}

export interface StructuredFlow {
  id: string;
  name: string;
  description: string;
  steps: FlowStep[];
  completeness: number;
  confidence: number;
  entryFile?: string;
  relatedFiles: string[];
}

export interface WorkingState {
  intent: ProjectModel;
  flows: StructuredFlow[];
  gaps: Gap[];
  plan: PlanStep[];
  decisions: Decision[];
  iteration: number;
  health: number;
  resolvedGapKeys: string[];
  failedStepIds: number[];
  experiences: Experience[];
  changedFiles: string[];
}

export interface Experience {
  id: string;
  timestamp: number;
  query: string;
  detectedFlow: string;
  intent: 'flow' | 'code' | 'system';
  plan: string[];
  actionsTaken: string[];
  result: 'success' | 'failure' | 'partial';
  affectedFiles: string[];
  lesson: string;
  confidence: number; // 0-1, adjusted over time
}

export interface Decision {
  iteration: number;
  action: string;
  outcome: 'success' | 'failure' | 'skipped';
  reason: string;
  timestamp: number;
}

// ── Intent Graph Types ──

export type IntentNodeType = 'product' | 'flow' | 'action' | 'system' | 'feature' | 'implementation' | 'code';
export type IntentStatus = 'planned' | 'partial' | 'complete';

export interface IntentNode {
  id: string;
  level: number;
  title: string;
  description?: string;
  type: IntentNodeType;
  parent?: string;
  children: string[];
  linkedCode?: string[];
  status?: IntentStatus;
  userVisible?: boolean;
  flowId?: string;
  completeness?: number;
  confidence?: number;
}

// ── React Component Analysis Types ──

export interface ComponentMetadata {
  kind: 'component';
  props: PropDefinition[];
  stateFields: StateField[];
  hooks: HookUsage[];
  contextDependencies: string[];
  renderedComponents: string[];
  hasLoadingState: boolean;
  hasErrorBoundary: boolean;
  isScreen: boolean;
}

export interface PropDefinition {
  name: string;
  type: string;
  required: boolean;
  hasDefault: boolean;
}

export interface StateField {
  name: string;
  type: string;
  setter: string;
  initialValue?: string;
}

export interface HookUsage {
  name: string;
  isCustom: boolean;
  returnsValue: boolean;
}

// ── API Contract Validation Types ──

export interface ApiContract {
  endpoint: string;
  method: string;
  file: string;
  line: number;
  params?: string[];
  body?: string;
  responseType?: string;
}

export interface ClientCall {
  url: string;
  method: string;
  file: string;
  line: number;
  body?: string;
  expectedResponse?: string;
}

export type ContractMismatchType =
  | 'MISSING_ENDPOINT'
  | 'METHOD_MISMATCH'
  | 'PARAM_MISMATCH'
  | 'UNUSED_ENDPOINT'
  | 'UNTYPED_RESPONSE';

export interface ContractMismatch {
  type: ContractMismatchType;
  clientCall?: ClientCall;
  serverContract?: ApiContract;
  severity: 'critical' | 'high' | 'medium';
  description: string;
  suggestedFix: string;
}

// ── Query Rewriting Types ──

export interface ExpandedQuery {
  original: string;
  concepts: string[];
  actions: string[];
  components: string[];
  fileTypes: string[];
}

// ── Complete Flow Types ──

export interface CompleteFlow {
  name: string;
  entryPoint: string;
  chain: FlowChainStep[];
  brokenSteps: BrokenStep[];
  externalServices: string[];
  isComplete: boolean;
}

export interface FlowChainStep {
  nodeId: string;
  name: string;
  type: NodeType;
  filePath: string;
  order: number;
  edgeType: EdgeType | 'entry';
}

export interface BrokenStep {
  nodeId: string;
  name: string;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}
