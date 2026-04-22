import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Copy, Minimize2 } from 'lucide-react';
import { useStore } from '../store/useStore';

export function TerminalPanel() {
  const { terminalLines, terminalOpen, setTerminalOpen, clearTerminal } = useStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(300);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(300);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    startY.current = e.clientY;
    startHeight.current = height;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = startY.current - e.clientY;
      const newHeight = Math.min(Math.max(startHeight.current + delta, 120), window.innerHeight - 60);
      setHeight(newHeight);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [height]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [terminalLines]);

  const handleCopyAll = () => {
    const text = terminalLines.map(l => l.text).join('\n');
    navigator.clipboard.writeText(text);
  };

  const colorMap: Record<string, string> = {
    info: 'text-cyan',
    error: 'text-danger',
    warning: 'text-warning',
    success: 'text-success',
  };

  return (
    <AnimatePresence>
      {terminalOpen && (
        <motion.div
          initial={{ y: 300, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 300, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-60 right-0 z-50 bg-bg"
          style={{ height }}
        >
          {/* Drag handle — wider hit zone, visible grab bar */}
          <div
            onMouseDown={handleMouseDown}
            className="absolute -top-2 left-0 right-0 h-5 cursor-row-resize group z-10 flex items-center justify-center"
          >
            <div className="absolute inset-x-0 top-2 h-px bg-white/[0.07] group-hover:bg-cyan/50 transition-colors" />
            <div className="w-10 h-1 rounded-full bg-white/10 group-hover:bg-cyan/40 transition-colors mt-0.5" />
          </div>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.07] bg-surface">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-mono text-muted">Engine Output</span>
              <span className="text-[10px] text-muted/50">{terminalLines.length} lines</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={handleCopyAll} className="p-1.5 hover:bg-white/5 rounded transition-colors" title="Copy all">
                <Copy size={13} className="text-muted" />
              </button>
              <button onClick={clearTerminal} className="p-1.5 hover:bg-white/5 rounded transition-colors" title="Clear">
                <Trash2 size={13} className="text-muted" />
              </button>
              <button onClick={() => setTerminalOpen(false)} className="p-1.5 hover:bg-white/5 rounded transition-colors" title="Minimize">
                <Minimize2 size={13} className="text-muted" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div ref={scrollRef} className="overflow-y-auto p-4 font-mono text-[13px] leading-relaxed" style={{ height: 'calc(100% - 40px)' }}>
            {terminalLines.length === 0 && (
              <span className="text-muted/50">Waiting for engine output...</span>
            )}
            {terminalLines.map((line, i) => {
              const color = line.text.includes('[ERROR]') ? colorMap.error
                : line.text.includes('[WARNING]') ? colorMap.warning
                : line.text.includes('[SUCCESS]') ? colorMap.success
                : line.text.includes('[→]') ? 'text-white font-semibold'
                : colorMap.info;

              const time = new Date(line.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

              return (
                <div key={i} className="flex gap-3">
                  <span className="text-muted/30 shrink-0 select-none">{time}</span>
                  <span className={color}>{line.text}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
