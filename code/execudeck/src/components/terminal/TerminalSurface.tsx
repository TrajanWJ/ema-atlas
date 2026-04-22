'use client';

import { useMemo } from 'react';
import { useWorkspaceStore } from '@/src/state/workspace-store';
import { useMessageStore } from '@/src/state/message-store';
import { MessageList } from './MessageList';
import { InputBar } from './InputBar';

const EMPTY: never[] = [];

export function TerminalSurface() {
  const activeTabId = useWorkspaceStore((s) => s.activeTabId);
  const allMessages = useMessageStore((s) => s.messages);
  const messages = useMemo(
    () => (activeTabId ? allMessages[activeTabId] ?? EMPTY : EMPTY),
    [activeTabId, allMessages]
  );

  return (
    <div className="flex h-full flex-col bg-terminal">
      <MessageList messages={messages} />
      <InputBar />
    </div>
  );
}
