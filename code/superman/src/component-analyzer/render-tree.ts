import { parse, Lang, type SgNode } from '@ast-grep/napi';
import { log } from '../logger.js';

export interface RenderTreeResult {
  renderedComponents: string[];
  hasMissingKeys: boolean;
  listRenders: number;
}

/**
 * Parse JSX return to extract rendered components,
 * detect list rendering, and check for missing key props.
 */
export function buildRenderTree(source: string): RenderTreeResult {
  const renderedComponents = new Set<string>();
  let hasMissingKeys = false;
  let listRenders = 0;

  const tree = parse(Lang.Tsx, source);
  const root = tree.root();

  // Find all JSX elements: <ComponentName ... >...</ComponentName>
  const jsxElements = root.findAll({ rule: { kind: 'jsx_element' } });
  for (const el of jsxElements) {
    const openingElement = findChildByKind(el, 'jsx_opening_element');
    if (openingElement) {
      const tagName = extractJsxTagName(openingElement);
      if (tagName && isComponentName(tagName)) {
        renderedComponents.add(tagName);
      }
    }
  }

  // Find all self-closing JSX elements: <ComponentName ... />
  const jsxSelfClosing = root.findAll({ rule: { kind: 'jsx_self_closing_element' } });
  for (const el of jsxSelfClosing) {
    const tagName = extractJsxTagName(el);
    if (tagName && isComponentName(tagName)) {
      renderedComponents.add(tagName);
    }
  }

  // Detect list rendering: .map() calls that produce JSX
  const callExpressions = root.findAll({ rule: { kind: 'call_expression' } });
  for (const call of callExpressions) {
    const callee = call.children()[0];
    if (!callee) continue;

    if (callee.kind() === 'member_expression') {
      const prop = findChildByKind(callee, 'property_identifier');
      if (prop && prop.text() === 'map') {
        // Check if the callback returns JSX
        const callText = call.text();
        if (callText.includes('<') && callText.includes('>')) {
          listRenders++;

          // Check for missing key prop
          if (!hasKeyProp(call)) {
            hasMissingKeys = true;
          }
        }
      }
    }
  }

  return {
    renderedComponents: [...renderedComponents],
    hasMissingKeys,
    listRenders,
  };
}

/**
 * Extract the tag name from a JSX opening element or self-closing element.
 * In the AST, the tag name is an `identifier` or `member_expression` child.
 */
function extractJsxTagName(element: SgNode): string | null {
  for (const child of element.children()) {
    if (child.kind() === 'identifier' || child.kind() === 'member_expression') {
      return child.text();
    }
  }
  return null;
}

/**
 * Check if a name is a React component (starts with uppercase).
 */
function isComponentName(name: string): boolean {
  return /^[A-Z]/.test(name);
}

/**
 * Check if a .map() call's JSX output includes a key prop.
 */
function hasKeyProp(mapCall: SgNode): boolean {
  const text = mapCall.text();

  // Look for key= or key={ in the JSX within the map callback
  if (/\bkey\s*=/.test(text)) {
    return true;
  }

  return false;
}

function findChildByKind(node: SgNode, kind: string): SgNode | null {
  for (const child of node.children()) {
    if (child.kind() === kind) return child;
  }
  return null;
}
