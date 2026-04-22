import { parse, Lang, type SgNode } from '@ast-grep/napi';
import { log } from '../logger.js';

export interface ContextTrackingResult {
  contextDependencies: string[];
  providedContexts: string[];
}

/**
 * Track React Context usage:
 *  - useContext() calls -> extract context name
 *  - Context.Provider in JSX return -> provided contexts
 */
export function trackContext(source: string): ContextTrackingResult {
  const contextDependencies = new Set<string>();
  const providedContexts = new Set<string>();

  const tree = parse(Lang.Tsx, source);
  const root = tree.root();

  // Find useContext() calls
  const callExpressions = root.findAll({ rule: { kind: 'call_expression' } });
  for (const call of callExpressions) {
    const callee = call.children()[0];
    if (!callee) continue;

    if (callee.text() === 'useContext') {
      const args = findChildByKind(call, 'arguments');
      if (args) {
        for (const child of args.children()) {
          if (child.kind() === 'identifier') {
            contextDependencies.add(child.text());
          } else if (child.kind() === 'member_expression') {
            contextDependencies.add(child.text());
          }
        }
      }
    }
  }

  // Find Context.Provider in JSX
  const jsxElements = root.findAll({ rule: { kind: 'jsx_element' } });
  for (const el of jsxElements) {
    const opening = findChildByKind(el, 'jsx_opening_element');
    if (opening) {
      const tagText = extractJsxTag(opening);
      if (tagText && tagText.endsWith('.Provider')) {
        const contextName = tagText.replace('.Provider', '');
        providedContexts.add(contextName);
      }
    }
  }

  const jsxSelfClosing = root.findAll({ rule: { kind: 'jsx_self_closing_element' } });
  for (const el of jsxSelfClosing) {
    const tagText = extractJsxTag(el);
    if (tagText && tagText.endsWith('.Provider')) {
      const contextName = tagText.replace('.Provider', '');
      providedContexts.add(contextName);
    }
  }

  return {
    contextDependencies: [...contextDependencies],
    providedContexts: [...providedContexts],
  };
}

function extractJsxTag(element: SgNode): string | null {
  for (const child of element.children()) {
    if (child.kind() === 'identifier' || child.kind() === 'member_expression') {
      return child.text();
    }
  }
  return null;
}

function findChildByKind(node: SgNode, kind: string): SgNode | null {
  for (const child of node.children()) {
    if (child.kind() === kind) return child;
  }
  return null;
}
