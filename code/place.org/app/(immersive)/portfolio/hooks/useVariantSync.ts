'use client';

import { useEffect } from 'react';
import {
  useVariantStore,
  VARIANTS,
  type VariantId,
} from '../lib/variantStore';

function isVariantId(value: string): value is VariantId {
  return value in VARIANTS;
}

/**
 * Syncs the active variant with the `?v=` URL search param.
 * - On mount: reads the param and applies it if valid.
 * - On change: updates the URL via replaceState (no navigation).
 */
export function useVariantSync(): void {
  const activeVariantId = useVariantStore((s) => s.activeVariantId);
  const setVariant = useVariantStore((s) => s.setVariant);

  // Read URL param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('v');
    if (v && isVariantId(v)) {
      setVariant(v);
    }
  }, [setVariant]);

  // Write URL param on change
  useEffect(() => {
    const url = new URL(window.location.href);
    if (activeVariantId === 'clean') {
      url.searchParams.delete('v');
    } else {
      url.searchParams.set('v', activeVariantId);
    }
    history.replaceState(null, '', url.toString());
  }, [activeVariantId]);
}
