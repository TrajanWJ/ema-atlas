'use client';

import { get, set } from 'idb-keyval';
import type { LocalStateSnapshot } from '@contracts/persistence';

const STORAGE_KEY = 'execudeck-state';

export async function saveSnapshot(snapshot: LocalStateSnapshot): Promise<void> {
  await set(STORAGE_KEY, snapshot);
}

export async function loadSnapshot(): Promise<LocalStateSnapshot | null> {
  const data = await get<LocalStateSnapshot>(STORAGE_KEY);
  return data ?? null;
}

export async function clearSnapshot(): Promise<void> {
  await set(STORAGE_KEY, undefined);
}
