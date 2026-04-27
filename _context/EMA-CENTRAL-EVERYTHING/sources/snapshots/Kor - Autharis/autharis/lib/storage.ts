import { DEFAULT_SURFACE, isSurfaceId, type SurfaceId } from '@/lib/surfaces';
import { DEFAULT_TWEAKS, type Tweaks } from '@/lib/tweaks';

export const STORAGE_KEYS = {
  surface: 'autharis:surface',
  tweaks: 'autharis:tweaks',
  state: 'autharis:state',
  tweaksOpen: 'autharis:tweaks-open',
} as const;

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readItem(key: string): string | null {
  if (!canUseStorage()) return null;

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeItem(key: string, value: string): void {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(key, value);
  } catch {}
}

function removeItem(key: string): void {
  if (!canUseStorage()) return;

  try {
    window.localStorage.removeItem(key);
  } catch {}
}

function readJson<T>(key: string): T | null {
  const raw = readItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function readStoredSurface(fallback: SurfaceId = DEFAULT_SURFACE): SurfaceId {
  const raw = readItem(STORAGE_KEYS.surface);
  return raw && isSurfaceId(raw) ? raw : fallback;
}

export function writeStoredSurface(surface: SurfaceId): void {
  writeItem(STORAGE_KEYS.surface, surface);
}

export function readStoredTweaks(fallback: Tweaks = DEFAULT_TWEAKS): Tweaks {
  const parsed = readJson<Partial<Tweaks>>(STORAGE_KEYS.tweaks);
  if (!parsed || typeof parsed !== 'object') return fallback;

  return {
    ...fallback,
    ...parsed,
    v: fallback.v,
  };
}

export function writeStoredTweaks(tweaks: Tweaks): void {
  writeItem(STORAGE_KEYS.tweaks, JSON.stringify(tweaks));
}

export function readStoredState<T extends Record<string, unknown>>(fallback: T): T {
  const parsed = readJson<Record<string, unknown>>(STORAGE_KEYS.state);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return fallback;

  return {
    ...fallback,
    ...parsed,
  };
}

export function writeStoredState<T extends Record<string, unknown>>(state: T): void {
  writeItem(STORAGE_KEYS.state, JSON.stringify(state));
}

export function readStoredTweaksOpen(): boolean {
  const raw = readItem(STORAGE_KEYS.tweaksOpen);
  return raw === '1' || raw === 'true';
}

export function writeStoredTweaksOpen(isOpen: boolean): void {
  writeItem(STORAGE_KEYS.tweaksOpen, isOpen ? '1' : '0');
}

export function clearStoredShellState(): void {
  removeItem(STORAGE_KEYS.surface);
  removeItem(STORAGE_KEYS.state);
  removeItem(STORAGE_KEYS.tweaksOpen);
}

