import { describe, it, expect } from 'vitest';
import { analyzeComponent, isReactComponent } from '../component-analyzer/index.js';
import { extractProps } from '../component-analyzer/prop-extractor.js';
import { analyzeHooks } from '../component-analyzer/hook-analyzer.js';
import { buildRenderTree } from '../component-analyzer/render-tree.js';
import { trackContext } from '../component-analyzer/context-tracker.js';

const SAMPLE_COMPONENT = `
import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from './theme';
import { Button } from './Button';

interface UserCardProps {
  name: string;
  age?: number;
  onPress: () => void;
}

export const UserCard: React.FC<UserCardProps> = ({ name, age = 25, onPress }) => {
  const [loading, setLoading] = useState(false);
  const theme = useContext(ThemeContext);

  useEffect(() => {
    fetchData();
    return () => cleanup();
  }, []);

  return (
    <div>
      <Button onClick={onPress}>{name}</Button>
      {items.map(item => <span>{item}</span>)}
    </div>
  );
};
`;

describe('Component Analyzer', () => {
  describe('isReactComponent', () => {
    it('returns true for capitalized name with tsx file', () => {
      expect(isReactComponent('', 'UserCard', 'components/UserCard.tsx')).toBe(true);
    });

    it('returns false for lowercase name', () => {
      expect(isReactComponent('', 'helper', 'utils/helper.tsx')).toBe(false);
    });

    it('returns true for capitalized name with JSX content', () => {
      const src = 'function App() { return <div />; }';
      expect(isReactComponent(src, 'App', 'App.ts')).toBe(true);
    });

    it('returns false for non-component file without JSX', () => {
      expect(isReactComponent('const x = 1;', 'Config', 'config.ts')).toBe(false);
    });
  });

  describe('analyzeComponent', () => {
    it('returns ComponentMetadata for a valid component', () => {
      const result = analyzeComponent(SAMPLE_COMPONENT, 'components/UserCard.tsx');
      expect(result).not.toBeNull();
      expect(result!.kind).toBe('component');
    });

    it('returns null for non-component source', () => {
      const result = analyzeComponent('const x = 1;', 'utils/helper.ts');
      expect(result).toBeNull();
    });

    it('detects loading state', () => {
      const result = analyzeComponent(SAMPLE_COMPONENT, 'components/UserCard.tsx');
      expect(result!.hasLoadingState).toBe(true);
    });

    it('detects screen components by file path', () => {
      const result = analyzeComponent(SAMPLE_COMPONENT, 'screens/UserCard.tsx');
      expect(result!.isScreen).toBe(true);
    });
  });

  describe('extractProps', () => {
    it('extracts props from interface', () => {
      const props = extractProps(SAMPLE_COMPONENT);
      expect(props.length).toBe(3);

      const nameProp = props.find((p) => p.name === 'name');
      expect(nameProp).toBeDefined();
      expect(nameProp!.required).toBe(true);
      expect(nameProp!.type).toBe('string');

      const ageProp = props.find((p) => p.name === 'age');
      expect(ageProp).toBeDefined();
      expect(ageProp!.required).toBe(false);
      expect(ageProp!.hasDefault).toBe(true);

      const onPressProp = props.find((p) => p.name === 'onPress');
      expect(onPressProp).toBeDefined();
      expect(onPressProp!.required).toBe(true);
    });

    it('handles component with no props interface', () => {
      const src = `
        function SimpleButton({ label, onClick }) {
          return <button onClick={onClick}>{label}</button>;
        }
      `;
      const props = extractProps(src);
      expect(props.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('analyzeHooks', () => {
    it('detects useState with StateField mapping', () => {
      const result = analyzeHooks(SAMPLE_COMPONENT);
      expect(result.stateFields.length).toBe(1);
      expect(result.stateFields[0].name).toBe('loading');
      expect(result.stateFields[0].setter).toBe('setLoading');
      expect(result.stateFields[0].initialValue).toBe('false');
    });

    it('detects useContext', () => {
      const result = analyzeHooks(SAMPLE_COMPONENT);
      const contextHook = result.hooks.find((h) => h.name === 'useContext');
      expect(contextHook).toBeDefined();
      expect(contextHook!.isCustom).toBe(false);
    });

    it('detects useEffect with cleanup', () => {
      const result = analyzeHooks(SAMPLE_COMPONENT);
      expect(result.hasCleanupEffect).toBe(true);
    });

    it('detects custom hooks', () => {
      const src = `
        function MyComponent() {
          const data = useCustomFetch('/api/users');
          return <div>{data}</div>;
        }
      `;
      const result = analyzeHooks(src);
      const customHook = result.hooks.find((h) => h.name === 'useCustomFetch');
      expect(customHook).toBeDefined();
      expect(customHook!.isCustom).toBe(true);
    });

    it('detects conditional hooks', () => {
      const src = `
        function BadComponent({ shouldFetch }) {
          if (shouldFetch) {
            useState(0);
          }
          return <div />;
        }
      `;
      const result = analyzeHooks(src);
      expect(result.conditionalHooks.length).toBeGreaterThan(0);
    });

    it('identifies all three hooks', () => {
      const result = analyzeHooks(SAMPLE_COMPONENT);
      const hookNames = result.hooks.map((h) => h.name);
      expect(hookNames).toContain('useState');
      expect(hookNames).toContain('useContext');
      expect(hookNames).toContain('useEffect');
    });
  });

  describe('buildRenderTree', () => {
    it('extracts rendered components', () => {
      const result = buildRenderTree(SAMPLE_COMPONENT);
      expect(result.renderedComponents).toContain('Button');
    });

    it('detects list rendering', () => {
      const result = buildRenderTree(SAMPLE_COMPONENT);
      expect(result.listRenders).toBeGreaterThan(0);
    });

    it('detects missing key in map', () => {
      const result = buildRenderTree(SAMPLE_COMPONENT);
      expect(result.hasMissingKeys).toBe(true);
    });

    it('does not flag missing key when key is present', () => {
      const src = `
        function List({ items }) {
          return <ul>{items.map(item => <li key={item.id}>{item.name}</li>)}</ul>;
        }
      `;
      const result = buildRenderTree(src);
      expect(result.hasMissingKeys).toBe(false);
    });

    it('does not include HTML tags as components', () => {
      const result = buildRenderTree(SAMPLE_COMPONENT);
      expect(result.renderedComponents).not.toContain('div');
      expect(result.renderedComponents).not.toContain('span');
    });
  });

  describe('trackContext', () => {
    it('extracts context dependencies from useContext', () => {
      const result = trackContext(SAMPLE_COMPONENT);
      expect(result.contextDependencies).toContain('ThemeContext');
    });

    it('detects provided contexts', () => {
      const src = `
        function AppProvider({ children }) {
          return (
            <ThemeContext.Provider value={theme}>
              <AuthContext.Provider value={auth}>
                {children}
              </AuthContext.Provider>
            </ThemeContext.Provider>
          );
        }
      `;
      const result = trackContext(src);
      expect(result.providedContexts).toContain('ThemeContext');
      expect(result.providedContexts).toContain('AuthContext');
    });

    it('returns empty arrays for non-context source', () => {
      const src = `function Plain() { return <div />; }`;
      const result = trackContext(src);
      expect(result.contextDependencies).toHaveLength(0);
      expect(result.providedContexts).toHaveLength(0);
    });
  });

  describe('Full integration', () => {
    it('analyzes complete component with all aspects', () => {
      const result = analyzeComponent(SAMPLE_COMPONENT, 'components/UserCard.tsx');
      expect(result).not.toBeNull();

      // Props
      expect(result!.props.length).toBe(3);
      const nameProp = result!.props.find((p) => p.name === 'name');
      expect(nameProp!.required).toBe(true);

      // State
      expect(result!.stateFields.length).toBe(1);
      expect(result!.stateFields[0].name).toBe('loading');

      // Hooks
      expect(result!.hooks.length).toBe(3);

      // Context
      expect(result!.contextDependencies).toContain('ThemeContext');

      // Rendered components
      expect(result!.renderedComponents).toContain('Button');

      // Loading state detected
      expect(result!.hasLoadingState).toBe(true);
    });
  });
});
