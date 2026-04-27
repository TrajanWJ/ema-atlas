/**
 * Bridge for donor's `companionBridge`. In Place, this was a bridge to
 * a native companion app. EMA's Tauri launcher is separate scope
 * (Desktop Launcher Correction lane) and does NOT expose a companion
 * API today.
 *
 * Honest-mock: every method is a no-op that returns `null`/`false`.
 * Labeled via honest-mock/registry.ts under "companion" with
 * `pending daemon writer` blocker.
 */

export type CompanionBridge = {
  readonly isAvailable: () => boolean;
  readonly openPopout: (route: string) => Promise<boolean>;
  readonly closePopout: (id: string) => Promise<boolean>;
  readonly listPopouts: () => Promise<string[]>;
};

export const companionBridge: CompanionBridge = {
  isAvailable() {
    return false;
  },
  async openPopout() {
    return false;
  },
  async closePopout() {
    return false;
  },
  async listPopouts() {
    return [];
  },
};
