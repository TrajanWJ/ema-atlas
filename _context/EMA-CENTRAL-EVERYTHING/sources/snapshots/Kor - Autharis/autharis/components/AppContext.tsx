'use client';
import * as React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { DEFAULT_TWEAKS, Tweaks, readableOn, lum, adjustHex } from '../lib/tweaks';

type AppState = Record<string, any>;

type Ctx = {
  surface: string;
  setSurface: (s: string) => void;
  tweaks: Tweaks;
  setTweaks: (t: Tweaks) => void;
  tweaksOpen: boolean;
  setTweaksOpen: (b: boolean) => void;
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
};

const AppContext = createContext<Ctx | null>(null);

export function useApp(): Ctx {
  const c = useContext(AppContext);
  if (!c) throw new Error('useApp outside provider');
  return c;
}

export function useTweaks(): Tweaks { return useApp().tweaks; }

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [surface, setSurface] = useState<string>('marketing');
  const [tweaks, setTweaks] = useState<Tweaks>(DEFAULT_TWEAKS);
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [state, setState] = useState<AppState>({});
  const [hydrated, setHydrated] = useState(false);

  // Hydrate persisted values once on mount
  useEffect(() => {
    try {
      const s = localStorage.getItem('autharis:surface');
      if (s) setSurface(s);
      const t = localStorage.getItem('autharis:tweaks');
      if (t) {
        const parsed = JSON.parse(t) as Partial<Tweaks>;
        setTweaks({ ...DEFAULT_TWEAKS, ...parsed, v: DEFAULT_TWEAKS.v });
      }
      const st = localStorage.getItem('autharis:state');
      if (st) setState(JSON.parse(st));
      const open = localStorage.getItem('autharis:tweaks-open');
      if (open === '1') setTweaksOpen(true);
      // URL override for tweaks
      if (typeof window !== 'undefined' && window.location.search.includes('tweaks=1')) {
        setTweaksOpen(true);
      }
    } catch {}
    setHydrated(true);
  }, []);

  // Persist
  useEffect(() => { if (hydrated) localStorage.setItem('autharis:surface', surface); }, [surface, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem('autharis:tweaks', JSON.stringify(tweaks)); }, [tweaks, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem('autharis:state', JSON.stringify(state)); }, [state, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem('autharis:tweaks-open', tweaksOpen ? '1' : '0'); }, [tweaksOpen, hydrated]);

  // Apply tweaks to DOM
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', tweaks.theme || 'light');
    root.setAttribute('data-density', tweaks.density || 'comfortable');
    const a = tweaks.accent || '#17130C';
    root.style.setProperty('--accent', a);
    root.style.setProperty('--accent-ink', readableOn(a));
    const isDark = tweaks.theme === 'dark';
    const aLum = lum(a);
    let aText = a;
    if (!isDark && aLum > 0.55) aText = adjustHex(a, -45);
    if (isDark && aLum < 0.15) aText = adjustHex(a, 55);
    root.style.setProperty('--accent-text', aText);
  }, [tweaks]);

  return (
    <AppContext.Provider value={{ surface, setSurface, tweaks, setTweaks, tweaksOpen, setTweaksOpen, state, setState }}>
      {children}
    </AppContext.Provider>
  );
}
