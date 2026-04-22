import { extractProps } from './prop-extractor.js';
import { analyzeHooks } from './hook-analyzer.js';
import { buildRenderTree } from './render-tree.js';
import { trackContext } from './context-tracker.js';
import type { ComponentMetadata } from '../types.js';
import { log } from '../logger.js';

/**
 * Analyze a React component from source code.
 * Returns ComponentMetadata if the source defines a React component, or null otherwise.
 */
export function analyzeComponent(source: string, filePath: string): ComponentMetadata | null {
  // Quick check: if no JSX-like content, skip
  if (!source.includes('<') || !source.includes('>')) {
    return null;
  }

  // Extract the component name from the source
  const componentName = findComponentName(source);
  if (!componentName) {
    return null;
  }

  if (!isReactComponent(source, componentName, filePath)) {
    return null;
  }

  log('parse', `Analyzing React component: ${componentName}`, { filePath });

  // Run all 4 analyzers
  const props = extractProps(source);
  const hookResult = analyzeHooks(source);
  const renderResult = buildRenderTree(source);
  const contextResult = trackContext(source);

  // Detect loading state: has a state field named loading, isLoading, etc.
  const hasLoadingState = hookResult.stateFields.some(
    (s) =>
      s.name === 'loading' ||
      s.name === 'isLoading' ||
      s.name === 'fetching' ||
      s.name === 'isFetching',
  );

  // Detect error boundary: class component with componentDidCatch
  // or uses an ErrorBoundary component
  const hasErrorBoundary =
    source.includes('componentDidCatch') ||
    source.includes('getDerivedStateFromError') ||
    renderResult.renderedComponents.some((c) => c.includes('ErrorBoundary'));

  // Detect if this is a screen/page component
  const lowerPath = filePath.toLowerCase();
  const isScreen =
    lowerPath.includes('/screens/') || lowerPath.startsWith('screens/') ||
    lowerPath.includes('/pages/') || lowerPath.startsWith('pages/') ||
    lowerPath.includes('/views/') || lowerPath.startsWith('views/') ||
    /Screen\b/.test(componentName) ||
    /Page\b/.test(componentName);

  return {
    kind: 'component',
    props,
    stateFields: hookResult.stateFields,
    hooks: hookResult.hooks,
    contextDependencies: contextResult.contextDependencies,
    renderedComponents: renderResult.renderedComponents,
    hasLoadingState,
    hasErrorBoundary,
    isScreen,
  };
}

/**
 * Check if a source + name + filePath combination looks like a React component.
 */
export function isReactComponent(source: string, name: string, filePath: string): boolean {
  // Name must start with uppercase
  if (!name || !/^[A-Z]/.test(name)) {
    return false;
  }

  // File must be .tsx or .jsx, OR source must contain JSX
  const isTsxOrJsx = /\.(tsx|jsx)$/.test(filePath);
  const hasJsx = /<[A-Za-z]/.test(source) && source.includes('/>') || source.includes('</');

  return isTsxOrJsx || hasJsx;
}

/**
 * Find the primary component name from source code.
 * Looks for:
 *  - export function ComponentName
 *  - export const ComponentName
 *  - function ComponentName  (first one found)
 */
function findComponentName(source: string): string | null {
  // Exported function component
  const exportFnMatch = source.match(
    /export\s+(?:default\s+)?function\s+([A-Z][A-Za-z0-9]*)/,
  );
  if (exportFnMatch) return exportFnMatch[1];

  // Exported const component (arrow function / React.FC)
  const exportConstMatch = source.match(
    /export\s+const\s+([A-Z][A-Za-z0-9]*)\s*[=:]/,
  );
  if (exportConstMatch) return exportConstMatch[1];

  // Non-exported function component
  const fnMatch = source.match(/function\s+([A-Z][A-Za-z0-9]*)/);
  if (fnMatch) return fnMatch[1];

  // Non-exported const component
  const constMatch = source.match(/const\s+([A-Z][A-Za-z0-9]*)\s*[=:]/);
  if (constMatch) return constMatch[1];

  return null;
}
