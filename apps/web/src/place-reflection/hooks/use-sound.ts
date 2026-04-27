/**
 * useSound — honest-mock. Donor's Place shell plays click/ambient sounds via
 * a WebAudio wrapper; EMA's settings has `soundEnabled` but no audio engine
 * yet. This hook returns no-ops so donor components (DockIcon etc.) keep
 * their call sites. When audio ships, replace the body.
 *
 * Kind: "pending daemon writer" — actually "pending local audio engine",
 *       but we classify it under the honest-mock rules as pending-impl.
 */

export interface SoundApi {
  readonly playClick: () => void;
  readonly playOpen: () => void;
  readonly playClose: () => void;
}

const NOOP: SoundApi = {
  playClick: () => { /* no-op */ },
  playOpen: () => { /* no-op */ },
  playClose: () => { /* no-op */ },
};

export function useSound(): SoundApi {
  return NOOP;
}
