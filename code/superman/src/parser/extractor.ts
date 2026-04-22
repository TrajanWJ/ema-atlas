import { parse, Lang, type SgNode } from '@ast-grep/napi';
import type {
  CodeNode,
  CodeEdge,
  Language,
  NodeType,
  NodeMetadata,
  ParseResult,
  ParameterInfo,
} from '../types.js';
import { analyzeComponent } from '../component-analyzer/index.js';

export function detectLanguage(filePath: string): Language {
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'py':
      return 'python';
    case 'go':
      return 'go';
    case 'rs':
      return 'rust';
    case 'java':
      return 'java';
    default:
      return 'unknown';
  }
}

export function detectLang(filePath: string): Lang | null {
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
      return Lang.TypeScript;
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return Lang.JavaScript;
    case 'py':
      return Lang.Python;
    case 'go':
      return Lang.Go;
    case 'rs':
      return Lang.Rust;
    case 'java':
      return Lang.Java;
    default:
      return null;
  }
}

function walk(node: SgNode, callback: (n: SgNode) => void): void {
  callback(node);
  for (const child of node.children()) {
    walk(child, callback);
  }
}

function makeId(filePath: string, name: string, line: number): string {
  return `${filePath}::${name}::${line}`;
}

function detectDomain(filePath: string): string | undefined {
  const lower = filePath.toLowerCase();
  if (lower.includes('auth')) return 'auth';
  if (lower.includes('database') || lower.includes('/db/') || lower.includes('/db.')) return 'database';
  if (lower.includes('api') || lower.includes('route')) return 'api';
  if (lower.includes('middleware')) return 'middleware';
  if (lower.includes('model')) return 'model';
  if (lower.includes('util') || lower.includes('helper')) return 'utility';
  if (lower.includes('test') || lower.includes('spec')) return 'test';
  if (lower.includes('config')) return 'config';
  return undefined;
}

function isExported(node: SgNode): boolean {
  const parent = node.parent();
  if (!parent) return false;
  if (parent.kind() === 'export_statement') return true;
  // Check if the node has an `export` keyword among siblings
  const grandParent = parent.parent();
  if (grandParent && grandParent.kind() === 'export_statement') return true;
  return false;
}

function isAsync(node: SgNode): boolean {
  // Check for `async` keyword child
  for (const child of node.children()) {
    if (child.kind() === 'async') return true;
  }
  // Also check node text prefix
  const text = node.text();
  return text.trimStart().startsWith('async ');
}

function getChildByKind(node: SgNode, kind: string): SgNode | null {
  for (const child of node.children()) {
    if (child.kind() === kind) return child;
  }
  return null;
}

function extractParameters(node: SgNode): ParameterInfo[] {
  const params: ParameterInfo[] = [];
  const formalParams = getChildByKind(node, 'formal_parameters');
  if (!formalParams) return params;

  for (const child of formalParams.children()) {
    if (child.kind() === 'required_parameter' || child.kind() === 'optional_parameter') {
      const nameNode = getChildByKind(child, 'identifier');
      const typeAnnotation = getChildByKind(child, 'type_annotation');
      if (nameNode) {
        params.push({
          name: nameNode.text(),
          type: typeAnnotation ? typeAnnotation.text().replace(/^:\s*/, '') : undefined,
          optional: child.kind() === 'optional_parameter',
        });
      }
    } else if (child.kind() === 'identifier') {
      params.push({ name: child.text() });
    }
  }
  return params;
}

function extractReturnType(node: SgNode): string | undefined {
  const typeAnnotation = getChildByKind(node, 'return_type')
    ?? getChildByKind(node, 'type_annotation');
  if (typeAnnotation) {
    return typeAnnotation.text().replace(/^:\s*/, '');
  }
  return undefined;
}

export function extractFromFile(filePath: string, source: string): ParseResult {
  const language = detectLanguage(filePath);
  const lang = detectLang(filePath);
  const nodes: CodeNode[] = [];
  const edges: CodeEdge[] = [];
  const domain = detectDomain(filePath);

  if (!lang) {
    return { nodes: [], edges: [], filePath, language };
  }

  const tree = parse(lang, source);
  const root = tree.root();

  // File-level node
  const lines = source.split('\n');
  const fileNode: CodeNode = {
    id: makeId(filePath, filePath, 0),
    type: 'file',
    name: filePath.split('/').pop() || filePath,
    filePath,
    range: {
      start: { line: 0, column: 0 },
      end: { line: lines.length - 1, column: lines[lines.length - 1]?.length ?? 0 },
    },
    content: source.slice(0, 500),
    language,
    metadata: { domain },
  };
  nodes.push(fileNode);

  // Track defined function/method names for call resolution
  const definedNames = new Map<string, string>(); // name → nodeId
  // Track class nodes for contains edges
  const classStack: string[] = [];

  walk(root, (node) => {
    const kind = node.kind();
    const range = node.range();
    const startLine = range.start.line;
    const nodeRange = {
      start: { line: range.start.line, column: range.start.column },
      end: { line: range.end.line, column: range.end.column },
    };

    // Function declaration
    if (kind === 'function_declaration') {
      const nameNode = getChildByKind(node, 'identifier');
      const name = nameNode?.text() ?? 'anonymous';
      const id = makeId(filePath, name, startLine);
      const exported = isExported(node);
      const asyncFn = isAsync(node);
      const parameters = extractParameters(node);
      const returnType = extractReturnType(node);

      nodes.push({
        id,
        type: 'function',
        name,
        filePath,
        range: nodeRange,
        content: node.text().slice(0, 300),
        language,
        signature: `function ${name}(${parameters.map((p) => p.name).join(', ')})`,
        metadata: { exported, async: asyncFn, parameters, returnType, domain },
      });

      definedNames.set(name, id);
      edges.push({ source: fileNode.id, target: id, type: 'contains' });
    }

    // Arrow function in variable declarator
    if (kind === 'arrow_function') {
      const parent = node.parent();
      if (parent && parent.kind() === 'variable_declarator') {
        const nameNode = getChildByKind(parent, 'identifier');
        const name = nameNode?.text() ?? 'anonymous';
        const id = makeId(filePath, name, startLine);
        const grandParent = parent.parent();
        const greatGrandParent = grandParent?.parent();
        const exported =
          (grandParent ? isExported(grandParent) : false) ||
          (greatGrandParent?.kind() === 'export_statement');
        const asyncFn = isAsync(node);
        const parameters = extractParameters(node);
        const returnType = extractReturnType(node);

        nodes.push({
          id,
          type: 'function',
          name,
          filePath,
          range: nodeRange,
          content: node.text().slice(0, 300),
          language,
          signature: `const ${name} = (${parameters.map((p) => p.name).join(', ')}) =>`,
          metadata: { exported, async: asyncFn, parameters, returnType, domain },
        });

        definedNames.set(name, id);
        edges.push({ source: fileNode.id, target: id, type: 'contains' });
      }
    }

    // Class declaration
    if (kind === 'class_declaration') {
      const nameNode = getChildByKind(node, 'type_identifier') ?? getChildByKind(node, 'identifier');
      const name = nameNode?.text() ?? 'AnonymousClass';
      const id = makeId(filePath, name, startLine);
      const exported = isExported(node);

      // Super class
      const heritage = getChildByKind(node, 'class_heritage');
      let superClass: string | undefined;
      const interfaces: string[] = [];
      if (heritage) {
        const extendsClause = getChildByKind(heritage, 'extends_clause');
        if (extendsClause) {
          const superNode = getChildByKind(extendsClause, 'identifier') ?? getChildByKind(extendsClause, 'type_identifier');
          superClass = superNode?.text();
        }
        const implementsClause = getChildByKind(heritage, 'implements_clause');
        if (implementsClause) {
          for (const child of implementsClause.children()) {
            if (child.kind() === 'type_identifier' || child.kind() === 'identifier') {
              interfaces.push(child.text());
            }
          }
        }
      }

      nodes.push({
        id,
        type: 'class',
        name,
        filePath,
        range: nodeRange,
        content: node.text().slice(0, 300),
        language,
        signature: `class ${name}${superClass ? ` extends ${superClass}` : ''}`,
        metadata: { exported, superClass, interfaces: interfaces.length > 0 ? interfaces : undefined, domain },
      });

      definedNames.set(name, id);
      edges.push({ source: fileNode.id, target: id, type: 'contains' });

      if (superClass) {
        edges.push({ source: id, target: superClass, type: 'extends', metadata: { unresolved: true } });
      }
      for (const iface of interfaces) {
        edges.push({ source: id, target: iface, type: 'implements', metadata: { unresolved: true } });
      }

      // Process methods within this class
      const classBody = getChildByKind(node, 'class_body');
      if (classBody) {
        for (const member of classBody.children()) {
          if (member.kind() === 'method_definition') {
            const methodNameNode = getChildByKind(member, 'property_identifier');
            const methodName = methodNameNode?.text() ?? 'anonymous';
            const methodRange = member.range();
            const methodId = makeId(filePath, `${name}.${methodName}`, methodRange.start.line);
            const asyncMethod = isAsync(member);
            const parameters = extractParameters(member);
            const returnType = extractReturnType(member);

            nodes.push({
              id: methodId,
              type: 'method',
              name: methodName,
              filePath,
              range: {
                start: { line: methodRange.start.line, column: methodRange.start.column },
                end: { line: methodRange.end.line, column: methodRange.end.column },
              },
              content: member.text().slice(0, 300),
              language,
              signature: `${name}.${methodName}(${parameters.map((p) => p.name).join(', ')})`,
              metadata: { async: asyncMethod, parameters, returnType, domain },
            });

            definedNames.set(`${name}.${methodName}`, methodId);
            edges.push({ source: id, target: methodId, type: 'contains' });
          }
        }
      }
    }

    // Interface declaration
    if (kind === 'interface_declaration') {
      const nameNode = getChildByKind(node, 'type_identifier') ?? getChildByKind(node, 'identifier');
      const name = nameNode?.text() ?? 'AnonymousInterface';
      const id = makeId(filePath, name, startLine);
      const exported = isExported(node);

      nodes.push({
        id,
        type: 'interface',
        name,
        filePath,
        range: nodeRange,
        content: node.text().slice(0, 300),
        language,
        signature: `interface ${name}`,
        metadata: { exported, domain },
      });

      definedNames.set(name, id);
      edges.push({ source: fileNode.id, target: id, type: 'contains' });
    }

    // Type alias declaration
    if (kind === 'type_alias_declaration') {
      const nameNode = getChildByKind(node, 'type_identifier') ?? getChildByKind(node, 'identifier');
      const name = nameNode?.text() ?? 'AnonymousType';
      const id = makeId(filePath, name, startLine);
      const exported = isExported(node);

      nodes.push({
        id,
        type: 'type',
        name,
        filePath,
        range: nodeRange,
        content: node.text().slice(0, 300),
        language,
        signature: `type ${name}`,
        metadata: { exported, domain },
      });

      definedNames.set(name, id);
      edges.push({ source: fileNode.id, target: id, type: 'contains' });
    }

    // Import statement
    if (kind === 'import_statement') {
      const sourceNode = getChildByKind(node, 'string')
        ?? getChildByKind(node, 'string_fragment');
      let importSource = sourceNode?.text().replace(/['"]/g, '') ?? '';
      // Sometimes the string node wraps the content with quotes
      if (!importSource) {
        // Fallback: try to extract from text
        const match = node.text().match(/from\s+['"](.+?)['"]/);
        if (match) importSource = match[1];
      }

      const importedNames: string[] = [];
      const importClause = getChildByKind(node, 'import_clause');
      if (importClause) {
        // Default import
        const defaultImport = getChildByKind(importClause, 'identifier');
        if (defaultImport) importedNames.push(defaultImport.text());

        // Named imports
        const namedImports = getChildByKind(importClause, 'named_imports');
        if (namedImports) {
          for (const specifier of namedImports.children()) {
            if (specifier.kind() === 'import_specifier') {
              const nameNode = getChildByKind(specifier, 'identifier');
              if (nameNode) importedNames.push(nameNode.text());
            }
          }
        }

        // Namespace import
        const nsImport = getChildByKind(importClause, 'namespace_import');
        if (nsImport) {
          const nsName = getChildByKind(nsImport, 'identifier');
          if (nsName) importedNames.push(`* as ${nsName.text()}`);
        }
      }

      const name = importSource || 'unknown_import';
      const id = makeId(filePath, `import:${name}`, startLine);

      nodes.push({
        id,
        type: 'import',
        name,
        filePath,
        range: nodeRange,
        content: node.text(),
        language,
        metadata: { importSource, importedNames, domain },
      });

      edges.push({
        source: fileNode.id,
        target: id,
        type: 'imports',
        metadata: { importSource, importedNames },
      });
    }

    // Route detection: app.get('/path', ...), router.post(...), etc.
    if (kind === 'call_expression') {
      const text = node.text();
      const routeMatch = text.match(/^(app|router|server)\.(get|post|put|delete|patch|use|all)\s*\(\s*['"`]([^'"`]+)['"`]/);
      if (routeMatch) {
        const httpMethod = routeMatch[2].toUpperCase();
        const routePath = routeMatch[3];
        const routeName = `${httpMethod} ${routePath}`;
        const id = makeId(filePath, routeName, startLine);

        nodes.push({
          id,
          type: 'route',
          name: routeName,
          filePath,
          range: nodeRange,
          content: text.slice(0, 300),
          language,
          metadata: { httpMethod, routePath, domain: 'api' },
        });

        edges.push({ source: fileNode.id, target: id, type: 'contains' });
      }
    }
  });

  // Second pass: resolve call edges within the file
  walk(root, (node) => {
    if (node.kind() === 'call_expression') {
      const callee = node.children()[0];
      if (!callee) return;

      let calleeName = callee.text();
      // Handle member expressions like obj.method
      if (callee.kind() === 'member_expression') {
        const prop = getChildByKind(callee, 'property_identifier');
        const obj = getChildByKind(callee, 'identifier');
        if (obj && prop) {
          calleeName = `${obj.text()}.${prop.text()}`;
        } else if (prop) {
          calleeName = prop.text();
        }
      }

      const targetId = definedNames.get(calleeName);
      if (targetId) {
        // Find the enclosing function/method to use as source
        let current: SgNode | null = node.parent();
        let sourceId = fileNode.id;
        while (current) {
          const ck = current.kind();
          if (ck === 'function_declaration') {
            const fn = getChildByKind(current, 'identifier');
            if (fn) {
              const fId = definedNames.get(fn.text());
              if (fId) sourceId = fId;
            }
            break;
          }
          if (ck === 'arrow_function') {
            const par = current.parent();
            if (par && par.kind() === 'variable_declarator') {
              const vn = getChildByKind(par, 'identifier');
              if (vn) {
                const fId = definedNames.get(vn.text());
                if (fId) sourceId = fId;
              }
            }
            break;
          }
          if (ck === 'method_definition') {
            const mn = getChildByKind(current, 'property_identifier');
            if (mn) {
              // Try to find enclosing class
              let classParent: SgNode | null = current.parent();
              while (classParent && classParent.kind() !== 'class_declaration') {
                classParent = classParent.parent();
              }
              if (classParent) {
                const cn = getChildByKind(classParent, 'type_identifier') ?? getChildByKind(classParent, 'identifier');
                if (cn) {
                  const fId = definedNames.get(`${cn.text()}.${mn.text()}`);
                  if (fId) sourceId = fId;
                }
              }
            }
            break;
          }
          current = current.parent();
        }

        if (sourceId !== targetId) {
          edges.push({
            source: sourceId,
            target: targetId,
            type: 'calls',
            metadata: { calleeName },
          });
        }
      }
    }
  });

  // Third pass: React component analysis
  // Check each function/arrow node to see if it's a React component
  const isReactFile = /\.(tsx|jsx)$/.test(filePath) || source.includes('React');
  if (isReactFile) {
    for (const node of nodes) {
      if (node.type !== 'function') continue;
      const name = node.name;
      if (!name || !/^[A-Z]/.test(name)) continue;

      const componentMeta = analyzeComponent(source, filePath);
      if (componentMeta) {
        node.metadata.component = componentMeta;

        // Add 'renders' edges for rendered components
        for (const rendered of componentMeta.renderedComponents) {
          const targetNode = nodes.find(
            (n) => n.name === rendered && n.type === 'function',
          );
          edges.push({
            source: node.id,
            target: targetNode?.id ?? rendered,
            type: 'renders',
            metadata: { renderedComponent: rendered },
          });
        }

        // Only analyze the first (primary) component per file
        break;
      }
    }
  }

  return { nodes, edges, filePath, language };
}
