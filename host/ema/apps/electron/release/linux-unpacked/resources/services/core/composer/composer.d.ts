/**
 * Composer — InkOS-pattern LLM call wrapper.
 *
 * Writes inspectable artifacts (`prompt.md`, `context.json`) to disk before a
 * token is spent. If the artifact write fails, the previous artifact (if any)
 * is preserved and the call proceeds with a warning. Responses are recorded
 * separately via `recordResponse()`.
 *
 * Provider-agnostic: Composer does not know about Claude, OpenAI, or any HTTP
 * client. Callers wire the LLM invocation themselves between `compile()` and
 * `recordResponse()`.
 *
 * Voice: error and warning messages follow EMA-VOICE — directive, no
 * apologies, no emojis.
 */
import type { CompileInput, CompileResult, CompiledArtifact, ContextFile } from './types.js';
export interface ComposerOptions {
    artifactsRoot?: string;
}
export declare class Composer {
    private readonly artifactsRoot;
    constructor(opts?: ComposerOptions);
    /**
     * Compile the artifacts for an LLM call. Writes `prompt.md` and
     * `context.json` to a unique per-run directory. Never throws: partial
     * writes degrade into warnings so the caller can still proceed with the
     * LLM invocation.
     */
    compile(input: CompileInput): Promise<CompileResult>;
    /**
     * Record a response against a previously compiled run. Fatal on failure:
     * a missing response is a real problem the caller must see.
     */
    recordResponse(runId: string, response: string): Promise<void>;
    /**
     * List compiled artifacts, newest first. The filesystem layout is the
     * source of truth — no database index.
     */
    list(opts?: {
        limit?: number;
    }): Promise<CompiledArtifact[]>;
    get(runId: string): Promise<CompiledArtifact | null>;
    /** Read the stored context file for a run, or null if unreadable. */
    readContextFile(runId: string): Promise<ContextFile | null>;
}
//# sourceMappingURL=composer.d.ts.map