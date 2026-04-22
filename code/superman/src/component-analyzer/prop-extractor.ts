import { parse, Lang, type SgNode } from '@ast-grep/napi';
import type { PropDefinition } from '../types.js';
import { log } from '../logger.js';

/**
 * Extract prop definitions from a React component's source code.
 * Supports:
 *   - function X(props: Props)
 *   - function X({ a, b }: Props)
 *   - const X: React.FC<Props> = ({ a, b }) => ...
 *   - Inline type annotations on destructured params
 */
export function extractProps(source: string): PropDefinition[] {
  // Strategy 1: Find the TypeScript interface / type that defines props
  const interfaceProps = extractPropsFromInterface(source);
  if (interfaceProps.length > 0) {
    // Also check for defaults in the component destructuring
    const defaults = extractDefaultProps(source);
    for (const prop of interfaceProps) {
      if (defaults.has(prop.name)) {
        prop.hasDefault = true;
      }
    }
    return interfaceProps;
  }

  // Strategy 2: Extract from destructured parameters directly
  const destructuredProps = extractPropsFromDestructuring(source);
  if (destructuredProps.length > 0) {
    return destructuredProps;
  }

  return [];
}

/**
 * Find an interface or type alias whose name ends with "Props"
 * and extract each property.
 */
function extractPropsFromInterface(source: string): PropDefinition[] {
  const props: PropDefinition[] = [];
  const tree = parse(Lang.Tsx, source);
  const root = tree.root();

  // Look for interface declarations ending with "Props"
  const interfaces = root.findAll({ rule: { kind: 'interface_declaration' } });
  for (const iface of interfaces) {
    const nameNode = findChildByKind(iface, 'type_identifier');
    if (!nameNode || !nameNode.text().endsWith('Props')) continue;

    const body = findChildByKind(iface, 'interface_body') ?? findChildByKind(iface, 'object_type');
    if (!body) continue;

    extractPropsFromObjectType(body, props);
  }

  // Look for type aliases ending with "Props"
  if (props.length === 0) {
    const types = root.findAll({ rule: { kind: 'type_alias_declaration' } });
    for (const typeAlias of types) {
      const nameNode = findChildByKind(typeAlias, 'type_identifier');
      if (!nameNode || !nameNode.text().endsWith('Props')) continue;

      const body = findChildByKind(typeAlias, 'object_type');
      if (!body) continue;

      extractPropsFromObjectType(body, props);
    }
  }

  return props;
}

function extractPropsFromObjectType(body: SgNode, props: PropDefinition[]): void {
  for (const child of body.children()) {
    if (child.kind() === 'property_signature') {
      const text = child.text();
      const nameNode = findChildByKind(child, 'property_identifier');
      if (!nameNode) continue;

      const name = nameNode.text();
      const isOptional = text.includes('?');
      const typeAnnotation = findChildByKind(child, 'type_annotation');
      const type = typeAnnotation
        ? typeAnnotation.text().replace(/^:\s*/, '').trim()
        : 'unknown';

      props.push({
        name,
        type,
        required: !isOptional,
        hasDefault: false,
      });
    }
  }
}

/**
 * Extract default values from destructured parameters using AST.
 */
function extractDefaultProps(source: string): Set<string> {
  const defaults = new Set<string>();
  const tree = parse(Lang.Tsx, source);
  const root = tree.root();

  // Find all object_assignment_pattern nodes (name = defaultValue in destructuring)
  walk(root, (node) => {
    if (node.kind() === 'object_assignment_pattern') {
      const nameNode = node.children()[0];
      if (nameNode && nameNode.kind() === 'shorthand_property_identifier_pattern') {
        defaults.add(nameNode.text());
      }
    }
  });

  return defaults;
}

/**
 * Extract props directly from destructured function parameters
 * when no Props interface exists.
 */
function extractPropsFromDestructuring(source: string): PropDefinition[] {
  const props: PropDefinition[] = [];
  const tree = parse(Lang.Tsx, source);
  const root = tree.root();

  // Find arrow functions or function declarations
  const arrows = root.findAll({ rule: { kind: 'arrow_function' } });
  const funcs = root.findAll({ rule: { kind: 'function_declaration' } });

  for (const fn of [...arrows, ...funcs]) {
    const params = findChildByKind(fn, 'formal_parameters');
    if (!params) continue;

    for (const param of params.children()) {
      if (param.kind() === 'required_parameter' || param.kind() === 'optional_parameter') {
        const pattern = findChildByKind(param, 'object_pattern');
        if (pattern) {
          extractFromObjectPattern(pattern, props);
          return props; // Return after first component-like function
        }
      }
    }
  }

  return props;
}

function extractFromObjectPattern(pattern: SgNode, props: PropDefinition[]): void {
  for (const child of pattern.children()) {
    if (child.kind() === 'shorthand_property_identifier_pattern') {
      props.push({
        name: child.text(),
        type: 'unknown',
        required: true,
        hasDefault: false,
      });
    } else if (child.kind() === 'pair_pattern') {
      const key = child.children()[0];
      if (key) {
        props.push({
          name: key.text(),
          type: 'unknown',
          required: true,
          hasDefault: false,
        });
      }
    } else if (child.kind() === 'object_assignment_pattern') {
      // Pattern with default: name = defaultValue
      const nameNode = child.children()[0];
      if (nameNode) {
        props.push({
          name: nameNode.text(),
          type: 'unknown',
          required: false,
          hasDefault: true,
        });
      }
    }
  }
}

function findChildByKind(node: SgNode, kind: string): SgNode | null {
  for (const child of node.children()) {
    if (child.kind() === kind) return child;
  }
  return null;
}

function walk(node: SgNode, callback: (n: SgNode) => void): void {
  callback(node);
  for (const child of node.children()) {
    walk(child, callback);
  }
}
