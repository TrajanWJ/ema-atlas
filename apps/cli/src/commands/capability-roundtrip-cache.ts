import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { EMA_ACTIVE_BUILD } from "../workspace-state.js";

export interface RoundtripCacheEntry {
  readonly provider: string;
  readonly completed_at: string;
  readonly evidence: string;
  readonly ttl_seconds: number;
}

export interface CodexRoundtripProof {
  readonly passed_at: string;
  readonly execution_id: string;
  readonly codex_version: string;
  readonly invocation_flags: readonly string[];
  readonly prompt_hash: string;
  readonly session_file_path: string;
  readonly events_observed: readonly string[];
  readonly duration_ms: number;
  readonly smoke_version: 1;
}

const CACHE_ROOT = join(EMA_ACTIVE_BUILD, ".ema-dev", "capability-roundtrips");
export const CODEX_ROUNDTRIP_PROOF_PATH = join(EMA_ACTIVE_BUILD, ".ema-dev", "codex-roundtrip", "last-proof.json");
export const CODEX_ROUNDTRIP_PROOF_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function roundtripCachePath(provider: string): string {
  return join(CACHE_ROOT, `${provider}.json`);
}

export function readFreshRoundtrip(
  provider: string,
  ttlMs = CODEX_ROUNDTRIP_PROOF_TTL_MS,
): { ok: true; entry: RoundtripCacheEntry; age_ms: number } | { ok: false; reason: string; entry: RoundtripCacheEntry | null } {
  if (provider === "codex") {
    const proof = readFreshCodexRoundtripProof(ttlMs);
    if (!proof.ok) return { ok: false, reason: proof.reason, entry: null };
    return {
      ok: true,
      entry: {
        provider: "codex",
        completed_at: proof.proof.passed_at,
        evidence: `proof ${proof.proof.execution_id} via ${proof.proof.session_file_path}`,
        ttl_seconds: Math.round(ttlMs / 1000),
      },
      age_ms: proof.age_ms,
    };
  }
  const path = roundtripCachePath(provider);
  if (!existsSync(path)) return { ok: false, reason: "missing recent successful roundtrip", entry: null };
  try {
    const entry = JSON.parse(readFileSync(path, "utf8")) as RoundtripCacheEntry;
    const completedAt = Date.parse(entry.completed_at);
    if (!Number.isFinite(completedAt)) return { ok: false, reason: "cached roundtrip timestamp is invalid", entry };
    const age = Date.now() - completedAt;
    if (age > ttlMs) return { ok: false, reason: `cached roundtrip is stale (${Math.round(age / 1000)}s old)`, entry };
    return { ok: true, entry, age_ms: age };
  } catch (err) {
    return {
      ok: false,
      reason: `cached roundtrip could not be read: ${err instanceof Error ? err.message : String(err)}`,
      entry: null,
    };
  }
}

export function readFreshCodexRoundtripProof(
  ttlMs = CODEX_ROUNDTRIP_PROOF_TTL_MS,
): { ok: true; proof: CodexRoundtripProof; age_ms: number } | { ok: false; reason: string; proof: CodexRoundtripProof | null } {
  if (!existsSync(CODEX_ROUNDTRIP_PROOF_PATH)) {
    return { ok: false, reason: `missing Codex roundtrip proof at ${CODEX_ROUNDTRIP_PROOF_PATH}`, proof: null };
  }
  try {
    const proof = JSON.parse(readFileSync(CODEX_ROUNDTRIP_PROOF_PATH, "utf8")) as CodexRoundtripProof;
    const passedAt = Date.parse(proof.passed_at);
    if (!Number.isFinite(passedAt)) return { ok: false, reason: "Codex roundtrip proof timestamp is invalid", proof };
    const age = Date.now() - passedAt;
    if (age > ttlMs) return { ok: false, reason: `Codex roundtrip proof is stale (${Math.round(age / 1000)}s old)`, proof };
    if (!proof.events_observed?.includes("execution.completed")) {
      return { ok: false, reason: "Codex roundtrip proof does not include execution.completed", proof };
    }
    return { ok: true, proof, age_ms: age };
  } catch (err) {
    return {
      ok: false,
      reason: `Codex roundtrip proof could not be read: ${err instanceof Error ? err.message : String(err)}`,
      proof: null,
    };
  }
}

export function writeCodexRoundtripProof(proof: CodexRoundtripProof): CodexRoundtripProof {
  mkdirSync(dirname(CODEX_ROUNDTRIP_PROOF_PATH), { recursive: true });
  writeFileSync(CODEX_ROUNDTRIP_PROOF_PATH, JSON.stringify(proof, null, 2) + "\n");
  return proof;
}

export function writeSuccessfulRoundtrip(provider: string, evidence: string, ttlSeconds = 60): RoundtripCacheEntry {
  const entry: RoundtripCacheEntry = {
    provider,
    completed_at: new Date().toISOString(),
    evidence,
    ttl_seconds: ttlSeconds,
  };
  const path = roundtripCachePath(provider);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(entry, null, 2) + "\n");
  return entry;
}
