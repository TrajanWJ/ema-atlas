import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useStore } from '../store/useStore';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const addTerminalLine = useStore((s) => s.addTerminalLine);
  const setTerminalOpen = useStore((s) => s.setTerminalOpen);
  const setAnalysisProgress = useStore((s) => s.setAnalysisProgress);

  useEffect(() => {
    const socket = io('http://localhost:3001', { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('engine-output', (data: { type: string; text: string; timestamp: number }) => {
      const type = data.text.includes('[ERROR]') ? 'error'
        : data.text.includes('[WARNING]') ? 'warning'
        : data.text.includes('[SUCCESS]') ? 'success'
        : 'info';

      addTerminalLine({ type, text: data.text, timestamp: data.timestamp });
      setTerminalOpen(true);

      // Track analysis progress from phase markers
      if (data.text.includes('Phase 1: Parsing')) {
        setAnalysisProgress({ phase: 'Parsing files...', percent: 15 });
      } else if (data.text.includes('Phase 2: Building')) {
        setAnalysisProgress({ phase: 'Building knowledge graph...', percent: 40 });
      } else if (data.text.includes('Phase 3: Detecting')) {
        setAnalysisProgress({ phase: 'Detecting flows...', percent: 65 });
      } else if (data.text.includes('Phase 4: Analyzing')) {
        setAnalysisProgress({ phase: 'Analyzing gaps...', percent: 85 });
      } else if (data.text.includes('Analysis complete')) {
        setAnalysisProgress({ phase: 'Complete!', percent: 100 });
        setTimeout(() => setAnalysisProgress(null), 2000);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [addTerminalLine, setTerminalOpen, setAnalysisProgress]);

  return socketRef;
}
