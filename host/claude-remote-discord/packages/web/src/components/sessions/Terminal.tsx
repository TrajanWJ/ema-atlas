"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

interface TerminalEntry {
  command: string;
  output: string;
  exitCode: number;
  timestamp: number;
}

export function Terminal({ sessionId }: { sessionId: string }) {
  const [input, setInput] = useState("");
  const [entries, setEntries] = useState<TerminalEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [entries]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const runCommand = useCallback(async () => {
    const cmd = input.trim();
    if (!cmd || running) return;

    setRunning(true);
    setHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);
    setInput("");

    try {
      const result = await api.runShell(sessionId, cmd);
      setEntries((prev) => [
        ...prev,
        {
          command: cmd,
          output: result.output ?? "",
          exitCode: result.exitCode ?? 0,
          timestamp: Date.now(),
        },
      ]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Command failed";
      setEntries((prev) => [
        ...prev,
        { command: cmd, output: message, exitCode: 1, timestamp: Date.now() },
      ]);
    } finally {
      setRunning(false);
      inputRef.current?.focus();
    }
  }, [input, running, sessionId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runCommand();
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIndex =
        historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInput(history[nextIndex]);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= history.length) {
        setHistoryIndex(-1);
        setInput("");
      } else {
        setHistoryIndex(nextIndex);
        setInput(history[nextIndex]);
      }
    }
  };

  return (
    <div className="border-t border-border bg-terminal flex flex-col max-h-[400px]">
      {/* Output area */}
      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-2 min-h-[100px]"
      >
        {entries.length === 0 && (
          <div className="text-text-muted">Terminal ready. Type a command below.</div>
        )}
        {entries.map((entry) => (
          <div key={entry.timestamp}>
            <div className="text-success">$ {entry.command}</div>
            {entry.output && (
              <pre
                className={`whitespace-pre-wrap break-words mt-0.5 ${
                  entry.exitCode !== 0 ? "text-error" : "text-text-primary"
                }`}
              >
                {entry.output}
              </pre>
            )}
          </div>
        ))}
        {running && (
          <div className="text-text-muted animate-pulse">Running...</div>
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-border/50">
        <span className="text-success font-mono text-xs">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setHistoryIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          placeholder="command..."
          aria-label="Terminal command input"
          disabled={running}
          className="flex-1 bg-transparent text-xs font-mono text-text-primary placeholder-text-muted outline-none"
        />
      </div>
    </div>
  );
}
