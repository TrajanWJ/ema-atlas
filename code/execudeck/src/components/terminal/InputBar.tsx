'use client';

import { useState, useCallback } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { useMessageStore } from '@/src/state/message-store';
import { useWorkspaceStore } from '@/src/state/workspace-store';
import type { SessionMessage } from '@contracts/messages';

export function InputBar() {
  const [input, setInput] = useState('');
  const activeTabId = useWorkspaceStore((s) => s.activeTabId);
  const addMessage = useMessageStore((s) => s.addMessage);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || !activeTabId) return;

    const isCommand = trimmed.startsWith('/');

    const message: SessionMessage = {
      id: `msg-${Date.now()}`,
      timestamp: Date.now(),
      sender: 'You',
      token: isCommand ? undefined : '>',
      blocks: isCommand
        ? [{ type: 'status', content: `Command: ${trimmed}` }]
        : [{ type: 'narrative', content: trimmed }],
    };

    addMessage(activeTabId, message);
    setInput('');
  }, [input, activeTabId, addMessage]);

  return (
    <div className="flex items-center gap-2 border-t border-border bg-terminal p-2">
      <div className="flex-1 flex items-center gap-2 rounded border border-border bg-background/50 px-3 py-1.5">
        <span className="text-terminal-accent font-mono text-sm select-none">
          {'>'}
        </span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Enter command or message..."
          className="flex-1 bg-transparent text-sm font-mono text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 text-terminal-accent hover:text-terminal-accent/80"
        onClick={handleSubmit}
        disabled={!input.trim()}
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
