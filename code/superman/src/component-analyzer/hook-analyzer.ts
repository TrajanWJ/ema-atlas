import { parse, Lang, type SgNode } from '@ast-grep/napi';
import type { HookUsage, StateField } from '../types.js';
import { log } from '../logger.js';

const BUILTIN_HOOKS = new Set([
  'useState',
  'useEffect',
  'useContext',
  'useReducer',
  'useCallback',
  'useMemo',
  'useRef',
  'useImperativeHandle',
  'useLayoutEffect',
  'useDebugValue',
  'useDeferredValue',
  'useTransition',
  'useId',
  'useSyncExternalStore',
  'useInsertionEffect',
]);

export interface HookAnalysisResult {
  hooks: HookUsage[];
  stateFields: StateField[];
  hasCleanupEffect: boolean;
  conditionalHooks: string[];
}

/**
 * Analyze all hook usage in a React component source.
 */
export function analyzeHooks(source: string): HookAnalysisResult {
  const hooks: HookUsage[] = [];
  const stateFields: StateField[] = [];
  const conditionalHooks: string[] = [];
  let hasCleanupEffect = false;

  const tree = parse(Lang.Tsx, source);
  const root = tree.root();

  // Find all call expressions that start with "use"
  const callExpressions = root.findAll({ rule: { kind: 'call_expression' } });

  for (const call of callExpressions) {
    const callee = call.children()[0];
    if (!callee) continue;

    const calleeName = callee.text();
    if (!calleeName.startsWith('use') || calleeName.length < 4) continue;

    // Check if it looks like a hook (useXxx pattern -- capital letter after "use")
    const charAfterUse = calleeName[3];
    if (!charAfterUse || charAfterUse !== charAfterUse.toUpperCase()) continue;

    const isCustom = !BUILTIN_HOOKS.has(calleeName);
    const returnsValue = checkReturnsValue(call);

    hooks.push({
      name: calleeName,
      isCustom,
      returnsValue,
    });

    // Check for conditional usage (hook inside if/ternary/logical)
    if (isInsideConditional(call)) {
      conditionalHooks.push(calleeName);
    }

    // Special: useState -> StateField
    if (calleeName === 'useState') {
      const stateField = extractStateField(call);
      if (stateField) {
        stateFields.push(stateField);
      }
    }

    // Special: useEffect cleanup detection
    if (calleeName === 'useEffect' || calleeName === 'useLayoutEffect') {
      if (hasCleanupReturn(call)) {
        hasCleanupEffect = true;
      }
    }
  }

  return { hooks, stateFields, hasCleanupEffect, conditionalHooks };
}

/**
 * Check if a hook call returns a value (is assigned or destructured).
 */
function checkReturnsValue(call: SgNode): boolean {
  const parent = call.parent();
  if (!parent) return false;

  // const [x, setX] = useState(...)  or  const x = useRef(...)
  if (parent.kind() === 'variable_declarator') return true;

  // Assignment: x = useHook()
  if (parent.kind() === 'assignment_expression') return true;

  return false;
}

/**
 * Check if a hook call is inside a conditional (if statement, ternary, or logical expression).
 */
function isInsideConditional(node: SgNode): boolean {
  let current = node.parent();
  while (current) {
    const kind = current.kind();
    if (kind === 'if_statement' || kind === 'ternary_expression' || kind === 'conditional_expression') {
      return true;
    }
    // Stop walking at function boundaries
    if (
      kind === 'function_declaration' ||
      kind === 'arrow_function' ||
      kind === 'method_definition'
    ) {
      break;
    }
    current = current.parent();
  }
  return false;
}

/**
 * Extract StateField from a useState call:
 *   const [value, setValue] = useState(initialValue)
 */
function extractStateField(call: SgNode): StateField | null {
  const parent = call.parent();
  if (!parent || parent.kind() !== 'variable_declarator') return null;

  // Get the array pattern: [value, setValue]
  const arrayPattern = findChildByKind(parent, 'array_pattern');
  if (!arrayPattern) return null;

  const elements: string[] = [];
  for (const child of arrayPattern.children()) {
    if (child.kind() === 'identifier') {
      elements.push(child.text());
    }
  }

  if (elements.length < 2) return null;

  // Get the initial value from useState arguments
  const args = findChildByKind(call, 'arguments');
  let initialValue: string | undefined;
  let type = 'unknown';

  if (args) {
    const firstArg = args.children().find(
      (c) => c.kind() !== '(' && c.kind() !== ')' && c.kind() !== ',',
    );
    if (firstArg) {
      initialValue = firstArg.text();
      type = inferTypeFromValue(initialValue);
    }
  }

  // Check for type parameter: useState<Type>(...)
  const typeArg = findTypeArgInCallText(call.text());
  if (typeArg) {
    type = typeArg;
  }

  return {
    name: elements[0],
    type,
    setter: elements[1],
    initialValue,
  };
}

/**
 * Check if a useEffect callback has a cleanup return.
 */
function hasCleanupReturn(call: SgNode): boolean {
  const args = findChildByKind(call, 'arguments');
  if (!args) return false;

  // The first argument should be a function (arrow or regular)
  for (const child of args.children()) {
    if (child.kind() === 'arrow_function' || child.kind() === 'function') {
      // Look for return statements inside
      const returns = child.findAll({ rule: { kind: 'return_statement' } });
      for (const ret of returns) {
        // A return statement in the effect callback with a value is a cleanup
        // Check if the return value is a function expression
        const retChildren = ret.children();
        for (const rc of retChildren) {
          if (
            rc.kind() === 'arrow_function' ||
            rc.kind() === 'function' ||
            rc.kind() === 'call_expression' ||
            rc.kind() === 'identifier'
          ) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

function inferTypeFromValue(value: string): string {
  if (value === 'true' || value === 'false') return 'boolean';
  if (value === 'null') return 'null';
  if (value === 'undefined') return 'undefined';
  if (/^\d+$/.test(value)) return 'number';
  if (/^['"`]/.test(value)) return 'string';
  if (value.startsWith('[')) return 'array';
  if (value.startsWith('{')) return 'object';
  return 'unknown';
}

function findTypeArgInCallText(text: string): string | null {
  const match = text.match(/useState<([^>]+)>/);
  if (match) return match[1];
  return null;
}

function findChildByKind(node: SgNode, kind: string): SgNode | null {
  for (const child of node.children()) {
    if (child.kind() === kind) return child;
  }
  return null;
}
