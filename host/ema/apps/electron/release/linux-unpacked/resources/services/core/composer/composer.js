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
import { readdir, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { CONTEXT_FILENAME, PROMPT_FILENAME, RESPONSE_FILENAME, ensureDir, readContext, writeContext, writePrompt, writeResponse, } from './artifact-writer.js';
import { generateRunId, isRunId } from './run-id.js';
const LOG_TAG = '[composer]';
function defaultArtifactsRoot() {
    return join(homedir(), '.local', 'share', 'ema', 'artifacts');
}
function warn(message) {
    // EMA-VOICE: directive, no apology.
    // eslint-disable-next-line no-console
    console.warn(`${LOG_TAG} ${message}`);
}
function buildArtifact(runId, artifactsRoot) {
    const artifactDir = join(artifactsRoot, runId);
    return {
        runId,
        artifactDir,
        promptPath: join(artifactDir, PROMPT_FILENAME),
        contextPath: join(artifactDir, CONTEXT_FILENAME),
        responsePath: join(artifactDir, RESPONSE_FILENAME),
    };
}
function errorMessage(err) {
    if (err instanceof Error)
        return err.message;
    return String(err);
}
export class Composer {
    artifactsRoot;
    constructor(opts = {}) {
        this.artifactsRoot = opts.artifactsRoot ?? defaultArtifactsRoot();
    }
    /**
     * Compile the artifacts for an LLM call. Writes `prompt.md` and
     * `context.json` to a unique per-run directory. Never throws: partial
     * writes degrade into warnings so the caller can still proceed with the
     * LLM invocation.
     */
    async compile(input) {
        const runId = generateRunId();
        const artifact = buildArtifact(runId, this.artifactsRoot);
        const warnings = [];
        try {
            await ensureDir(artifact.artifactDir);
        }
        catch (err) {
            const msg = `Artifact directory unreachable: ${artifact.artifactDir}. Cause: ${errorMessage(err)}. Continuing without on-disk artifacts.`;
            warn(msg);
            warnings.push(msg);
            return { artifact, warnings };
        }
        try {
            await writePrompt(artifact.artifactDir, input.prompt);
        }
        catch (err) {
            const msg = `prompt.md write failed for run ${runId}: ${errorMessage(err)}. Previous artifact preserved.`;
            warn(msg);
            warnings.push(msg);
        }
        const contextFile = {
            runId,
            compiledAt: new Date().toISOString(),
            metadata: input.metadata ?? {},
            context: input.context ?? {},
        };
        try {
            await writeContext(artifact.artifactDir, contextFile);
        }
        catch (err) {
            const msg = `context.json write failed for run ${runId}: ${errorMessage(err)}. Previous artifact preserved.`;
            warn(msg);
            warnings.push(msg);
        }
        return { artifact, warnings };
    }
    /**
     * Record a response against a previously compiled run. Fatal on failure:
     * a missing response is a real problem the caller must see.
     */
    async recordResponse(runId, response) {
        if (!isRunId(runId)) {
            throw new Error(`Invalid run id: ${runId}. Expected a Composer-generated id.`);
        }
        const artifactDir = join(this.artifactsRoot, runId);
        const exists = await directoryExists(artifactDir);
        if (!exists) {
            throw new Error(`Run directory missing: ${artifactDir}. Compile the run before recording a response.`);
        }
        await writeResponse(artifactDir, response);
    }
    /**
     * List compiled artifacts, newest first. The filesystem layout is the
     * source of truth — no database index.
     */
    async list(opts = {}) {
        const limit = opts.limit ?? 50;
        let entries;
        try {
            entries = await readdir(this.artifactsRoot);
        }
        catch {
            return [];
        }
        const runIds = entries.filter(isRunId).sort().reverse().slice(0, limit);
        return runIds.map((runId) => buildArtifact(runId, this.artifactsRoot));
    }
    async get(runId) {
        if (!isRunId(runId))
            return null;
        const artifact = buildArtifact(runId, this.artifactsRoot);
        const exists = await directoryExists(artifact.artifactDir);
        return exists ? artifact : null;
    }
    /** Read the stored context file for a run, or null if unreadable. */
    async readContextFile(runId) {
        const artifact = await this.get(runId);
        if (!artifact)
            return null;
        return readContext(artifact.artifactDir);
    }
}
async function directoryExists(path) {
    try {
        const info = await stat(path);
        return info.isDirectory();
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=composer.js.map