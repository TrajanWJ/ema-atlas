'use client';

import { useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { OnMount, BeforeMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useEditorStore } from '@/store/editor-store';

const Editor = dynamic(() => import('@monaco-editor/react').then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full w-full bg-bg-primary">
      <div className="flex items-center gap-3 text-text-secondary text-sm">
        <svg className="animate-spin h-4 w-4 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading editor...
      </div>
    </div>
  ),
});

// ---------------------------------------------------------------------------
// Language mapping
// ---------------------------------------------------------------------------

const extensionToLanguage: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescriptreact',
  js: 'javascript',
  jsx: 'javascriptreact',
  json: 'json',
  md: 'markdown',
  mdx: 'markdown',
  py: 'python',
  rs: 'rust',
  go: 'go',
  rb: 'ruby',
  java: 'java',
  kt: 'kotlin',
  c: 'c',
  cpp: 'cpp',
  h: 'cpp',
  cs: 'csharp',
  css: 'css',
  scss: 'scss',
  less: 'less',
  html: 'html',
  xml: 'xml',
  svg: 'xml',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'ini',
  sh: 'shell',
  bash: 'shell',
  zsh: 'shell',
  sql: 'sql',
  graphql: 'graphql',
  dockerfile: 'dockerfile',
  prisma: 'prisma',
};

function getLanguageFromPath(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
  const basename = filePath.split('/').pop()?.toLowerCase() ?? '';

  // Handle special filenames
  if (basename === 'dockerfile') return 'dockerfile';
  if (basename === 'makefile') return 'makefile';
  if (basename.endsWith('.d.ts')) return 'typescript';

  return extensionToLanguage[ext] ?? 'plaintext';
}

// ---------------------------------------------------------------------------
// Custom theme definition
// ---------------------------------------------------------------------------

const THEME_NAME = 'codevault';

const defineCodeVaultTheme: BeforeMount = (monaco) => {
  monaco.editor.defineTheme(THEME_NAME, {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#0f1117',
      'editor.foreground': '#e1e4ed',
      'editorLineNumber.foreground': '#3a3d4e',
      'editorLineNumber.activeForeground': '#8b8fa7',
      'editor.selectionBackground': 'rgba(99, 102, 241, 0.25)',
      'editor.lineHighlightBackground': '#161922',
      'editorCursor.foreground': '#6366f1',
      'editorWidget.background': '#1c1f2e',
      'editorSuggestWidget.background': '#1c1f2e',
      'editorSuggestWidget.border': '#2a2d3e',
      'editorIndentGuide.background': '#1c1f2e',
      'editorBracketMatch.background': 'rgba(99, 102, 241, 0.2)',
      'editorBracketMatch.border': 'rgba(99, 102, 241, 0.5)',
    },
  });
};

// ---------------------------------------------------------------------------
// Editor options
// ---------------------------------------------------------------------------

const EDITOR_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  fontSize: 13,
  fontFamily: 'JetBrains Mono, Fira Code, monospace',
  fontLigatures: true,
  lineHeight: 20,
  minimap: {
    enabled: true,
    maxColumn: 80,
    renderCharacters: false,
  },
  scrollBeyondLastLine: false,
  padding: { top: 16 },
  renderLineHighlight: 'gutter',
  cursorBlinking: 'smooth',
  cursorSmoothCaretAnimation: 'on',
  smoothScrolling: true,
  bracketPairColorization: { enabled: true },
  guides: { bracketPairs: true, indentation: true },
  wordWrap: 'off',
  tabSize: 2,
  automaticLayout: true,
};

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-bg-primary select-none">
      <div className="flex flex-col items-center gap-6 max-w-md text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-accent-muted flex items-center justify-center">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent"
          >
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
            <line x1="14" y1="4" x2="10" y2="20" />
          </svg>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-medium text-text-primary">
            Load a project to start editing
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Use the file explorer to browse your project, or try one of
            the shortcuts below.
          </p>
        </div>

        {/* Keyboard shortcuts */}
        <div className="grid grid-cols-1 gap-2 mt-2 w-full max-w-xs">
          <ShortcutHint keys={['\u2318', 'P']} label="Quick open file" />
          <ShortcutHint keys={['\u2318', 'Shift', 'F']} label="Search in files" />
          <ShortcutHint keys={['\u2318', 'B']} label="Toggle sidebar" />
          <ShortcutHint keys={['\u2318', 'J']} label="Toggle terminal" />
        </div>
      </div>
    </div>
  );
}

function ShortcutHint({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-md bg-bg-secondary/60">
      <span className="text-xs text-text-muted">{label}</span>
      <span className="flex items-center gap-1">
        {keys.map((key, i) => (
          <kbd
            key={i}
            className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5
                       text-[11px] font-medium text-text-secondary
                       bg-bg-tertiary border border-bg-border rounded"
          >
            {key}
          </kbd>
        ))}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Code Editor component
// ---------------------------------------------------------------------------

export default function CodeEditor() {
  const activeFilePath = useEditorStore((s) => s.activeFilePath);
  const fileContents = useEditorStore((s) => s.fileContents);
  const updateFileContent = useEditorStore((s) => s.updateFileContent);
  const setSelectedCode = useEditorStore((s) => s.setSelectedCode);

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // Determine content and language for the active file
  const content = activeFilePath ? (fileContents.get(activeFilePath) ?? '') : '';
  const language = activeFilePath ? getLanguageFromPath(activeFilePath) : 'plaintext';

  // Handle content changes from the editor
  const handleChange = useCallback(
    (value: string | undefined) => {
      if (activeFilePath && value !== undefined) {
        updateFileContent(activeFilePath, value);
      }
    },
    [activeFilePath, updateFileContent],
  );

  // Editor mount handler — register selection listener
  const handleMount: OnMount = useCallback(
    (editorInstance, _monaco) => {
      editorRef.current = editorInstance;

      // Focus the editor on mount
      editorInstance.focus();

      // Listen for selection changes to capture selected code
      editorInstance.onDidChangeCursorSelection((e) => {
        const selection = e.selection;
        const model = editorInstance.getModel();
        if (!model) return;

        if (selection.isEmpty()) {
          setSelectedCode('');
        } else {
          const selectedText = model.getValueInRange(selection);
          setSelectedCode(selectedText);
        }
      });
    },
    [setSelectedCode],
  );

  // No active file — show empty state
  if (!activeFilePath) {
    return <EmptyState />;
  }

  return (
    <div className="h-full w-full overflow-hidden">
      <Editor
        key={activeFilePath}
        height="100%"
        width="100%"
        language={language}
        value={content}
        theme={THEME_NAME}
        beforeMount={defineCodeVaultTheme}
        onMount={handleMount}
        onChange={handleChange}
        options={EDITOR_OPTIONS}
        loading={
          <div className="flex items-center justify-center h-full w-full bg-bg-primary">
            <div className="flex items-center gap-3 text-text-secondary text-sm">
              <svg
                className="animate-spin h-4 w-4 text-accent"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Loading editor...
            </div>
          </div>
        }
      />
    </div>
  );
}
