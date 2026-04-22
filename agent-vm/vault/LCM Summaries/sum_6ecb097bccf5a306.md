# LCM Summary sum_6ecb097bccf5a306

Created: 2026-03-24 22:08:09
Kind: leaf
Depth: 0
Conversation: 1247
Tokens: 1215
Descendants: 0
Earliest: 2026-03-24T21:39:18.000Z
Latest: 2026-03-24T22:04:28.000Z

## Content

[2026-03-24 21:39 UTC]
import { $ as appendFileWithinRoot, A as supportsMemoryMultimodalEmbeddings, At as normalizeAtHashSlug, B as resolveWindowsSpawnProgram, C as isFileMissingError, Ct as resolveAgentWorkspaceDir, D as getMemoryMultimodalExtensions, Dt as resolveSessionAgentId, E as classifyMemoryMultimodalPath, Et as resolveRunModelFallbacksOverride, F as resolveSessionTranscriptPath, Ft as resolveAgentModelPrimaryValue, G as isAudioFileName, H as extensionForMime, I as resolveSessionTranscriptPathInDir, It as toAgentModelListLike, J as normalizeMimeType$1, K as isGifMedia, L as resolveSessionTranscriptsDirForAgent, M as resolveDefaultSessionStorePath, Mt as normalizeStringEntries, N as resolveSessionFilePath, Nt as normalizeStringEntriesLower, O as isMemoryMultimodalEnabled, Ot as resolveSessionAgentIds, P as resolveSessionFilePathOptions, Pt as resolveAgentModelFallbackValues, Q as SafeOpenError, R as resolveStorePath$1, S as splitTextToUtf8ByteLimit, St as resolveAgentSkillsFilter, T as buildCaseInsensitiveExtensionGlob, U as getFileExtension, V as detectMime, W as imageMimeFromFormat, X as maxBytesForKind, Y as MAX_IMAGE_BYTES$1, Z as mediaKindFromMime, _ as remapChunkLines, _t as resolveAgentConfig, a as listSessionFilesForAgent, b as estimateStructuredEmbeddingInputBytes, c as buildMultimodalChunkForIndexing, ct as assertNoPathAliasEscape, d as ensureDir$3, dt as redactToolDetail, et as copyFileWithinRoot, f as hashText$1, ft as compileSafeRegex, g as parseEmbedding, gt as listAgentIds, h as normalizeExtraMemoryPaths, ht as hasConfiguredModelFallbacks, i as buildSessionEntry, it as readLocalFileSafely, j as resolveAgentsDirFromSessionStorePath, jt as normalizeHyphenSlug, k as normalizeMemoryMultimodalSettings, kt as normalizeSkillFilter, l as chunkMarkdown, lt as getDefaultRedactPatterns, m as listMemoryFiles, mt as runTasksWithConcurrency, n as isQueryStopWordToken, nt as openFileWithinRoot, o as sessionPathForFile, ot as writeFileWithinRoot, p as isMemoryPath, pt as testRegexWithBoundedInput, q as kindFromMime, r as requireNodeSqlite, rt as readFileWithinRoot, s as buildFileEntry, st as PATH_ALIAS_POLICIES, t as extractKeywords, tt as createRootScopedReadFile, u as cosineSimilarity, ut as redactSensitiveText, v as runWithConcurrency$1, vt as resolveAgentDir, w as statRegularFile, wt as resolveDefaultAgentId, x as estimateUtf8Bytes, xt as resolveAgentModelFallbacksOverride, y as hasNonTextEmbeddingParts, yt as resolveAgentEffectiveModelPrimary, z as materializeWindowsSpawnProgram } from "./query-expansion-DnS6CGY2.js";
const mapLegacyAudioTranscription = (value) => {
function applyLegacyAudioTranscriptionModel(params) {
	const mapped = mapLegacyAudioTranscription(params.source);
				applyLegacyAudioTranscriptionModel({
		id: "audio.transcription-v2",
		describe: "Move audio.transcription to tools.media.audio.models",
			if (audio?.transcription === void 0) return;
			applyLegacyAudioTranscriptionModel({
				source: audio.transcription,
export type MediaUnderstandingCapability = "image" | "audio" | "video";
export type MediaUnderstandingAttachmentsConfig = {
    /** Select the first matching attachment or process multiple. */
    mode?: "first" | "all";
    /** Max number of attachments to process (default: 1). */
    maxAttachments?: number;
    /** Attachment ordering preference. */
    prefer?: "first" | "last" | "path" | "url";
};
type MediaProviderRequestConfig = {
    /** Optional provider-specific query params (merged into requests). */
    providerOptions?: Record<string, Record<string, string | number | boolean>>;
    /** @deprecated Use providerOptions.deepgram instead. */
    deepgram?: {
        detectLanguage?: boolean;
        punctuate?: boolean;
        smartFormat?: boolean;
    };
    /** Optional base URL override for provider requests. */
    baseUrl?: string;
    /** Optional headers merged into provider requests. */
    headers?: Record<string, string>;
};
export type MediaUnderstandingModelConfig = MediaProviderRequestConfig & {
    /** provider API id (e.g. openai, google). */
    provider?: string;
    /** Model id for provider-based understanding. */
    model?: string;
    /** Optional capability tags for shared model lists. */
    capabilities?: MediaUnderstandingCapability[];
    /** Use a CLI command instead of provider API. */
--
    /** Optional language hint for audio transcription. */
    language?: string;
    /** Auth profile id to use for this provider. */
    profile?: string;
    /** Preferred profile id if multiple are available. */
    preferredProfile?: string;
};
export type MediaUnderstandingConfig = MediaProviderRequestConfig & {

[2026-03-24 21:39 UTC]


[2026-03-24 21:39 UTC]
tools.media.audio: {}
messages.tts: {}

[2026-03-24 21:39 UTC]


[2026-03-24 21:
[LCM fallback summary; truncated for context management]
