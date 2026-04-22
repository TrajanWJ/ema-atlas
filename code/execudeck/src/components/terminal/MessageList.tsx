'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import { GrammarToken } from './GrammarToken';
import { MessageBlock } from './MessageBlock';
import type { SessionMessage } from '@contracts/messages';

interface MessageListProps {
  messages: SessionMessage[];
}

export function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm font-mono">
        Awaiting input...
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-3 space-y-3 font-mono text-sm">
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground/70">
                {msg.sender}
              </span>
              <span>
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="space-y-0.5 pl-1">
              {msg.blocks.map((block, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  {msg.token && i === 0 && (
                    <GrammarToken token={msg.token} />
                  )}
                  {msg.token && i > 0 && <span className="w-4 shrink-0" />}
                  <MessageBlock block={block} />
                </div>
              ))}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
