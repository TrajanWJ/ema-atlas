'use client';

import { useCallback, useRef, useEffect } from 'react';
import { useEditorStore, type OpenTab } from '@/store/editor-store';

const languageDotColor: Record<string, string> = {
  typescript: 'bg-blue-400',
  typescriptreact: 'bg-blue-400',
  javascript: 'bg-yellow-400',
  javascriptreact: 'bg-yellow-400',
  json: 'bg-green-400',
  python: 'bg-emerald-400',
  markdown: 'bg-slate-400',
  css: 'bg-pink-400',
  html: 'bg-orange-400',
  rust: 'bg-amber-600',
};

function getLanguageDotClass(language: string): string {
  return languageDotColor[language] ?? 'bg-gray-500';
}

function Tab({
  tab,
  isActive,
  onActivate,
  onClose,
}: {
  tab: OpenTab;
  isActive: boolean;
  onActivate: () => void;
  onClose: () => void;
}) {
  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose();
    },
    [onClose],
  );

  return (
    <button
      onClick={onActivate}
      className={`
        group relative flex items-center gap-2 h-full px-3 min-w-[100px] max-w-[180px]
        select-none cursor-pointer border-r border-bg-border
        transition-colors duration-150 ease-in-out shrink-0
        ${
          isActive
            ? 'bg-bg-primary text-text-primary border-t-2 border-t-accent'
            : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover border-t-2 border-t-transparent'
        }
      `}
      title={tab.path}
    >
      {/* Language dot */}
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${getLanguageDotClass(tab.language)}`}
      />

      {/* File name */}
      <span className="text-[13px] truncate leading-none">{tab.name}</span>

      {/* Close / modified indicator */}
      <span className="relative ml-auto w-3 h-3 shrink-0 flex items-center justify-center">
        {tab.modified ? (
          <>
            {/* Modified dot — hidden on group hover, replaced by close button */}
            <span className="absolute inset-0 flex items-center justify-center transition-opacity duration-100 group-hover:opacity-0">
              <span className="w-2 h-2 rounded-full bg-accent" />
            </span>
            {/* Close button — visible only on group hover */}
            <span
              role="button"
              onClick={handleClose}
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-100
                         rounded hover:bg-bg-active text-text-muted hover:text-text-primary"
            >
              <CloseIcon />
            </span>
          </>
        ) : (
          /* Close button — visible only on hover */
          <span
            role="button"
            onClick={handleClose}
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-100
                       rounded hover:bg-bg-active text-text-muted hover:text-text-primary"
          >
            <CloseIcon />
          </span>
        )}
      </span>
    </button>
  );
}

function CloseIcon() {
  return (
    <svg
      width="8"
      height="8"
      viewBox="0 0 8 8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M1 1l6 6M7 1l-6 6" />
    </svg>
  );
}

export default function TabBar() {
  const openTabs = useEditorStore((s) => s.openTabs);
  const activeFilePath = useEditorStore((s) => s.activeFilePath);
  const setActiveFile = useEditorStore((s) => s.setActiveFile);
  const closeTab = useEditorStore((s) => s.closeTab);

  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll the active tab into view when it changes
  useEffect(() => {
    if (!containerRef.current || !activeFilePath) return;
    const activeEl = containerRef.current.querySelector(
      '[data-active="true"]',
    );
    activeEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [activeFilePath]);

  if (openTabs.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="flex h-9 bg-bg-tertiary border-b border-bg-border overflow-x-auto"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {openTabs.map((tab) => {
        const isActive = tab.path === activeFilePath;
        return (
          <div key={tab.path} data-active={isActive ? 'true' : undefined}>
            <Tab
              tab={tab}
              isActive={isActive}
              onActivate={() => setActiveFile(tab.path)}
              onClose={() => closeTab(tab.path)}
            />
          </div>
        );
      })}
    </div>
  );
}
